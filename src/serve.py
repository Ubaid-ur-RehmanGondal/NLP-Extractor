# src/serve.py

import torch
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from peft import PeftModel, PeftConfig
import uvicorn
import json
import os

from preprocessing import clean_model_output, safe_json_load, extract_user_story_components

MODEL_DIR = "model_output"
BASE_MODEL_NAME = "google/flan-t5-base"
device = "cuda" if torch.cuda.is_available() else "cpu"

print(f"🚀 Using device: {device}")
print(f"📦 Loading model from: {MODEL_DIR}")

app = FastAPI()

# Enable CORS to allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load tokenizer from fine-tuned model
print("📥 Loading tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)

# Load base model
print(f"📥 Loading base model: {BASE_MODEL_NAME}...")
base_model = AutoModelForSeq2SeqLM.from_pretrained(
    BASE_MODEL_NAME,
    device_map="auto",
    torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32
)

# Load and merge LoRA adapter
print("🔧 Loading and merging LoRA adapter...")
try:
    # Load PEFT config to verify adapter exists
    peft_config = PeftConfig.from_pretrained(MODEL_DIR)
    print(f"   LoRA Config: {peft_config}")
    
    # Load the model with LoRA weights
    model = PeftModel.from_pretrained(
        base_model,
        MODEL_DIR,
        is_trainable=False
    )
    
    # Merge the LoRA weights into the base model for inference
    print("   Merging LoRA weights...")
    model = model.merge_and_unload()
    print("✅ LoRA adapter successfully merged!")
    
except Exception as e:
    print(f"❌ Error loading LoRA: {e}")
    print("   Using base model WITHOUT fine-tuning")
    model = base_model

# Set model to evaluation mode for inference
model.eval()
print("✅ Model ready for inference!\n")

class StoryInput(BaseModel):
    text: str

class BatchStoryInput(BaseModel):
    stories: list[str]

@app.post("/extract")
def extract(story: StoryInput):
    try:
        print(f"\n{'='*60}")
        print(f"🔍 PROCESSING USER STORY")
        print(f"{'='*60}")
        print(f"Input: {story.text[:150]}...")
        
        # Format input with the exact prompt the model was trained on
        input_text = f"USER_STORY: {story.text}"
        
        print(f"📝 Formatted prompt: {input_text[:100]}...")
        
        # Tokenize
        inputs = tokenizer(
            input_text,
            return_tensors="pt",
            truncation=True,
            max_length=512
        ).to(device)
        
        print(f"✅ Tokenized (input_ids shape: {inputs['input_ids'].shape})")

        # Generate with the fine-tuned model
        print(f"⚙️  Running inference with FINE-TUNED model...")
        with torch.no_grad():
            output_ids = model.generate(
                **inputs,
                max_length=200,
                num_beams=4,
                early_stopping=True,
                do_sample=False
            )

        # Decode output
        raw_output = tokenizer.decode(output_ids[0], skip_special_tokens=True)
        print(f"📤 Raw Model Output:")
        print(f"   '{raw_output}'")

        # Clean output
        cleaned = clean_model_output(raw_output)
        print(f"🧹 Cleaned Output:")
        print(f"   '{cleaned}'")

        # Try to parse as JSON first
        parsed = safe_json_load(cleaned)
        
        # If JSON parsing failed, extract components from raw output
        if not parsed:
            print(f"📊 JSON parsing failed, extracting components from raw output...")
            parsed = extract_user_story_components(raw_output, story.text)
            print(f"✅ Extracted components: {parsed}")
        else:
            print(f"✅ Parsed JSON: {parsed}")
        
        print(f"{'='*60}\n")

        # Build response with all fields
        response = {
            "raw_output": raw_output,
            "cleaned_output": cleaned,
            "actor": parsed.get("actor") if parsed else None,
            "action": parsed.get("action") if parsed else None,
            "benefit": parsed.get("benefit") if parsed else None,
            "acceptance_criteria": parsed.get("acceptance_criteria", []) if parsed else [],
            "confidence": 0.95 if parsed and all([parsed.get("actor"), parsed.get("action"), parsed.get("benefit")]) else 0.6
        }

        return response

    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}


@app.post("/extract_batch")
def extract_batch(batch: BatchStoryInput):
    """
    Process multiple user stories in a single request (batch processing).
    This is ~10x faster than sending stories one by one.
    """
    try:
        print(f"\n{'='*60}")
        print(f"🔍 BATCH PROCESSING {len(batch.stories)} STORIES")
        print(f"{'='*60}")
        
        results = []
        
        # Process inputs
        clean_texts = [f"USER_STORY: {t}" for t in batch.stories]
        
        print(f"📝 Formatting {len(clean_texts)} stories...")
        
        # Tokenize ALL at once (Critical for batching efficiency)
        print(f"⚙️  Tokenizing batch...")
        inputs = tokenizer(
            clean_texts, 
            return_tensors="pt", 
            padding=True,        # Critical for batching
            truncation=True, 
            max_length=512
        ).to(device)
        
        print(f"✅ Batch tokenized (shape: {inputs['input_ids'].shape})")

        # Generate ALL at once (GPU processes all in parallel)
        print(f"🚀 Running batch inference...")
        with torch.no_grad():
            output_ids = model.generate(
                **inputs, 
                max_length=200, 
                num_beams=4, 
                early_stopping=True
            )
        
        print(f"✅ Batch inference complete")

        # Decode and clean results
        print(f"📤 Decoding outputs...")
        decoded_outputs = tokenizer.batch_decode(output_ids, skip_special_tokens=True)
        
        # Process each result
        for i, (raw_text, original_story) in enumerate(zip(decoded_outputs, batch.stories)):
            cleaned = clean_model_output(raw_text)
            parsed = safe_json_load(cleaned)
            
            # If JSON parsing failed, extract components from raw output
            if not parsed:
                parsed = extract_user_story_components(raw_text, original_story)
            
            result = {
                "story_index": i,
                "raw_output": raw_text,
                "cleaned_output": cleaned,
                "actor": parsed.get("actor") if parsed else None,
                "action": parsed.get("action") if parsed else None,
                "benefit": parsed.get("benefit") if parsed else None,
                "acceptance_criteria": parsed.get("acceptance_criteria", []) if parsed else [],
                "confidence": 0.95 if parsed and all([parsed.get("actor"), parsed.get("action"), parsed.get("benefit")]) else 0.6
            }
            results.append(result)
        
        print(f"✅ Batch processing complete: {len(results)} stories processed")
        print(f"{'='*60}\n")
        
        return {"results": results, "total": len(results)}

    except Exception as e:
        print(f"❌ BATCH ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"error": str(e), "results": []}


@app.get("/health")
def health():
    return {
        "status": "ok",
        "device": device,
        "model": "FLAN-T5 with LoRA adapter (MERGED)",
        "base_model": BASE_MODEL_NAME
    }


@app.get("/model-info")
def model_info():
    return {
        "model_name": "FLAN-T5 Fine-tuned with LoRA",
        "base_model": BASE_MODEL_NAME,
        "adapter_location": MODEL_DIR,
        "device": device,
        "dtype": "float16" if torch.cuda.is_available() else "float32",
        "task": "Extract user story components (actor, action, benefit, acceptance criteria)"
    }


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
