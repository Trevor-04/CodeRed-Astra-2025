from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import google.generativeai as genai
import os
from dotenv import load_dotenv
from datetime import datetime
import asyncio
import json

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="CodeRed Astra AI Service",
    description="AI-powered backend for accessible note-taking",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini AI
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    print("✅ Gemini AI configured successfully")
else:
    print("⚠️  Warning: GEMINI_API_KEY not found in environment variables")


@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "status": "OK",
        "message": "CodeRed Astra AI Service",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "redoc": "/redoc"
        }
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    gemini_status = "configured" if GEMINI_API_KEY else "not_configured"
    
    return {
        "status": "healthy",
        "service": "AI Backend",
        "gemini": gemini_status,
        "timestamp": datetime.now().isoformat()
    }


@app.get("/models")
async def list_models():
    """List available Gemini models"""
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="Gemini API key not configured"
        )
    
    try:
        models = genai.list_models()
        model_list = [
            {
                "name": model.name,
                "display_name": model.display_name,
                "description": model.description
            }
            for model in models
        ]
        return {
            "status": "success",
            "models": model_list
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error listing models: {str(e)}"
        )


@app.get("/stream")
async def stream_response(
    message: str = Query(..., description="The user's message"),
    context: str = Query("", description="Additional context for the AI")
):
    """Stream AI response character by character"""
    
    async def generate_stream():
        try:
            if GEMINI_API_KEY:
                # Use actual Gemini AI if API key is available
                model = genai.GenerativeModel('gemini-pro')
                
                prompt = f"""Context: {context}

User Question: {message}

Please provide a helpful, clear, and concise response based on the context provided. If you're creating summaries, quizzes, or explanations, make them educational and engaging."""
                
                response = model.generate_content(prompt, stream=True)
                
                for chunk in response:
                    if chunk.text:
                        for char in chunk.text:
                            yield f"data: {char}\n\n"
                            await asyncio.sleep(0.02)
            else:
                # Mock response when API key is not available
                mock_responses = {
                    "summary": f"Here's a summary of the content: The document contains important information about {context[:100] if context else 'the uploaded material'}... This covers key concepts that are essential for understanding the subject matter.",
                    "quiz": "Here are 3 quiz questions based on the content:\\n\\n1. What is the main topic discussed in this material?\\n2. Can you explain the key concept mentioned?\\n3. How would you apply this information in practice?\\n\\nThese questions will help test your understanding of the material.",
                    "explain": "Let me break down the key concepts for you:\\n\\n• The main idea revolves around the core principles outlined in your notes\\n• Important details include the specific examples and case studies mentioned\\n• The practical applications show how this knowledge can be used in real scenarios\\n\\nThis should help clarify the material for better understanding."
                }
                
                # Determine response type based on message content
                response_text = mock_responses["explain"]  # default
                if "summary" in message.lower():
                    response_text = mock_responses["summary"]
                elif "quiz" in message.lower():
                    response_text = mock_responses["quiz"]
                elif "explain" in message.lower():
                    response_text = mock_responses["explain"]
                else:
                    response_text = f"Great question! Based on the content you've shared, I can help you understand this better. {context[:200] if context else 'The material covers several important points that are worth exploring further.'}"
                
                # Stream the mock response character by character
                for char in response_text:
                    yield f"data: {char}\n\n"
                    await asyncio.sleep(0.02)
            
        except Exception as e:
            error_msg = f"I apologize, but I encountered an error while processing your request. Please try again or check if the AI service is properly configured."
            for char in error_msg:
                yield f"data: {char}\n\n"
                await asyncio.sleep(0.02)
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
