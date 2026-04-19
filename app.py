import os
import uuid
from datetime import datetime, timezone, timedelta
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from config import Config
from models import db, Deck, Card, ReviewLog, StudySession
from pdf_parser import extract_text_from_pdf, get_pdf_metadata
from card_generator import generate_flashcards
from sm2 import sm2_algorithm, get_next_review_date


def create_app():
    app = Flask(__name__, static_folder='static', template_folder='templates')
    app.config.from_object(Config)
    CORS(app)
    db.init_app(app)

    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    with app.app_context():
        db.create_all()

    # ─── Serve Frontend ───────────────────────────────────────────
    @app.route('/')
    def index():
        return send_from_directory('templates', 'index.html')

    @app.route('/static/<path:path>')
    def serve_static(path):
        return send_from_directory('static', path)

    # ─── PDF Upload & Card Generation ─────────────────────────────
    @app.route('/api/upload', methods=['POST'])
    def upload_pdf():
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        if not file.filename or not file.filename.lower().endswith('.pdf'):
            return jsonify({'error': 'Please upload a PDF file'}), 400

        # Save file
        filename = f"{uuid.uuid4().hex}_{file.filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        try:
            # Extract text
            text = extract_text_from_pdf(filepath)
            metadata = get_pdf_metadata(filepath)

            # Generate flashcards
            api_key = app.config.get('GEMINI_API_KEY', '')
            raw_cards = generate_flashcards(text, api_key if api_key else None)

            # Create deck
            deck_name = metadata.get('title') or os.path.splitext(file.filename)[0]
            deck = Deck(
                name=deck_name,
                description=f"Generated from {file.filename} ({metadata.get('pages', '?')} pages)",
                tags=','.join(set(tag for c in raw_cards for tag in c.get('tags', [])))[:500],
            )
            db.session.add(deck)
            db.session.flush()

            # Create cards
            for rc in raw_cards:
                card = Card(
                    deck_id=deck.id,
                    front=rc['front'],
                    back=rc['back'],
                    card_type=rc.get('type', 'CONCEPT').lower(),
                    difficulty=rc.get('difficulty', 'medium'),
                    tags=','.join(rc.get('tags', [])),
                )
                db.session.add(card)

            db.session.commit()

            return jsonify({
                'success': True,
                'deck': deck.to_dict(),
                'message': f'Generated {len(raw_cards)} flashcards from "{deck_name}"'
            }), 201

        except ValueError as e:
            return jsonify({'error': str(e)}), 400
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'Failed to process PDF: {str(e)}'}), 500
        finally:
            # Clean up uploaded file
            if os.path.exists(filepath):
                os.remove(filepath)

    # ─── Decks ────────────────────────────────────────────────────
    @app.route('/api/decks', methods=['GET'])
    def get_decks():
        decks = Deck.query.order_by(Deck.updated_at.desc()).all()
        return jsonify([d.to_dict() for d in decks])

    @app.route('/api/decks/<int:deck_id>', methods=['GET'])
    def get_deck(deck_id):
        deck = Deck.query.get_or_404(deck_id)
        deck_data = deck.to_dict()
        deck_data['cards'] = [c.to_dict() for c in deck.cards]
        return jsonify(deck_data)

    @app.route('/api/decks/<int:deck_id>', methods=['PUT'])
    def update_deck(deck_id):
        deck = Deck.query.get_or_404(deck_id)
        data = request.get_json()
        if 'name' in data:
            deck.name = data['name']
        if 'description' in data:
            deck.description = data['description']
        if 'tags' in data:
            deck.tags = ','.join(data['tags']) if isinstance(data['tags'], list) else data['tags']
        db.session.commit()
        return jsonify(deck.to_dict())

    @app.route('/api/decks/<int:deck_id>', methods=['DELETE'])
    def delete_deck(deck_id):
        deck = Deck.query.get_or_404(deck_id)
        db.session.delete(deck)
        db.session.commit()
        return jsonify({'success': True})

    # ─── Cards ────────────────────────────────────────────────────
    @app.route('/api/decks/<int:deck_id>/review', methods=['GET'])
    def get_review_cards(deck_id):
        deck = Deck.query.get_or_404(deck_id)
        now = datetime.now(timezone.utc)
        limit = request.args.get('limit', 20, type=int)

        # Get due cards (review) + new cards
        due_cards = Card.query.filter(
            Card.deck_id == deck_id,
            Card.next_review <= now,
            Card.repetitions > 0,
        ).order_by(Card.next_review.asc()).all()

        new_cards = Card.query.filter(
            Card.deck_id == deck_id,
            Card.repetitions == 0,
        ).order_by(Card.id.asc()).limit(max(0, limit - len(due_cards))).all()

        review_cards = due_cards + new_cards
        review_cards = review_cards[:limit]

        return jsonify({
            'deck': deck.to_dict(),
            'cards': [c.to_dict() for c in review_cards],
            'total_due': len(due_cards),
            'total_new': Card.query.filter(Card.deck_id == deck_id, Card.repetitions == 0).count(),
        })

    @app.route('/api/cards/<int:card_id>/review', methods=['POST'])
    def review_card(card_id):
        card = Card.query.get_or_404(card_id)
        data = request.get_json()
        quality = data.get('quality', 3)

        if not (0 <= quality <= 5):
            return jsonify({'error': 'Quality must be 0-5'}), 400

        # Apply SM-2
        new_reps, new_ef, new_interval = sm2_algorithm(
            quality, card.repetitions, card.ease_factor, card.interval
        )

        card.repetitions = new_reps
        card.ease_factor = new_ef
        card.interval = new_interval
        card.next_review = get_next_review_date(new_interval)
        card.last_reviewed = datetime.now(timezone.utc)

        # Log review
        log = ReviewLog(card_id=card.id, quality=quality)
        db.session.add(log)

        # Update study session
        today = datetime.now(timezone.utc).date()
        session = StudySession.query.filter_by(date=today).first()
        if not session:
            session = StudySession(date=today, cards_reviewed=0, cards_correct=0)
            db.session.add(session)
        session.cards_reviewed += 1
        if quality >= 3:
            session.cards_correct += 1

        db.session.commit()

        return jsonify({
            'card': card.to_dict(),
            'next_review': card.next_review.isoformat(),
            'interval_days': new_interval,
        })

    @app.route('/api/cards/<int:card_id>', methods=['PUT'])
    def update_card(card_id):
        card = Card.query.get_or_404(card_id)
        data = request.get_json()
        if 'front' in data:
            card.front = data['front']
        if 'back' in data:
            card.back = data['back']
        if 'card_type' in data:
            card.card_type = data['card_type']
        if 'difficulty' in data:
            card.difficulty = data['difficulty']
        db.session.commit()
        return jsonify(card.to_dict())

    @app.route('/api/cards/<int:card_id>', methods=['DELETE'])
    def delete_card(card_id):
        card = Card.query.get_or_404(card_id)
        db.session.delete(card)
        db.session.commit()
        return jsonify({'success': True})

    @app.route('/api/decks/<int:deck_id>/cards', methods=['POST'])
    def add_card(deck_id):
        Deck.query.get_or_404(deck_id)
        data = request.get_json()
        card = Card(
            deck_id=deck_id,
            front=data['front'],
            back=data['back'],
            card_type=data.get('card_type', 'concept'),
            difficulty=data.get('difficulty', 'medium'),
        )
        db.session.add(card)
        db.session.commit()
        return jsonify(card.to_dict()), 201

    # ─── Stats ────────────────────────────────────────────────────
    @app.route('/api/stats', methods=['GET'])
    def get_stats():
        total_cards = Card.query.count()
        total_decks = Deck.query.count()
        mastered = Card.query.filter(Card.repetitions >= 5, Card.ease_factor >= 2.0).count()
        learning = Card.query.filter(Card.repetitions > 0, Card.repetitions < 5).count()
        new_cards = Card.query.filter(Card.repetitions == 0).count()

        # Streak calculation
        today = datetime.now(timezone.utc).date()
        streak = 0
        check_date = today
        while True:
            session = StudySession.query.filter_by(date=check_date).first()
            if session and session.cards_reviewed > 0:
                streak += 1
                check_date -= timedelta(days=1)
            else:
                break

        # Total reviews
        total_reviews = ReviewLog.query.count()

        # Accuracy
        correct_reviews = ReviewLog.query.filter(ReviewLog.quality >= 3).count()
        accuracy = round((correct_reviews / total_reviews * 100), 1) if total_reviews > 0 else 0

        # Today's stats
        today_session = StudySession.query.filter_by(date=today).first()

        return jsonify({
            'total_cards': total_cards,
            'total_decks': total_decks,
            'mastered': mastered,
            'learning': learning,
            'new': new_cards,
            'streak': streak,
            'total_reviews': total_reviews,
            'accuracy': accuracy,
            'today': {
                'reviewed': today_session.cards_reviewed if today_session else 0,
                'correct': today_session.cards_correct if today_session else 0,
            }
        })

    @app.route('/api/stats/heatmap', methods=['GET'])
    def get_heatmap():
        today = datetime.now(timezone.utc).date()
        start_date = today - timedelta(days=90)
        sessions = StudySession.query.filter(StudySession.date >= start_date).all()
        heatmap = {}
        for s in sessions:
            heatmap[s.date.isoformat()] = s.cards_reviewed
        return jsonify(heatmap)

    # ─── Search ───────────────────────────────────────────────────
    @app.route('/api/search', methods=['GET'])
    def search():
        q = request.args.get('q', '').strip()
        if not q:
            return jsonify({'decks': [], 'cards': []})

        decks = Deck.query.filter(
            db.or_(Deck.name.ilike(f'%{q}%'), Deck.tags.ilike(f'%{q}%'))
        ).all()

        cards = Card.query.filter(
            db.or_(Card.front.ilike(f'%{q}%'), Card.back.ilike(f'%{q}%'))
        ).limit(20).all()

        return jsonify({
            'decks': [d.to_dict() for d in decks],
            'cards': [c.to_dict() for c in cards],
        })

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
