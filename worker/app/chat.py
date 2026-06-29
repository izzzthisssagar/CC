"""Video chatbot — answer questions about a video using its transcript.

Single-video transcripts are short, so we pass the full transcript as context (no
embeddings/pgvector needed at this scale — that's for cross-video/long content later).
Uses Groq's LLaMA chat model (the Groq key is already configured for STT).
"""

import os

CHAT_MODEL = os.getenv("GROQ_CHAT_MODEL", "llama-3.3-70b-versatile")

SYSTEM = (
    "You answer questions about a single video, using ONLY its transcript below. "
    "The transcript is Nepali / Romanized Nepali / Ninglish (Nepali-English code-switch) "
    "and may contain transcription errors — interpret charitably. If the answer isn't in "
    "the transcript, say so. Reply in the user's language; keep it concise."
)


def answer(transcript: str, question: str, stub: bool = False) -> str:
    if stub or not os.getenv("GROQ_API_KEY"):
        return f"(stub) You asked: {question!r}. Configure GROQ_API_KEY for real answers."

    from groq import Groq

    client = Groq(api_key=os.environ["GROQ_API_KEY"])
    res = client.chat.completions.create(
        model=CHAT_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": f"Transcript:\n{transcript}\n\nQuestion: {question}"},
        ],
        temperature=0.2,
        max_tokens=600,
    )
    return res.choices[0].message.content or ""
