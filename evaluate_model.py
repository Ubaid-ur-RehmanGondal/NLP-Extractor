import torch
from peft import PeftModel, PeftConfig
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import json
import os
import sys
from tqdm import tqdm

# Add src to path
sys.path.append(os.getcwd())
from src.preprocessing import clean_model_output, extract_user_story_components, safe_json_load

def load_model():
    MODEL_DIR = "model_output"
    
    # Check if GPU is available
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"🚀 Loading model on {device}...")

    try:
        config = PeftConfig.from_pretrained(MODEL_DIR)
        base_model_path = config.base_model_name_or_path
        
        tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
        
        base_model = AutoModelForSeq2SeqLM.from_pretrained(
            base_model_path,
            device_map="auto" if device == "cuda" else None,
            torch_dtype=torch.float16 if device == "cuda" else torch.float32
        )
        
        model = PeftModel.from_pretrained(base_model, MODEL_DIR)
        model = model.merge_and_unload()
        model.eval()
        
        if device == "cpu":
            model = model.to(device)
            
        return model, tokenizer, device
    except Exception as e:
        print(f"Error loading model: {e}")
        return None, None, None

def normalize(text):
    """Normalize text for comparison (lower case, strip)"""
    if not text:
        return ""
    return str(text).lower().strip()

def evaluate():
    model, tokenizer, device = load_model()
    if not model:
        return

    test_file = "datasets/test.jsonl"
    if not os.path.exists(test_file):
        print("❌ Test file not found!")
        return

    print(f"📊 Evaluating on {test_file}...")
    
    total = 0
    perfect_matches = 0
    actor_matches = 0
    action_matches = 0
    benefit_matches = 0
    
    with open(test_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Process each story
    for line in tqdm(lines, desc="Processing Stories"):
        try:
            data = json.loads(line)
            user_story = data.get('input', '').replace("USER_STORY:", "").strip()
            target_json = data.get('target', '{}')
            
            # Parse Ground Truth
            try:
                ground_truth = json.loads(target_json)
            except:
                continue # Skip if target is invalid
                
            if not ground_truth.get('actor'): # Skip if ground truth is empty/null
                continue

            total += 1
            
            # --- Run Inference ---
            input_text = f"USER_STORY: {user_story}"
            inputs = tokenizer(input_text, return_tensors="pt", truncation=True, max_length=512).to(device)
            
            with torch.no_grad():
                output_ids = model.generate(
                    **inputs, 
                    max_length=200, 
                    num_beams=4, 
                    early_stopping=True
                )
            
            raw_output = tokenizer.decode(output_ids[0], skip_special_tokens=True)
            cleaned = clean_model_output(raw_output)
            
            # Try JSON parse, fallback to Regex (System Logic)
            prediction = safe_json_load(cleaned)
            if not prediction:
                prediction = extract_user_story_components(raw_output)
            
            # --- Compare ---
            # Check Actor
            pred_actor = normalize(prediction.get('actor'))
            true_actor = normalize(ground_truth.get('actor'))
            # Simple containment check or exact match
            if true_actor in pred_actor or pred_actor in true_actor:
                actor_matches += 1
                
            # Check Action
            pred_action = normalize(prediction.get('action'))
            true_action = normalize(ground_truth.get('action'))
            # Use simple overlap ratio or containment for longer text
            if true_action == pred_action or (len(pred_action) > 5 and pred_action in true_action):
                action_matches += 1
                
            # Check Benefit
            pred_benefit = normalize(prediction.get('benefit'))
            true_benefit = normalize(ground_truth.get('benefit'))
            if true_benefit == pred_benefit or (len(pred_benefit) > 5 and pred_benefit in true_benefit):
                benefit_matches += 1
                
            # Perfect Match (All 3 correct)
            if (true_actor in pred_actor or pred_actor in true_actor) and \
               (true_action == pred_action or (len(pred_action) > 5 and pred_action in true_action)) and \
               (true_benefit == pred_benefit or (len(pred_benefit) > 5 and pred_benefit in true_benefit)):
                perfect_matches += 1
                
        except Exception as e:
            print(f"Error processing line: {e}")
            continue

    if total == 0:
        print("No valid test data found.")
        return

    print("\n" + "="*40)
    print("🎯 EVALUATION RESULTS")
    print("="*40)
    print(f"Total Stories Tested: {total}")
    print(f"✅ Perfect Matches:   {perfect_matches} ({perfect_matches/total*100:.1f}%)")
    print("-" * 20)
    print(f"👤 Actor Accuracy:    {actor_matches/total*100:.1f}%")
    print(f"⚡ Action Accuracy:   {action_matches/total*100:.1f}%")
    print(f"🎁 Benefit Accuracy:  {benefit_matches/total*100:.1f}%")
    print("="*40)

if __name__ == "__main__":
    evaluate()
