import os
import json
import fitz  # PyMuPDF
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from dotenv import load_dotenv
from groq import Groq

# Load local environment variables from .env if present
load_dotenv()

app = FastAPI(title="PDF Quiz Generator")

# Allow frontend to call this backend from any origin (tighten in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Pull raw text out of a PDF using PyMuPDF."""
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    return text.strip()


def build_auto_prompt(text: str, num_questions: int) -> str:
    # Cap text sent to the model so we don't blow context/costs on huge PDFs
    trimmed = text[:12000]
    return f"""You are a quiz generator for a university LMS.
Based ONLY on the content below, generate {num_questions} multiple choice questions.

Rules:
- Each question must have exactly 4 options: A, B, C, D
- Only one correct answer per question
- Questions must test understanding of the content, not trivial wording
- Return ONLY valid JSON, no markdown, no preamble, in this exact format:

[
  {{
    "question": "...",
    "option_a": "...",
    "option_b": "...",
    "option_c": "...",
    "option_d": "...",
    "correct_answer": "A"
  }}
]

Content:
{trimmed}
"""


def build_custom_prompt(text: str, custom_questions: list) -> str:
    trimmed = text[:12000]
    questions_formatted = "\n".join(f"- {q}" for q in custom_questions)
    return f"""You are a quiz generator for a university LMS.
The user has provided the following question prompts/topics:
{questions_formatted}

Based ONLY on the content below, convert each of these custom question prompts into a high-quality 4-option multiple choice question (A, B, C, D) with one correct answer.
Verify the correct answer using the provided text.

Rules:
- Generate exactly 4 options: A, B, C, D for each question
- Only one correct answer per question
- Return ONLY valid JSON, no markdown, no preamble, in this exact format:

[
  {{
    "question": "...",
    "option_a": "...",
    "option_b": "...",
    "option_c": "...",
    "option_d": "...",
    "correct_answer": "A"
  }}
]

Content:
{trimmed}
"""


@app.get("/")
def health():
    return {"status": "ok", "groq_configured": client is not None}


@app.post("/generate-quiz")
async def generate_quiz(
    file: UploadFile = File(...),
    num_questions: int = 5,
    custom_questions: Optional[str] = Form(None)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are supported")

    file_bytes = await file.read()
    text = extract_text_from_pdf(file_bytes)

    if len(text) < 50:
        raise HTTPException(400, "Couldn't extract enough text from this PDF (might be scanned/image-based)")

    if client is None:
        raise HTTPException(500, "GROQ_API_KEY not set on server. Set it as an env variable.")

    # Determine which prompt to use based on custom_questions presence
    if custom_questions and custom_questions.strip():
        # Split by newlines and filter out empty lines
        q_list = [q.strip() for q in custom_questions.split("\n") if q.strip()]
        if not q_list:
            prompt = build_auto_prompt(text, num_questions)
        else:
            prompt = build_custom_prompt(text, q_list)
    else:
        prompt = build_auto_prompt(text, num_questions)

    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
    )

    raw = completion.choices[0].message.content.strip()

    # Model sometimes wraps JSON in ```json fences - strip them
    if raw.startswith("```"):
        raw = raw.strip("`")
        if raw.startswith("json"):
            raw = raw[4:].strip()

    try:
        questions = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(500, f"AI returned invalid JSON: {raw[:300]}")

    return {
        "filename": file.filename,
        "extracted_chars": len(text),
        "questions": questions,
    }