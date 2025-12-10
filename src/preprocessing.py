# src/preprocessing.py
import re
import json

def normalize_text(s: str) -> str:
    if not s:
        return ""
    s = s.replace("\r", "\n")
    s = re.sub(r"\n+", "\n", s)
    s = re.sub(r"[ \t]+", " ", s)
    return s.strip()

def safe_json_load(text: str):
    """
    Attempt to load model output as JSON.
    If fails, return None.
    """
    try:
        return json.loads(text)
    except:
        # Try fixing common issues
        try:
            text = text.replace("'", '"')
            return json.loads(text)
        except:
            return None

def extract_user_story_components(raw_output: str, original_story: str = "") -> dict:
    """
    Extract user story components from raw model output using pattern matching.
    This handles cases where the model outputs plain text instead of JSON.
    
    Returns: {actor, action, benefit, acceptance_criteria}
    """
    result = {
        "actor": None,
        "action": None,
        "benefit": None,
        "acceptance_criteria": []
    }
    
    raw = raw_output.strip().lower()
    
    # Pattern 1: Extract from "As a X, I want Y so that Z" format
    as_pattern = r'as\s+(?:an?)\s+([^,]+),?\s+(?:i\s+)?(?:want|need|would|can|should|must)\s+(.+?)(?:\s+so\s+that\s+|\s+in\s+order\s+to\s+|,?\s+to\s+enable\s+)(.*?)(?:\.|$)'
    match = re.search(as_pattern, raw, re.IGNORECASE)
    if match:
        result["actor"] = match.group(1).strip()
        result["action"] = match.group(2).strip()
        result["benefit"] = match.group(3).strip()
    
    # If we couldn't extract from the original story, try the raw output
    if not result["actor"] and original_story:
        match = re.search(as_pattern, original_story.lower(), re.IGNORECASE)
        if match:
            result["actor"] = match.group(1).strip()
            result["action"] = match.group(2).strip()
            result["benefit"] = match.group(3).strip()
    
    # Pattern 2: Extract key terms from raw model output
    # Look for common user story keywords
    actor_keywords = ['user', 'admin', 'customer', 'analyst', 'manager', 'developer', 'system', 'guest', 'employee']
    for keyword in actor_keywords:
        if keyword in raw and not result["actor"]:
            # Extract the word before or after the keyword
            result["actor"] = keyword
            break
    
    # If still no actor, try to extract from original story
    if not result["actor"] and original_story:
        for keyword in actor_keywords:
            if keyword.lower() in original_story.lower():
                result["actor"] = keyword
                break
    
    # Pattern 3: Look for acceptance criteria keywords
    criteria_keywords = ['given', 'when', 'then', 'and', 'scenario', 'condition', 'requirement', 'must', 'should']
    if any(keyword in raw for keyword in criteria_keywords):
        # Extract sentences that contain these keywords
        sentences = re.split(r'[.!?]', raw)
        for sentence in sentences:
            if any(keyword in sentence for keyword in criteria_keywords):
                criteria = sentence.strip()
                if criteria and len(criteria) > 3:
                    result["acceptance_criteria"].append(criteria)
    
    return result

def clean_model_output(raw: str):
    """
    Post-process model output:
    - remove unwanted tokens
    - fix partially generated JSON
    - handle plain text output from the model
    """
    raw = raw.strip()
    # Remove trailing </s> or strange tokens if any
    raw = raw.replace("</s>", "").strip()

    # Try to extract JSON first
    if raw.startswith("{"):
        # Ensure JSON-like format
        if not raw.startswith("{"):
            start = raw.find("{")
            if start != -1:
                raw = raw[start:]

        if not raw.endswith("}"):
            end = raw.rfind("}")
            if end != -1:
                raw = raw[:end+1]
        
        return raw
    
    # If not JSON, return as-is (plain text output)
    return raw
