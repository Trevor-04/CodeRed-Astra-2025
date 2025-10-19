# python notesLlm.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
from google import genai
from google.genai import types
from dotenv import load_dotenv
import asyncio

load_dotenv()
client = genai.Client()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins during dev
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/stream")
async def stream(message: str = "Explain AI to me", context: str = ""):
    async def event_generator():
        # Build the prompt with context
        if context:
            prompt = f"""You are an AI assistant helping a student understand their notes.

            Context from the student's notes:
            {context}

            Student's question: {message}

        Please provide a helpful, clear response based on the notes provided."""
        else:
            prompt = message
        
        response = client.models.generate_content_stream(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                thinking_config=types.ThinkingConfig(thinking_budget=0)
            ),
        )

        for chunk in response:
            text = chunk.text
            # Split into very small chunks for smooth typing effect
            for char in text:
                yield {"data": char}
                await asyncio.sleep(0.005)  # tiny pause to smooth animation

    return EventSourceResponse(event_generator())


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
