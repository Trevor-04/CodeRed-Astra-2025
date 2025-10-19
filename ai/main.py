from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import os
from dotenv import load_dotenv
from typing import Optional, List

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
    option: int
    text: str
    custom_input: Optional[str] = None

class QuizAnswersRequest(BaseModel):
    quiz_questions: List[str]
    user_answers: List[str]
    original_content: str

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
    """Takes extracted text from Mathpix and asks Gemini to present 4 options"""
    try:
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

        response = model.generate_content(prompt)
        
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
        print(f"ERROR in present_options: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/handle-user-choice")
async def handle_user_choice(request: UserChoiceRequest):
    """Handles the user's choice (1, 2, 3, or 4) and processes accordingly"""
    try:
        if request.option == 1:
            result = await explain_concepts(request.text)
        elif request.option == 2:
            result = await create_quiz(request.text)
        elif request.option == 3:
            result = {
                "type": "read_aloud",
                "content": request.text,
                "text_to_speak": f"Here is your content: {request.text}"
            }
        elif request.option == 4:
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
        print(f"ERROR in handle_user_choice: {str(e)}")
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
    """Option 2: Create a quiz - Returns structured questions"""
    prompt = f"""Based on this STEM content:

{text}

Create exactly 3 quiz questions. For each question:
- Make it clear and specific
- Focus on understanding, not just memorization
- Make sure it can be answered based on the content

Format each question on a separate line like this:
Q1: [question text]
Q2: [question text]
Q3: [question text]

Do NOT include answers or explanations yet - just the questions."""

    response = model.generate_content(prompt)
    
    # Parse questions into a list
    questions_text = response.text
    questions = []
    for line in questions_text.split('\n'):
        if line.strip().startswith('Q'):
            # Remove "Q1:", "Q2:", etc.
            question = line.split(':', 1)[1].strip() if ':' in line else line.strip()
            questions.append(question)
    
    return {
        "type": "quiz",
        "questions": questions,
        "questions_text": questions_text,
        "text_to_speak": "Great! I've prepared a quiz for you. I'll ask you one question at a time."
    }

@app.post("/evaluate-quiz-answers")
async def evaluate_quiz_answers(request: QuizAnswersRequest):
    """Evaluate user's quiz answers at the end"""
    try:
        # Build evaluation prompt
        qa_pairs = []
        for i, (question, answer) in enumerate(zip(request.quiz_questions, request.user_answers), 1):
            qa_pairs.append(f"Question {i}: {question}\nStudent's Answer: {answer}")
        
        qa_text = "\n\n".join(qa_pairs)
        
        prompt = f"""You are evaluating a student's quiz answers based on this original content:

{request.original_content}

Here are the questions and the student's answers:

{qa_text}

For each question:
1. Determine if the answer is CORRECT, PARTIALLY CORRECT, or INCORRECT
2. Provide brief feedback (1-2 sentences)
3. If incorrect, give the correct answer

Format your response like this:
Question 1: [CORRECT/PARTIALLY CORRECT/INCORRECT]
Feedback: [your feedback]
Correct answer: [only if wrong]

Question 2: [status]
...

Be encouraging and constructive, even when answers are wrong."""

        response = model.generate_content(prompt)
        
        return {
            "success": True,
            "evaluation": response.text,
            "text_to_speak": response.text
        }
    except Exception as e:
        print(f"ERROR in evaluate_quiz_answers: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

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
    """For Option 4: Process the user's voice input"""
    try:
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