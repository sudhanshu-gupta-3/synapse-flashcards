# Synapse — Demo Video Script (You Explaining)

> **Duration:** 2:30 – 3:00
> **Style:** You screen-sharing and talking through the app, like a live demo
> **Tip:** Be natural and conversational. You built this — show it with pride.

---

## INTRO (0:00 – 0:20)

*Start with your screen showing the Synapse dashboard.*

> "Hey! So I built Synapse — it's a flashcard app that takes any PDF and turns it into a smart deck of flashcards using AI."
>
> "The idea is simple: we all know re-reading notes doesn't really work. Cognitive science says active recall and spaced repetition are way more effective. But nobody has time to sit and make flashcards manually. So Synapse does it for you."

---

## UPLOADING A PDF (0:20 – 0:55)

*Click "Upload PDF" in the sidebar.*

> "Let me show you how it works. I'll click Upload PDF here..."

*Drag and drop a PDF file into the upload zone.*

> "I have this chapter on quadratic equations. I'll just drag it in..."

*Wait for the progress bar and generation.*

> "So right now it's uploading the PDF, extracting all the text using pdfplumber, and then sending it to Google's Gemini AI to generate the flashcards."

*Confetti plays, auto-navigates to deck view.*

> "And done! It generated 25 cards from that one PDF. Now the key thing here is — these aren't just simple 'what is X' cards. Let me scroll through..."

*Scroll slowly through the card list.*

> "You can see there are different types — definitions, concepts, relationships, edge cases, even worked examples. Each card is tagged by type and difficulty. The AI is prompted to think like a teacher, not just extract keywords."

---

## THE REVIEW EXPERIENCE (0:55 – 1:40)

*Click "Start Review".*

> "Now let's say I want to study. I click Start Review..."

*A flashcard appears with the question.*

> "So here's my first card. I read the question, I think about it..."

*Click the card to flip it.*

> "Then I flip it — and there's the answer."

*Point at the rating buttons.*

> "Now this is the important part. I rate how well I knew it — Again, Hard, Good, or Easy. This rating feeds into the SM-2 spaced repetition algorithm."

*Click "Good".*

> "So I'll click Good here. What SM-2 does is — it calculates when to show me this card again. If I said Easy, it might not come back for a week. If I said Again, it'll show up again in like a minute. The intervals keep growing as I master the card — 1 day, then 6 days, then 15, then 38."

*Flip and rate 2-3 more cards quickly.*

> "So cards I'm struggling with keep appearing. Cards I know well fade away. I only spend time where it actually matters."

*Complete the session — session summary appears.*

> "And when I finish a session, I get a summary — how many cards I reviewed, how many I got right, my accuracy. If I did well, I get confetti too."

---

## DASHBOARD & PROGRESS (1:40 – 2:10)

*Click "Dashboard" in sidebar.*

> "Now let's go back to the dashboard. This is where I can track my progress over time."

*Point at each element as you mention it.*

> "Here I can see my total cards, my study streak, my accuracy rate, and how many cards I've mastered."

*Point at the heatmap.*

> "This is a 90-day activity heatmap — similar to GitHub's contribution graph. It shows how consistent I've been with my studying."

*Point at the deck card with the mastery bar.*

> "And each deck has a mastery bar — green means mastered, yellow means still learning, gray means new. So at a glance I know exactly where I stand."

*Click "Statistics" in sidebar.*

> "There's also a detailed stats page with all the analytics."

---

## DECK MANAGEMENT (2:10 – 2:25)

*Go back to the deck view.*

> "I can also manage my decks — I can edit any card, delete cards I don't need, or add my own custom cards manually."

*Click the edit button on a card (or the Add Card button).*

> "And I have full-text search across all decks and cards, so as I build up dozens of decks over a semester, I can always find what I need."

---

## CLOSING (2:25 – 2:50)

*Stay on dashboard or deck view.*

> "So to summarize — the whole flow is: drop a PDF, get AI-generated flashcards, review them with spaced repetition, and track your mastery over time."
>
> "The tech stack is Python and Flask on the backend, Gemini API for card generation, SM-2 for the spaced repetition scheduling, and vanilla HTML, CSS, JavaScript on the frontend. No frameworks, no bloat."
>
> "The app is fully deployed and live. There's no signup needed — you just open it, upload a PDF, and start learning."
>
> "That's Synapse. Thanks for watching!"

---

## TIPS FOR RECORDING

1. **Talk naturally.** Don't read word-for-word — use the script as a guide and speak in your own voice.
2. **Move your mouse slowly.** Point at things you're talking about so the viewer follows.
3. **Pause after actions.** Give the viewer 1-2 seconds to see what happened before talking about it.
4. **Use a real PDF.** A textbook chapter or class notes will look much better than a test file.
5. **Record in one take if possible.** It feels more authentic. You can always trim pauses in editing.
6. **Keep it under 3 minutes.** Judges watch a lot of videos — shorter is better.

## TIMING

| Section | Duration | What You Show |
|---------|----------|--------------|
| Intro | 20s | Dashboard, explain the problem |
| Upload PDF | 35s | Drag PDF → generation → card list |
| Review | 45s | Card flip → rating → SM-2 explanation |
| Dashboard | 30s | Stats, heatmap, mastery bar |
| Deck Management | 15s | Edit, add, search |
| Closing | 25s | Summary, tech stack, CTA |
| **Total** | **~2:50** | |
