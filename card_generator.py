import json
import re
import os


def generate_flashcards(text, api_key=None, num_cards=25):
    """Generate flashcards from text. Uses Gemini API if key provided, else fallback."""
    if api_key:
        try:
            return _generate_with_gemini(text, api_key, num_cards)
        except Exception as e:
            print(f"Gemini API error: {e}. Falling back to basic generation.")
            return _generate_fallback(text, num_cards)
    return _generate_fallback(text, num_cards)


def _generate_with_gemini(text, api_key, num_cards=25):
    """Generate flashcards using Google Gemini API."""
    import google.generativeai as genai

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.0-flash')

    # Truncate text if too long
    max_chars = 12000
    truncated = text[:max_chars] if len(text) > max_chars else text

    prompt = f"""You are an expert teacher creating flashcards from study material.

Generate exactly {num_cards} high-quality flashcards from the following text.

Create a DIVERSE MIX of card types:
- DEFINITION (20%): Key terms with precise, contextual definitions
- CONCEPT (25%): Core concepts requiring explanation
- RELATIONSHIP (15%): How concepts connect, compare, or contrast
- EDGE_CASE (15%): Tricky exceptions, special cases, common mistakes
- EXAMPLE (15%): Worked examples with step-by-step solutions
- APPLICATION (10%): Real-world applications or "when/why would you use this?"

Rules for quality:
1. Questions should test UNDERSTANDING, not just recall
2. Answers should be concise but complete (2-4 sentences max)
3. Include specific details, numbers, and examples from the text
4. Cards should progress from fundamental to advanced
5. Avoid trivially obvious questions

Return ONLY a valid JSON array (no markdown, no code fences) with this exact structure:
[
  {{
    "front": "Question text here",
    "back": "Answer text here",
    "type": "DEFINITION|CONCEPT|RELATIONSHIP|EDGE_CASE|EXAMPLE|APPLICATION",
    "difficulty": "easy|medium|hard",
    "tags": ["topic1", "topic2"]
  }}
]

STUDY MATERIAL:
{truncated}"""

    response = model.generate_content(prompt)
    response_text = response.text.strip()

    # Clean markdown code fences if present
    response_text = re.sub(r'^```(?:json)?\s*', '', response_text)
    response_text = re.sub(r'\s*```$', '', response_text)

    cards = json.loads(response_text)

    # Validate and normalize
    valid_types = {'DEFINITION', 'CONCEPT', 'RELATIONSHIP', 'EDGE_CASE', 'EXAMPLE', 'APPLICATION'}
    valid_difficulties = {'easy', 'medium', 'hard'}
    validated = []
    for card in cards:
        if 'front' in card and 'back' in card:
            validated.append({
                'front': card['front'],
                'back': card['back'],
                'type': card.get('type', 'CONCEPT') if card.get('type') in valid_types else 'CONCEPT',
                'difficulty': card.get('difficulty', 'medium') if card.get('difficulty') in valid_difficulties else 'medium',
                'tags': card.get('tags', []) if isinstance(card.get('tags'), list) else [],
            })

    return validated


def _generate_fallback(text, num_cards=15):
    """Generate basic flashcards without AI using text analysis."""
    sentences = re.split(r'[.!?]+', text)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 30]

    cards = []

    # Extract definition-like sentences
    for sent in sentences:
        if len(cards) >= num_cards:
            break
        # Pattern: "X is/are Y" or "X refers to Y"
        match = re.match(r'^(.{5,60}?)\s+(?:is|are|refers to|means|denotes|represents)\s+(.{15,})', sent, re.IGNORECASE)
        if match:
            term = match.group(1).strip()
            definition = match.group(2).strip()
            cards.append({
                'front': f"What is {term.lower()}?",
                'back': f"{term} is {definition}.",
                'type': 'DEFINITION',
                'difficulty': 'easy',
                'tags': _extract_tags(sent),
            })

    # Extract key facts from remaining sentences
    for sent in sentences:
        if len(cards) >= num_cards:
            break
        if len(sent) > 40 and not any(sent in c['back'] for c in cards):
            # Create a fill-in-the-blank style card
            words = sent.split()
            if len(words) > 6:
                # Find important words (capitalized, numbers, quoted)
                key_words = [w for w in words if w[0].isupper() or w.replace('.', '').replace(',', '').isdigit()]
                if key_words:
                    key_word = key_words[min(1, len(key_words) - 1)]
                    question = sent.replace(key_word, "______")
                    cards.append({
                        'front': f"Fill in the blank: {question}",
                        'back': key_word,
                        'type': 'CONCEPT',
                        'difficulty': 'medium',
                        'tags': _extract_tags(sent),
                    })

    # If still not enough cards, create broader questions
    paragraphs = text.split('\n\n')
    for para in paragraphs:
        if len(cards) >= num_cards:
            break
        if len(para.strip()) > 80:
            first_sent = para.strip().split('.')[0]
            if len(first_sent) > 20:
                cards.append({
                    'front': f"Explain the following concept: {first_sent.strip()[:100]}",
                    'back': para.strip()[:300],
                    'type': 'CONCEPT',
                    'difficulty': 'medium',
                    'tags': _extract_tags(para),
                })

    if not cards:
        # Ultimate fallback - just split text into chunks
        chunks = [text[i:i+200] for i in range(0, min(len(text), 3000), 200)]
        for i, chunk in enumerate(chunks[:num_cards]):
            cards.append({
                'front': f"Review the following material and summarize the key point:\n{chunk[:100]}...",
                'back': chunk,
                'type': 'CONCEPT',
                'difficulty': 'medium',
                'tags': [],
            })

    return cards


def _extract_tags(text):
    """Extract potential topic tags from text."""
    # Find capitalized multi-word terms
    tags = set()
    matches = re.findall(r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b', text)
    for m in matches[:3]:
        if len(m) > 2 and m.lower() not in {'the', 'this', 'that', 'these', 'those', 'there'}:
            tags.add(m.lower())
    return list(tags)[:3]
