import time
import logging
import json
from typing import Dict, Any

def analyze_with_retries(ai_client, workspace_path: str, question: str,
                         max_retries: int = 3, base_delay: int = 5) -> Dict[str, Any]:
    """
    Call ai_client.analyze_pdf() with retries on timeouts / transient network errors.
    Returns the result dict from analyze_pdf on success or the last failure dict/exception info.
    """
    last_exception = None
    timeout_keywords = [
        "timed out", "timeout", "read timed out", "connection aborted",
        "connection reset", "failed to establish a new connection",
        "max retries exceeded", "httpsconnectionpool"
    ]

    for attempt in range(1, max_retries + 1):
        logging.info(f"[RetryHelper] Starting analyze_pdf attempt {attempt}/{max_retries} for question: {question[:50]}")

        try:
            result = ai_client.analyze_pdf(workspace_path, question)

            # If analyze_pdf returns a dict with an error message — check for transient errors
            if isinstance(result, dict):
                err = result.get("error")
                if err:
                    err_lower = str(err).lower()
                    if any(k in err_lower for k in timeout_keywords):
                        if attempt < max_retries:
                            wait = base_delay * (2 ** (attempt - 1))
                            logging.warning(
                                f"analyze_pdf returned timeout-like error "
                                f"(attempt {attempt}/{max_retries}): {err}. Retrying in {wait}s..."
                            )
                            time.sleep(wait)
                            continue
                        else:
                            logging.error(f"analyze_pdf final attempt failed with timeout: {err}")
                            return result

                    # if not a timeout error, just return
                    return result

            # No error dict or success response
            return result

        except Exception as e:
            last_exception = e
            exc_msg = str(e).lower()

            if any(k in exc_msg for k in timeout_keywords):
                if attempt < max_retries:
                    wait = base_delay * (2 ** (attempt - 1))
                    logging.warning(
                        f"analyze_pdf exception looks like a timeout "
                        f"(attempt {attempt}/{max_retries}): {e}. Retrying in {wait}s..."
                    )
                    time.sleep(wait)
                    continue

            # Non-timeout or no retries left
            logging.error(f"analyze_pdf failed (attempt {attempt}/{max_retries}): {e}")
            return {
                "success": False,
                "error": str(e),
                "question": question,
                "pdf_path": workspace_path,
                "timing": {}
            }

    if last_exception:
        return {"success": False, "error": str(last_exception),
                "question": question, "pdf_path": workspace_path}

    return {"success": False, "error": "Unknown retry failure",
            "question": question, "pdf_path": workspace_path}


def analyze_with_cached_text_retries(ai_client, extracted_text: str, question: str,
                                   download_time: float, extraction_time: float,
                                   pages_analyzed: int, text_length: int, workspace_path: str,
                                   max_retries: int = 3, base_delay: int = 5) -> Dict[str, Any]:
    last_exception = None
    timeout_keywords = [
        "timed out", "timeout", "read timed out", "connection aborted",
        "connection reset", "failed to establish a new connection",
        "max retries exceeded", "httpsconnectionpool"
    ]

    for attempt in range(1, max_retries + 1):
        logging.info(f"[RetryHelper] Starting analyze_with_cached_text attempt {attempt}/{max_retries} for question: {question[:50]}")

        try:
            # Time the entire analyze_with_cached_text call
            call_start = time.time()
            result = ai_client.analyze_with_cached_text(
                extracted_text=extracted_text,
                question=question,
                download_time=download_time,
                extraction_time=extraction_time,
                pages_analyzed=pages_analyzed,
                text_length=text_length,
                workspace_path=workspace_path
            )
            call_time = round(time.time() - call_start, 2)

            # If analyze_with_cached_text returns a dict with an error message — check for transient errors
            if isinstance(result, dict):
                err = result.get("error")
                if err:
                    err_lower = str(err).lower()
                    if any(k in err_lower for k in timeout_keywords):
                        if attempt < max_retries:
                            wait = base_delay * (2 ** (attempt - 1))
                            logging.warning(
                                f"analyze_with_cached_text returned timeout-like error "
                                f"(attempt {attempt}/{max_retries}): {err}. Retrying in {wait}s..."
                            )
                            time.sleep(wait)
                            continue
                        else:
                            logging.error(f"analyze_with_cached_text final attempt failed with timeout: {err}")
                            return result

                    # if not a timeout error, just return
                    return result

            # Success case - ensure timing is properly set
            if isinstance(result, dict) and 'timing' in result:
                # If timing doesn't have ai_query_time, use our measured call_time
                if result['timing'].get('ai_query_time', 0) == 0:
                    result['timing']['ai_query_time'] = call_time
                    result['timing']['total_time'] = round(download_time + extraction_time + call_time, 2)

            return result

        except Exception as e:
            last_exception = e
            exc_msg = str(e).lower()

            if any(k in exc_msg for k in timeout_keywords):
                if attempt < max_retries:
                    wait = base_delay * (2 ** (attempt - 1))
                    logging.warning(
                        f"analyze_with_cached_text exception looks like a timeout "
                        f"(attempt {attempt}/{max_retries}): {e}. Retrying in {wait}s..."
                    )
                    time.sleep(wait)
                    continue

            # Non-timeout or no retries left
            logging.error(f"analyze_with_cached_text failed (attempt {attempt}/{max_retries}): {e}")
            return {
                "success": False,
                "error": str(e),
                "question": question,
                "pdf_path": workspace_path,
                "timing": {
                    'download_time': download_time,
                    'extraction_time': extraction_time,
                    'ai_query_time': 0.0,
                    'total_time': download_time + extraction_time
                }
            }

    if last_exception:
        return {
            "success": False,
            "error": str(last_exception),
            "question": question,
            "pdf_path": workspace_path,
            "timing": {
                'download_time': download_time,
                'extraction_time': extraction_time,
                'ai_query_time': 0.0,
                'total_time': download_time + extraction_time
            }
        }

    return {
        "success": False,
        "error": "Unknown retry failure",
        "question": question,
        "pdf_path": workspace_path,
        "timing": {
            'download_time': download_time,
            'extraction_time': extraction_time,
            'ai_query_time': 0.0,
            'total_time': download_time + extraction_time
        }
    }


def normalize_answer(answer):
    if answer is None:
        return ""
    if isinstance(answer, str):
        return answer.strip()
    if isinstance(answer, (int, float, bool)):
        return str(answer)
    if isinstance(answer, list):
        parts = []
        for item in answer:
            parts.append(normalize_answer(item))
        return " ".join([p for p in parts if p])
    if isinstance(answer, dict):
        try:
            return json.dumps(answer, ensure_ascii=False)
        except Exception as e:
            logging.warning(f"Could not JSON-serialize dict: {e}")
            return str(answer)
    return str(answer)
