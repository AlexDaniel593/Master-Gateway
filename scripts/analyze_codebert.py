import os
import sys
import json
import subprocess
import requests

HF_MODEL = os.environ.get("HF_MODEL", "mrm8488/codebert-base-finetuned-detect-insecure-code")
HF_TOKEN = os.environ.get("HF_TOKEN", "")
API_URL = f"https://api-inference.huggingface.co/models/{HF_MODEL}"
ANALYSIS_REPORT = "sast-report.json"


def get_changed_files(base_sha, head_sha):
    result = subprocess.run(
        ["git", "diff", "--name-only", "--diff-filter=ACM", f"{base_sha}...{head_sha}"],
        capture_output=True, text=True
    )
    files = [f for f in result.stdout.strip().split("\n") if f]
    return [f for f in files if f.endswith(('.ts', '.js', '.tsx', '.jsx'))]


def query_hf_api(code_snippet):
    headers = {"Authorization": f"Bearer {HF_TOKEN}"}
    payload = {"inputs": code_snippet[:500]}
    try:
        resp = requests.post(API_URL, headers=headers, json=payload, timeout=30)
        if resp.status_code == 200:
            return resp.json()
        elif resp.status_code == 503:
            data = resp.json()
            estimated = data.get("estimated_time", 30)
            print(f"Model loading, waiting {int(estimated) + 5}s...")
            import time
            time.sleep(int(estimated) + 5)
            resp = requests.post(API_URL, headers=headers, json=payload, timeout=60)
            if resp.status_code == 200:
                return resp.json()
            return {"error": resp.text}
        else:
            return {"error": resp.text}
    except Exception as e:
        return {"error": str(e)}


def main():
    if not HF_TOKEN:
        print("HF_TOKEN not set. Skipping CodeBERT analysis.")
        report = {"status": "skipped", "reason": "HF_TOKEN not configured"}
        with open(ANALYSIS_REPORT, "w") as f:
            json.dump(report, f, indent=2)
        sys.exit(0)

    base_sha = os.environ.get("BASE_SHA", "HEAD~1")
    head_sha = os.environ.get("HEAD_SHA", "HEAD")

    changed_files = get_changed_files(base_sha, head_sha)

    if not changed_files:
        print("No JS/TS files changed. Skipping CodeBERT analysis.")
        sys.exit(0)

    print(f"Analyzing {len(changed_files)} files with CodeBERT ({HF_MODEL})...")
    findings = []

    for filepath in changed_files:
        if not os.path.exists(filepath):
            continue
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
        except Exception as e:
            continue

        result = query_hf_api(content)
        if isinstance(result, list):
            for prediction in result:
                label = prediction.get("label", "")
                score = prediction.get("score", 0)
                findings.append({
                    "file": filepath,
                    "model": HF_MODEL,
                    "label": label,
                    "confidence": score,
                    "vulnerable": "VULNERABLE" in label or "LABEL_1" in label,
                })
        elif isinstance(result, dict):
            findings.append({
                "file": filepath,
                "model": HF_MODEL,
                "error": result.get("error", "Unknown error"),
            })

    report = {
        "status": "completed",
        "model": HF_MODEL,
        "files_analyzed": len(changed_files),
        "findings": findings,
    }

    with open(ANALYSIS_REPORT, "w") as f:
        json.dump(report, f, indent=2)

    vulnerable = [f for f in findings if f.get("vulnerable")]
    if vulnerable:
        print(f"CodeBERT: {len(vulnerable)} potentially vulnerable files detected.")
        for v in vulnerable:
            print(f"  -> {v['file']} (confidence: {v['confidence']:.2%})")
        sys.exit(0)
    else:
        print("CodeBERT: No vulnerabilities detected.")
        sys.exit(0)


if __name__ == "__main__":
    main()
