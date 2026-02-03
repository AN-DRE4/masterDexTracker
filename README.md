# MasterDex Tracker

A local Pokemon collection tracker: a grid of squares, each with a persistent choice (1–3) stored in SQLite. Built with Django and SCSS.

## Prerequisites

- **Python 3.10+**
- No database install needed (SQLite is included with Python)

## Setup

1. **Clone the repository** (if you haven’t already):
   ```bash
   git clone <repo-url>
   cd masterDexTracker
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment:**
   - **Windows (PowerShell):**
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **Windows (Command Prompt):**
     ```cmd
     venv\Scripts\activate.bat
     ```
   - **macOS / Linux:**
     ```bash
     source venv/bin/activate
     ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Run database migrations:**
   ```bash
   python manage.py migrate
   ```

## Run the app

With the virtual environment **activated**:

```bash
python manage.py runserver
```

Then open **http://127.0.0.1:8000/** in your browser.

- You’ll see a 10×10 grid of squares.
- Click a square to open a popup and choose Option 1, 2, or 3.
- Your choice is saved in SQLite and stays selected after refresh.
- SCSS is compiled automatically by django-sass-processor; no extra build step.

## Project structure

- `config/` — Django project settings and root URLs
- `tracker/` — Main app: models, views, templates, static (SCSS + JS)
- `requirements.txt` — Python dependencies
- `db.sqlite3` — Local SQLite database (created after `migrate`; ignored by git)
