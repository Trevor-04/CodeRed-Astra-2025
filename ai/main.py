from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import os
from dotenv import load_dotenv
from typing import Optional

load_dotenv()

app = FastAPI(title="Mathpix to Gemini Pipeline")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('models/gemini-2.5-flash-preview-05-20')

# Request models
class ExtractedTextRequest(BaseModel):
    text: str

class UserChoiceRequest(BaseModel):
    option: int  # 1, 2, 3, or 4
    text: str
    custom_input: Optional[str] = None

@app.get("/")
async def root():
    return {"message": "Mathpix to Gemini Pipeline is running", "status": "healthy"}

@app.get("/health")
async def health():
    return {"status": "healthy", "gemini_configured": bool(os.getenv("GEMINI_API_KEY"))}

@app.get("/list-models")
async def list_models():
    """List all available Gemini models for your API key"""
    try:
        models = genai.list_models()
        available = []
        for m in models:
            if 'generateContent' in m.supported_generation_methods:
                available.append({
                    "name": m.name,
                    "display_name": m.display_name
                })
        return {"available_models": available, "count": len(available)}
    except Exception as e:
        return {"error": str(e), "message": "Check your API key"}

@app.post("/present-options")
async def present_options(request: ExtractedTextRequest):
    """
    Takes extracted text from Mathpix and asks Gemini to present 4 options
    """
    try:
        print(f"Received text: {request.text[:100]}...")  # Debug log
        
        prompt = f"""You have just received mathematical or scientific content from a student's notes:

{request.text}

Your job is to present 4 options to the user in a friendly, clear voice. Say this EXACTLY:

"I've analyzed your math notes. Here are your options:

Option 1: I can explain these concepts to you in simple terms.
Option 2: I can quiz you on this material to test your understanding.
Option 3: I can read the entire content aloud to you.
Option 4: You can tell me something specific you'd like me to do.

Please say the number of your choice: 1, 2, 3, or 4."

Keep it conversational and encouraging."""

        print("Calling Gemini API...")  # Debug log
        response = model.generate_content(prompt)
        print("Gemini response received!")  # Debug log
        
        return {
            "success": True,
            "message": response.text,
            "options": [
                {"number": 1, "description": "Explain concepts"},
                {"number": 2, "description": "Quiz me"},
                {"number": 3, "description": "Read aloud"},
                {"number": 4, "description": "Custom request"}
            ]
        }
    except Exception as e:
        print(f"ERROR in present_options: {str(e)}")  # Debug log
        print(f"Error type: {type(e).__name__}")  # Debug log
        import traceback
        traceback.print_exc()  # Full error trace
        raise HTTPException(status_code=500, detail=f"Gemini API Error: {str(e)}")
@app.post("/handle-user-choice")
async def handle_user_choice(request: UserChoiceRequest):
    """
    Handles the user's choice (1, 2, 3, or 4) and processes accordingly
    """
    try:
        if request.option == 1:
            # Option 1: Explain concepts
            result = await explain_concepts(request.text)
        elif request.option == 2:
            # Option 2: Quiz the user
            result = await create_quiz(request.text)
        elif request.option == 3:
            # Option 3: Read aloud (return the text for TTS)
            result = {
                "type": "read_aloud",
                "content": request.text,
                "text_to_speak": f"Here is your content: {request.text}"
            }
        elif request.option == 4:
            # Option 4: Custom request
            if not request.custom_input:
                result = {
                    "type": "prompt",
                    "text_to_speak": "Please tell me what you'd like me to do with your notes."
                }
            else:
                result = await handle_custom_request(request.text, request.custom_input)
        else:
            raise HTTPException(status_code=400, detail="Invalid option. Choose 1, 2, 3, or 4.")
        
        return {
            "success": True,
            "result": result,
            "text_to_speak": result.get("text_to_speak", "")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def explain_concepts(text: str):
    """Option 1: Explain the concepts in simple terms"""
    prompt = f"""You are a patient, encouraging tutor. The student has these math/science notes:

{text}

Explain the main concepts in simple, clear terms. Break down complex equations step-by-step. 
Use analogies where helpful. Be encouraging and make sure they understand.

Format your response to be spoken aloud, so use a conversational tone."""

    response = model.generate_content(prompt)
    
    return {
        "type": "explanation",
        "content": response.text,
        "text_to_speak": response.text
    }

async def create_quiz(text: str):
    """Option 2: Create a quiz"""
    prompt = f"""Based on this math/science content:

{text}

Create a short quiz with 3 questions. For each question:
1. State the question clearly
2. Give the student time to think
3. After each question, say "Please say your answer when ready"

Format this to be spoken aloud in a quiz format. Be encouraging.

Example format:
"Let's test your understanding with a quick quiz!

Question 1: [question text]
Please say your answer when ready.

Question 2: [question text]
Please say your answer when ready.

Question 3: [question text]
Please say your answer when ready."
"""

    response = model.generate_content(prompt)
    
    return {
        "type": "quiz",
        "content": response.text,
        "text_to_speak": response.text
    }

async def handle_custom_request(text: str, custom_input: str):
    """Option 4: Handle custom user request"""
    prompt = f"""A student has these math/science notes:

{text}

They have made this specific request: "{custom_input}"

Help them with their request. Be clear, helpful, and educational.
Format your response to be spoken aloud."""

    response = model.generate_content(prompt)
    
    return {
        "type": "custom",
        "content": response.text,
        "text_to_speak": response.text
    }

@app.post("/process-voice-input")
async def process_voice_input(request: ExtractedTextRequest):
    """
    For Option 4: Process the user's voice input and determine what they want
    """
    try:
        # This interprets what the user said for option 4
        prompt = f"""The user said: "{request.text}"

This is their custom request about their math notes. Interpret what they want and respond appropriately.
Keep your response conversational and helpful, formatted to be spoken aloud."""

        response = model.generate_content(prompt)
        
        return {
            "success": True,
            "interpretation": response.text,
            "text_to_speak": response.text
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)