# PDF → Quiz Generator (LMS feature)

Tutor uploads a PDF, backend extracts text, sends it to Groq (free, fast LLM API),
gets back 4-option MCQs, frontend displays them.

## 1. Get a free Groq API key
- Go to https://console.groq.com
- Sign up (no card needed)
- Create an API key

## 2. Run the backend

```bash
cd backend
pip install -r requirements.txt
export GROQ_API_KEY="your_key_here"      # Windows: set GROQ_API_KEY=your_key_here
uvicorn main:app --reload --port 8000
```

Check it's alive:
```bash
curl http://localhost:8000/
# {"status":"ok","groq_configured":true}
```

## 3. Run the frontend

The frontend has been upgraded to a **React** application with a cinematic, modern, and animated UI.

### Option A: Local Development (Recommended)
Run the hot-reloading development server:
```bash
cd frontend
npm run dev
```
Open `http://localhost:5173` in your browser.

### Option B: Static Production Build
Open the compiled production build `index.html` directly from the project root in your browser (it has been built with relative paths to allow direct local execution).

- Backend URL box: Set to your running backend (defaults to `http://localhost:8000`)

## 4. Test it worked (already verified in sandbox)
- ✅ Server boots and responds to health check
- ✅ PDF upload accepted, text extracted correctly (tested with a sample PDF)
- ✅ Clean error returned when GROQ_API_KEY missing (proves error handling works)
- ⏳ Actual quiz generation — test this yourself once you add your real Groq key,
  since it needs internet access to groq.com

## 5. Deploy free (once local test works)
| Part | Where | How |
|---|---|---|
| Backend | Render.com free tier | New Web Service → point to `backend/` → set `GROQ_API_KEY` in env vars → start command: `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| Frontend | Vercel or Netlify free | Just drag-drop the `frontend/` folder, or `vercel deploy` |
| After deploy | Update `Backend URL` box in the frontend to your Render URL | |

## Next step for real LMS integration
Right now questions are shown, not saved. Next you'd add:
- Supabase (free Postgres) table `questions` (course_id, question, option_a-d, correct_answer)
- Save endpoint after generation
- Student-facing quiz page that reads from DB instead of regenerating
