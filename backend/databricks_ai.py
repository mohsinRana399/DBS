"""
Databricks AI integration for PDF analysis
"""
import requests
import base64
import logging
import time
from typing import Dict, Any, Optional
from io import BytesIO
import PyPDF2

logger = logging.getLogger(__name__)

class DatabricksAI:
    def __init__(self, host: str, token: str):
        self.host = host.rstrip('/')
        self.token = token
        self.headers = {"Authorization": f"Bearer {token}"}
    
    def download_pdf_from_workspace(self, workspace_path: str) -> Optional[bytes]:
        """Download PDF content from Databricks workspace"""
        try:
            url = f"{self.host}/api/2.0/workspace/export"
            data = {
                "path": workspace_path,
                "format": "SOURCE"
            }
            
            response = requests.get(url, headers=self.headers, params=data, timeout=3)
            response.raise_for_status()
            
            result = response.json()
            if 'content' in result:
                # Content is base64 encoded
                pdf_content = base64.b64decode(result['content'])
                logger.info(f"Downloaded PDF: {len(pdf_content)} bytes")
                return pdf_content
            else:
                logger.error("No content in workspace export response")
                return None
                
        except Exception as e:
            logger.error(f"Failed to download PDF from workspace: {str(e)}")
            return None
    
    def extract_text_from_pdf(self, pdf_content: bytes) -> Dict[str, Any]:
        """Extract text from PDF content"""
        result = {
            'success': False,
            'text': '',
            'pages': 0,
            'error': None
        }
        
        try:
            pdf_reader = PyPDF2.PdfReader(BytesIO(pdf_content))
            result['pages'] = len(pdf_reader.pages)
            
            text_parts = []
            for i, page in enumerate(pdf_reader.pages):
                try:
                    page_text = page.extract_text()
                    if page_text.strip():
                        text_parts.append(f"--- Page {i+1} ---\n{page_text}\n")
                except Exception as e:
                    logger.warning(f"Failed to extract text from page {i+1}: {str(e)}")
            
            if text_parts:
                result['text'] = '\n'.join(text_parts)
                result['success'] = True
                logger.info(f"Extracted {len(result['text'])} characters from {result['pages']} pages")
            else:
                result['error'] = "No text could be extracted from the PDF"
                logger.warning("No text extracted from PDF")
                
        except Exception as e:
            result['error'] = str(e)
            logger.error(f"PDF text extraction failed: {str(e)}")
        
        return result
        
    def _get_warehouse_id(self) -> str:
        """Return a warehouse ID (default if set, otherwise pick first running one)."""
        # if self.default_warehouse_id:
            # return self.default_warehouse_id

        url = f"{self.host}/api/2.0/sql/warehouses"
        res = requests.get(url, headers=self.headers, timeout=10)
        res.raise_for_status()
        warehouses = res.json().get("warehouses", [])
        if not warehouses:
            raise RuntimeError("No SQL warehouses available")

        # Pick first running one
        for w in warehouses:
            if w.get("state") == "RUNNING":
                return w["id"]

        # Fallback to first
        return warehouses[0]["id"]
    
    def query_with_databricks_ai(self, text: str, question: str, model: str = "databricks-gpt-oss-120b") -> Dict[str, Any]:
        try:
            warehouse_id = self._get_warehouse_id()
            logger.info(f"Using warehouse: {warehouse_id}")

            # Truncate to avoid token overflow (basic safeguard)
            max_chars = 15000
            if len(text) > max_chars:
                text = text[:max_chars] + "\n\n[Text truncated due to length...]"

            # Escape quotes for SQL safety
            safe_text = text.replace("'", "''")
            safe_question = question.replace("'", "''")

            sql_query = f"""
            SELECT ai_query(
                '{model}',
                'You are a helpful AI assistant analyzing a PDF document. 
                 Based on the following document content, please answer the user question accurately and comprehensively.

Document Content:
{safe_text}

User Question: {safe_question}

Return your output as valid JSON with the following fields:
{{
  "answer": "<the direct answer to the question>",
  "explanation": "<a short explanation of how you derived that answer based on the document>"
}}

If the answer cannot be found, return:
{{
  "answer": "Not found in document",
  "explanation": "The requested information was not present in the provided text."
}}'
) as answer
            """

            # Submit the SQL statement
            execute_url = f"{self.host}/api/2.0/sql/statements"
            payload = {
                "warehouse_id": warehouse_id,
                "statement": sql_query,
                "wait_timeout": "50s"
            }

            logger.info("Submitting AI query...")
            res = requests.post(execute_url, headers=self.headers, json=payload, timeout=30)
            res.raise_for_status()
            result = res.json()

            statement_id = result.get("statement_id")
            if not statement_id:
                return {"success": False, "error": "No statement_id returned from Databricks"}

                        # Poll for completion
            status_url = f"{self.host}/api/2.0/sql/statements/{statement_id}"
            for _ in range(60):  # up to ~2 minutes
                status_res = requests.get(status_url, headers=self.headers, timeout=30)
                status_res.raise_for_status()
                status = status_res.json()
                state = status.get("status", {}).get("state")

                if state == "SUCCEEDED":
                    # Extract result
                    data_array = status.get("result", {}).get("data_array", [])
                    if data_array and data_array[0]:
                        raw_answer = data_array[0][0]
                        import json

                        explanation = ""
                        answer_text = raw_answer

                        # Try parsing JSON from the AI response
                        try:
                            parsed = json.loads(raw_answer)
                            answer_text = parsed.get("answer", "")
                            explanation = parsed.get("explanation", "")
                        except Exception:
                            # if not JSON, just return as plain text
                            explanation = ""

                        return {
                            "success": True,
                            "question": question,
                            "answer": answer_text,
                            "explanation": explanation,
                        }

                    return {"success": False, "error": "No answer returned from AI"}

                elif state in ("FAILED", "CANCELED"):
                    error_msg = (
                        status.get("status", {}).get("error", {}).get("message")
                        or status.get("error", {}).get("message")
                        or "Unknown error"
                    )
                    return {"success": False, "error": f"AI query failed: {error_msg}"}

                time.sleep(2)


            return {"success": False, "error": "AI query timeout"}

        except Exception as e:
            logger.error(f"Databricks AI query failed: {str(e)}")
            return {"success": False, "error": str(e)}
        
    def analyze_pdf(self, workspace_path: str, question: str) -> Dict[str, Any]:
        """Complete PDF analysis workflow (downloads and extracts each time - use analyze_with_cached_text for efficiency)"""
        start_time = time.time()
        timing_info = {}

        try:
            # Step 1: Download PDF
            download_start = time.time()
            pdf_content = self.download_pdf_from_workspace(workspace_path)
            timing_info['download_time'] = round(time.time() - download_start, 2)
            if not pdf_content:
                return {
                    'success': False,
                    'error': 'Failed to download PDF from workspace',
                    'timing': timing_info
                }
            # Step 2: Extract text
            extraction_start = time.time()
            extraction_result = self.extract_text_from_pdf(pdf_content)
            timing_info['extraction_time'] = round(time.time() - extraction_start, 2)
            if not extraction_result['success']:
                return {
                    'success': False,
                    'error': f"Text extraction failed: {extraction_result.get('error', 'Unknown error')}",
                    'timing': timing_info
                }

            # Step 3: Query with AI
            ai_start = time.time()
            ai_result = self.query_with_databricks_ai(extraction_result['text'], question)
            timing_info['ai_query_time'] = round(time.time() - ai_start, 2)
            # Calculate total time
            timing_info['total_time'] = round(time.time() - start_time, 2)

            # Add metadata
            ai_result['pdf_path'] = workspace_path
            ai_result['pages_analyzed'] = extraction_result['pages']
            ai_result['text_length'] = len(extraction_result['text'])
            ai_result['timing'] = timing_info
            return ai_result

        except Exception as e:
            timing_info['total_time'] = round(time.time() - start_time, 2)
            logger.error(f"PDF analysis failed: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'timing': timing_info
            }

    def analyze_with_cached_text(self, extracted_text: str, question: str,
                                download_time: float = 0.0, extraction_time: float = 0.0,
                                pages_analyzed: int = 0, text_length: int = 0,
                                workspace_path: str = "") -> Dict[str, Any]:

        start_time = time.time()

        try:
            # perform AI query (text is already extracted)
            ai_start = time.time()
            ai_result = self.query_with_databricks_ai(extracted_text, question)
            ai_query_time = round(time.time() - ai_start, 2)

            # Create timing info
            timing_info = {
                'download_time': download_time,
                'extraction_time': extraction_time,
                'ai_query_time': ai_query_time,
                'total_time': round(download_time + extraction_time + ai_query_time, 2)
            }

            # Add metadata and timing
            ai_result['pdf_path'] = workspace_path
            ai_result['pages_analyzed'] = pages_analyzed
            ai_result['text_length'] = text_length
            ai_result['timing'] = timing_info

            return ai_result

        except Exception as e:
            timing_info = {
                'download_time': download_time,
                'extraction_time': extraction_time,
                'ai_query_time': round(time.time() - start_time, 2),
                'total_time': round(download_time + extraction_time + (time.time() - start_time), 2)
            }
            logger.error(f"PDF analysis with cached text failed: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'timing': timing_info
            }
