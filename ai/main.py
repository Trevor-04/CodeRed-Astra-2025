from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
import os
from dotenv import load_dotenv
from datetime import datetime

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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
