# src/prepare_data.py
import json
import re
from datasets import load_dataset
from pathlib import Path
from typing import List, Dict

OUT_DIR = Path(__file__).resolve().parents[1] / "datasets"
OUT_DIR.mkdir(parents=True, exist_ok=True)

HF_DATASETS = [
    "shinoo17/simple_user_stories",
    "nalmeida/agile_dataset_fusionado"
]

def normalize_text(s: str) -> str:
    if s is None:
        return ""
    s = s.replace("\r", "\n")
    s = re.sub(r"\s+\n", "\n", s)
    s = re.sub(r"\n\s+", "\n", s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s

def extract_acceptance_criteria(text: str) -> List[str]:
    # find "Acceptance Criteria" section or list-like bullets
    acs = []
    if not text:
        return acs
    # first try explicit header
    m = re.search(r'Acceptance Criteria\s*[:\-]\s*(.+)', text, flags=re.IGNORECASE | re.DOTALL)
    if m:
        tail = m.group(1).strip()
        # split on new lines or bullets
        parts = re.split(r'[\n\r]+|(?<=\.)\s+', tail)
        for p in parts:
            p = re.sub(r'^\s*[-*\d\.)]+\s*', '', p).strip()
            if p:
                acs.append(p)
    # fallback: capture explicit bullets anywhere
    if not acs:
        bullets = re.findall(r'(?m)^[\s]*[-*\u2022]\s*(.+)$', text)
        acs = [normalize_text(b) for b in bullets if b.strip()]
    # DISABLED Level 3 Heuristic: Remove this to prevent hallucinating criteria
    # Reason: Lines containing 'must', 'should', 'will' in normal story description
    # get incorrectly flagged as acceptance criteria, confusing the model
    # Only use explicit headers (Level 1) and bullets (Level 2)
    # if not acs:
    #     for line in text.splitlines():
    #         if re.search(r'\b(must|should|will|able to|able)\b', line, flags=re.IGNORECASE):
    #             acs.append(normalize_text(line))
    return acs

def to_pair(raw_text: str, meta: Dict = None) -> Dict:
    t = normalize_text(raw_text or "")
    ac = extract_acceptance_criteria(raw_text)
    # target schema template - we let model fill actor/action/benefit but include acceptance
    target = {
        "actor": None,
        "action": None,
        "benefit": None,
        "acceptance": ac
    }
    inp = f"USER_STORY: {t}"
    return {"input": inp, "target": json.dumps(target, ensure_ascii=False), "meta": meta or {}}

def prepare_all() -> List[Dict]:
    examples = []
    for ds_name in HF_DATASETS:
        try:
            print(f"Loading {ds_name} ...")
            # load entire dataset -- will raise if not present
            ds = load_dataset(ds_name)
            # datasets may have multiple splits
            # iterate over available splits and records
            for split_name, split_ds in ds.items():
                print(f"  split: {split_name} size: {len(split_ds)}")
                for r in split_ds:
                    # assemble textual content heuristically
                    text = None
                    # common possible fields
                    for k in ("text", "story", "user_story", "description", "title"):
                        if k in r and r[k]:
                            text = r[k]
                            break
                    if not text:
                        # join all string fields
                        text = " ".join(str(v) for v in r.values() if isinstance(v, str))
                    pair = to_pair(text, meta={"source": ds_name, "split": split_name})
                    examples.append(pair)
        except Exception as e:
            print("  Warning: failed to load", ds_name, ":", e)
    print("Total examples prepared:", len(examples))
    return examples

def split_and_save(examples: List[Dict]):
    n = len(examples)
    if n == 0:
        print("No examples to save.")
        return
    # simple deterministic split
    train_end = int(0.8 * n)
    val_end = int(0.9 * n)
    splits = {
        "train": examples[:train_end],
        "validation": examples[train_end:val_end],
        "test": examples[val_end:]
    }
    for name, items in splits.items():
        path = OUT_DIR / f"{name}.jsonl"
        with path.open("w", encoding="utf8") as f:
            for it in items:
                f.write(json.dumps(it, ensure_ascii=False) + "\n")
        print("Saved", name, "->", path, "count:", len(items))

if __name__ == "__main__":
    all_ex = prepare_all()
    split_and_save(all_ex)
    # print a few samples
    from itertools import islice
    for s in islice(all_ex, 5):
        print("----")
        print("INPUT:", s["input"][:500])
        print("TARGET:", s["target"])
