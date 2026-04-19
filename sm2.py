from datetime import datetime, timedelta


def sm2_algorithm(quality, repetitions, ease_factor, interval):
    """
    SM-2 Spaced Repetition Algorithm.

    quality: 0-5 rating
    Returns: (new_repetitions, new_ease_factor, new_interval)
    """
    if quality >= 3:
        if repetitions == 0:
            interval = 1
        elif repetitions == 1:
            interval = 6
        else:
            interval = round(interval * ease_factor)
        repetitions += 1
    else:
        repetitions = 0
        interval = 1

    ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    ease_factor = max(1.3, ease_factor)

    return repetitions, ease_factor, interval


def get_next_review_date(interval):
    """Calculate next review date from interval in days."""
    return datetime.utcnow() + timedelta(days=interval)


def get_card_status(repetitions, ease_factor):
    """Determine card mastery status."""
    if repetitions == 0:
        return 'new'
    elif repetitions < 3:
        return 'learning'
    elif repetitions < 5 or ease_factor < 2.0:
        return 'reviewing'
    else:
        return 'mastered'
