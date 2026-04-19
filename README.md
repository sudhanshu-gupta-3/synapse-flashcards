# Synapse ⚡

> Turn any PDF into a smart, practice-ready flashcard deck with AI-powered generation and spaced repetition.

🔗 **Live Demo:** [https://synapse-flashcards.onrender.com](https://synapse-flashcards.onrender.com)

![Python](https://img.shields.io/badge/Python-3.9+-blue) ![Flask](https://img.shields.io/badge/Flask-3.x-green) ![License](https://img.shields.io/badge/License-MIT-purple)

## ✨ Features

- **📄 Smart PDF Ingestion** — Upload any PDF and get 25+ teacher-quality flashcards covering definitions, relationships, edge cases, and worked examples
- **🧠 SM-2 Spaced Repetition** — Battle-tested algorithm that shows you cards at the perfect moment for maximum retention
- **📊 Progress Dashboard** — Mastery rings, activity heatmap, streak tracking, and accuracy analytics
- **📚 Deck Management** — Browse, search, edit, and organize unlimited decks
- **✨ Delightful UX** — Premium dark theme, 3D card flips, confetti celebrations, keyboard shortcuts

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Google Gemini API key (optional — works without it using fallback generation)

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/synapse.git
cd synapse

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
copy .env.example .env
# Edit .env and add your GEMINI_API_KEY (optional)

# Run the app
python app.py
```

Open **http://localhost:5000** in your browser.

## 🏗️ Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | Python, Flask, SQLAlchemy |
| AI | Google Gemini 2.0 Flash |
| PDF Parsing | pdfplumber |
| Database | SQLite |
| Frontend | Vanilla HTML/CSS/JS |
| Algorithm | SM-2 Spaced Repetition |

## 📖 How It Works

1. **Upload** — Drop a PDF (class notes, textbook chapter, study guide)
2. **Generate** — AI analyzes the content and creates comprehensive flashcards
3. **Review** — Practice with beautiful card flips and rate your confidence
4. **Retain** — SM-2 schedules reviews at optimal intervals for long-term memory
5. **Track** — Watch your mastery grow on the dashboard

## 🧠 SM-2 Algorithm

The app implements the SuperMemo SM-2 algorithm:
- Cards rated ≥3 advance with growing intervals (1→6→EF×interval days)
- Cards rated <3 reset to learning phase
- Each card has an individual ease factor (min 1.3) that adjusts with performance
- Forgotten cards enter a relearning phase with shortened intervals

## 📁 Project Structure

```
synapse/
├── app.py              # Flask routes & server
├── config.py           # Configuration
├── models.py           # Database models
├── sm2.py              # SM-2 algorithm
├── pdf_parser.py       # PDF text extraction
├── card_generator.py   # AI flashcard generation
├── requirements.txt    # Python dependencies
├── templates/
│   └── index.html      # Main HTML template
└── static/
    ├── css/style.css    # Premium dark theme
    └── js/
        ├── app.js       # Main app controller
        ├── api.js       # API client
        ├── components.js # UI components
        └── views.js     # Page renderers
```

## 📄 License

MIT License — Built for the Cuemath Challenge
