from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone

db = SQLAlchemy()


class Deck(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, default='')
    tags = db.Column(db.String(500), default='')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))
    cards = db.relationship('Card', backref='deck', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        cards_list = self.cards
        mastered = sum(1 for c in cards_list if c.repetitions >= 5 and c.ease_factor >= 2.0)
        learning = sum(1 for c in cards_list if 0 < c.repetitions < 5)
        new_count = sum(1 for c in cards_list if c.repetitions == 0)
        due_now = sum(1 for c in cards_list if c.next_review and c.next_review <= datetime.now(timezone.utc))
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'tags': [t.strip() for t in self.tags.split(',') if t.strip()] if self.tags else [],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'card_count': len(cards_list),
            'mastered': mastered,
            'learning': learning,
            'new': new_count,
            'due': due_now,
        }


class Card(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    deck_id = db.Column(db.Integer, db.ForeignKey('deck.id'), nullable=False)
    front = db.Column(db.Text, nullable=False)
    back = db.Column(db.Text, nullable=False)
    card_type = db.Column(db.String(50), default='concept')
    difficulty = db.Column(db.String(20), default='medium')
    tags = db.Column(db.String(500), default='')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # SM-2 fields
    ease_factor = db.Column(db.Float, default=2.5)
    interval = db.Column(db.Integer, default=0)
    repetitions = db.Column(db.Integer, default=0)
    next_review = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    last_reviewed = db.Column(db.DateTime, nullable=True)

    reviews = db.relationship('ReviewLog', backref='card', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        from sm2 import get_card_status
        return {
            'id': self.id,
            'deck_id': self.deck_id,
            'front': self.front,
            'back': self.back,
            'card_type': self.card_type,
            'difficulty': self.difficulty,
            'tags': [t.strip() for t in self.tags.split(',') if t.strip()] if self.tags else [],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'status': get_card_status(self.repetitions, self.ease_factor),
            'sm2': {
                'ease_factor': round(self.ease_factor, 2),
                'interval': self.interval,
                'repetitions': self.repetitions,
                'next_review': self.next_review.isoformat() if self.next_review else None,
                'last_reviewed': self.last_reviewed.isoformat() if self.last_reviewed else None,
            }
        }


class ReviewLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    card_id = db.Column(db.Integer, db.ForeignKey('card.id'), nullable=False)
    quality = db.Column(db.Integer, nullable=False)
    reviewed_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))


class StudySession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, default=lambda: datetime.now(timezone.utc).date())
    cards_reviewed = db.Column(db.Integer, default=0)
    cards_correct = db.Column(db.Integer, default=0)
