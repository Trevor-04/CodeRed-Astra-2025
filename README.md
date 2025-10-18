# CodeRed-Astra-2025

An accessible note-taking application designed for everyone, including users with visual, hearing, or learning impairments.

## Features

- **AI-Powered Chat**: Ask questions, get summaries, and generate quizzes from your notes
- **Text-to-Speech**: Eleven Labs integration for visually impaired users
- **Speech-to-Text**: Transcription for audio/video lectures for hearing-impaired users
- **Universal Accessibility**: Keyboard navigation, screen reader support, and high contrast mode
- **Dyslexia Support**: Optimized reading experience

## Tech Stack

- **Frontend**: React (Vite) + TailwindCSS
- **Backend**: Node.js + Express
- **AI Backend**: FastAPI + Google Gemini
- **Database**: Supabase

## Project Structure

```
.
├── frontend/          # React + Vite + TailwindCSS
├── backend/           # Node.js + Express API
├── ai/                # FastAPI + Gemini AI service
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- Python (v3.9 or higher)
- npm or yarn
- pip

### Frontend Setup (React + Vite + TailwindCSS)

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Install TailwindCSS:

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

4. Configure TailwindCSS by updating `tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

5. Update `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

6. Run the development server:

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Backend Setup (Node.js + Express)

1. Create and navigate to the backend directory:

```bash
cd backend
```


2. Install dependencies:

```bash
npm install
```

3. Create `.env` file:

```env
PORT=3000
NODE_ENV=development
```

4. Run the development server:

```bash
npm run dev
```

The backend will be available at `http://localhost:3000`

### AI Backend Setup (FastAPI + Gemini)

1. Create and navigate to the ai directory:

```bash
cd ai
```

2. Create a virtual environment:

```bash
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate
```

3. Install dependencies:

```bash
pip install -r requirement.txt
```

4. Create `.env` file:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

5. Run the FastAPI server:

```bash
uvicorn main:app --reload
```

The AI backend will be available at `http://localhost:8000`

API documentation will be available at `http://localhost:8000/docs`

### Supabase Setup

1. Create a Supabase project at [https://supabase.com](https://supabase.com)

2. Get your API keys from Project Settings > API

3. Add Supabase credentials to your backend `.env`:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
```

4. Install Supabase client in backend:

```bash
cd backend
npm install @supabase/supabase-js
```

## Development

To run the full application:

1. Start the frontend (Terminal 1):

```bash
cd frontend
npm run dev
```

2. Start the backend (Terminal 2):

```bash
cd backend
npm run dev
```

3. Start the AI service (Terminal 3):

```bash
cd ai
source venv/bin/activate  # or venv\Scripts\activate on Windows
uvicorn main:app --reload
```

## Environment Variables

### Backend (.env)

- `PORT`: Server port (default: 3000)
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Your Supabase anon/public key
- `NODE_ENV`: Environment (development/production)

### AI Service (.env)

- `GEMINI_API_KEY`: Your Google Gemini API key

## API Endpoints

### Backend (http://localhost:3000)

- `GET /api/health` - Health check endpoint

### AI Service (http://localhost:8000)

- `GET /` - Root endpoint
- `GET /health` - Health check endpoint
- `GET /docs` - Interactive API documentation (Swagger UI)

## License

MIT
