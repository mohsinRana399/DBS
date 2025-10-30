"""
FastAPI Backend Server for Databricks PDF Processing
Replaces Streamlit with REST API endpoints
"""
import os
import sys
import logging
from typing import Optional
from datetime import datetime
import time
import json
from fastapi import FastAPI, HTTPException, UploadFile, File, Depends,Form
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv
# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.src.databricks_api import DatabricksAPIIntegration
from backend.src.pdf_manager import PDFManager
from backend.src.databricks_ai_engine import DatabricksAIEngine
from backend.utils.prompt_loader import load_prompts
from backend.utils.retry_helper import analyze_with_cached_text_retries, normalize_answer

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Databricks PDF Processing API",
    description="REST API for PDF upload, processing, and AI-powered querying using Databricks",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for connections
databricks_api: Optional[DatabricksAPIIntegration] = None
pdf_manager: Optional[PDFManager] = None
ai_engine: Optional[DatabricksAIEngine] = None

# Dependency to get databricks connection
async def get_databricks_connection():
    global databricks_api
    if not databricks_api:
        raise HTTPException(status_code=400, detail="Databricks connection not established")
    return databricks_api

@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Databricks PDF Processing API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running"
    }

@app.get("/api/databricks/setup")
async def setup_system():
    """Initialize Databricks connection and configure AI in one step."""
    global databricks_api, pdf_manager, ai_engine

    DATABRICKS_HOST = os.getenv("DATABRICKS_HOST")
    DATABRICKS_TOKEN = os.getenv("DATABRICKS_TOKEN")
    provider = os.getenv("AI_PROVIDER", "databricks")
    model = os.getenv("AI_MODEL", "databricks-gpt-oss-120b")

    try:
        # Step 1: Connect to Databricks
        databricks_api = DatabricksAPIIntegration(DATABRICKS_HOST, DATABRICKS_TOKEN)
        connection_result = databricks_api.test_connection()

        if not connection_result["success"]:
            return {
                "success": False,
                "stage": "databricks_connect",
                "error": connection_result.get("error"),
            }

        # Step 2: Initialize PDF Manager
        pdf_manager = PDFManager(databricks_api.client)

        # Step 3: Get workspace info (clusters etc.)
        try:
            clusters = databricks_api.get_cluster_info()
        except Exception as e:
            clusters = f"Failed to fetch clusters: {str(e)}"

        # Step 4: Configure AI
        ai_config_result = {}
        if provider == "databricks":
            ai_engine = DatabricksAIEngine(databricks_client=databricks_api.client, model=model)
            ai_config_result = {
                "success": True,
                "provider": "databricks",
                "model": model,
                "message": "Databricks AI configured successfully",
            }

        else:
            ai_config_result = {"success": False, "error": f"Unsupported AI provider: {provider}"}

        # Step 5: Return combined response
        return {
            "success": True,
            "databricks": {
                "connected": True,
                "user": connection_result.get("user"),
                "workspace_url": connection_result.get("workspace_url"),
                "clusters": clusters,
            },
            "ai": ai_config_result,
            "timestamp": datetime.now().isoformat(),
        }

    except Exception as e:
        logger.error(f"Setup failed: {str(e)}")
        return {"success": False, "error": str(e)}

async def upload_pdf_direct_method(file_content: bytes, filename: str, db: DatabricksAPIIntegration) -> bool:
    """
    Upload PDF using the proven method from single-page-app (demo-try2.py)
    """
    try:
        import base64
        import requests

        # Get Databricks credentials
        host = db.client.host.rstrip('/')
        token = db.client.token

        # Prepare the API call (same as demo-try2.py)
        url = f"{host}/api/2.0/workspace/import"
        headers = {"Authorization": f"Bearer {token}"}

        # Base64 encode the file content
        b64_data = base64.b64encode(file_content).decode("utf-8")

        data = {
            "path": f"/Workspace/Shared/pdf_uploads/{filename}",
            "overwrite": True,
            "format": "AUTO",      # AUTO = auto-detect notebook type
            "language": "PYTHON",  # Needed for notebooks, ignored for binary files
            "content": b64_data
        }

        # Make the API call
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()

        logger.info(f"Direct upload successful for {filename} ✅")
        return True

    except Exception as e:
        logger.error(f"Direct upload failed for {filename}: {str(e)}")
        return False

@app.post("/api/pdf/upload-and-analyze")
async def upload_and_analyze_pdf(
    file: UploadFile = File(...),  
    prompts_json: str = Form(...),
    db: DatabricksAPIIntegration = Depends(get_databricks_connection)
):
    """Upload a PDF and immediately analyze it with hardcoded prompts."""
    try:
        # Validate file type
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")

        # Read file content
        file_content = await file.read()

        # Upload to Databricks Workspace
        success = await upload_pdf_direct_method(
            file_content=file_content,
            filename=file.filename,
            db=db
        )

        if not success:
            raise HTTPException(status_code=500, detail="PDF upload failed")

        # Construct path used for analysis
        pdf_path = f"/Workspace/Shared/pdf_uploads/{file.filename}"


        # Import AI client
        from backend.databricks_ai import DatabricksAI

        host = db.client.host.rstrip('/')
        token = db.client.token
        ai_client = DatabricksAI(host, token)

        # Download and extract PDF content once, then cache it
        # Step 1: Download PDF content (once)
        download_start = time.time()
        pdf_content = pdf_manager.get_pdf_content(pdf_path, use_cache=True)
        download_time = round(time.time() - download_start, 2)

        if not pdf_content:
            raise HTTPException(status_code=500, detail="Failed to download PDF content")

        # Step 2: Extract text from PDF (once)
        extraction_start = time.time()
        extraction_result = ai_client.extract_text_from_pdf(pdf_content)
        extraction_time = round(time.time() - extraction_start, 2)

        if not extraction_result['success']:
            raise HTTPException(status_code=500, detail=f"Text extraction failed: {extraction_result.get('error', 'Unknown error')}")

        extracted_text = extraction_result['text']
        pages_analyzed = extraction_result['pages']
        text_length = len(extracted_text)

        logger.info(f"PDF processed once: {download_time}s download, {extraction_time}s extraction, {pages_analyzed} pages, {text_length} characters")

        try:
            prompts = json.loads(prompts_json)
            if not isinstance(prompts, list):
                raise ValueError("Prompts must be a list of {title, prompt} objects")
            logger.info(f"Received {len(prompts)} prompts from frontend")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid prompts: {str(e)}")

        # Step 3: Process each prompt with the cached text (with retry logic)
        responses = []
        MAX_RETRIES = 2
        BASE_DELAY = 5
        for prompt in prompts:
            question_text = prompt.get("prompt", "")
            title_text = prompt.get("title", "")

            # Use the retry helper with cached text approach
            result = analyze_with_cached_text_retries(
                ai_client=ai_client,
                extracted_text=extracted_text,
                question=question_text,
                download_time=download_time,
                extraction_time=extraction_time,
                pages_analyzed=pages_analyzed,
                text_length=text_length,
                workspace_path=pdf_path,
                max_retries=MAX_RETRIES,
                base_delay=BASE_DELAY
            )

            # result should be a dict consistent with your existing expectations
            # if something unexpected happened above, make a safe fallback
            if not isinstance(result, dict):
                result = {"success": False, "error": f"Unexpected non-dict result: {result}", "timing": {}}

            responses.append({
                "prompt": question_text,
                "title": title_text,
                "answer": result.get("answer", ""),
                "explanation": result.get("explanation", ""),
                "success": result.get("success", False),
                "error": result.get("error"),
                "timing": result.get("timing", {})
            })
        
        for r in responses:
            if isinstance(r.get("answer"), (list, dict)):
                logger.warning(f"Answer for '{r.get('prompt')}' returned a {type(r.get('answer')).__name__}")

        merged_summary = " ".join(
            [
                normalize_answer(r.get("answer"))
                for r in responses
                if r.get("success")
            ]
        )
        
        # Calculate total processing time across all prompts
        total_processing_time = sum([
            r.get("timing", {}).get("total_time", 0) for r in responses
        ])
        total_processing_time = round(total_processing_time, 2)

        return {
            "success": True,
            "analysis": {
                "responses": responses,
                "merged_summary": merged_summary,
                "total_processing_time": total_processing_time,
            },
            "name": file.filename,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Upload + Analyze failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    # Run the server
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
