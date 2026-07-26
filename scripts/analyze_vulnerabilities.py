import os
import sys
import json
import subprocess

ANALYSIS_REPORT = "sast-report.json"

VULNERABLE_PATTERNS = [
    r'\$queryRaw\s*`',
    r'\.query\s*\(\s*[`\'"].*\$',
    r'exec\s*\(',
    r'execSync\s*\(',
    r'\beval\s*\(',
    r'new\s+Function\s*\(',
    r'runInThisContext',
    r'runInNewContext',
    r'dangerouslySetInnerHTML',
    r'\.innerHTML\s*=',
    r'insertAdjacentHTML',
    r'readFileSync\s*\(.*\+',
    r'axios\.get\s*\(\s*req\.',
    r'fetch\s*\(\s*req\.',
    r"createHash\s*\(\s*['\"]md5['\"]",
    r"createHash\s*\(\s*['\"]sha1['\"]",
    r'Math\.random\s*\(',
    r'unserialize\s*\(',
    r'yaml\.load\s*\(',
    r'excludeExtraneousValues.*false',
]


def get_changed_files(base_sha, head_sha):
    result = subprocess.run(
        ["git", "diff", "--name-only", "--diff-filter=ACM", f"{base_sha}...{head_sha}"],
        capture_output=True, text=True
    )
    files = [f for f in result.stdout.strip().split("\n") if f]
    return [f for f in files if f.endswith(('.ts', '.js', '.tsx', '.jsx'))]


def analyze_file(filepath):
    findings = []
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
    except Exception as e:
        return [{"file": filepath, "error": str(e)}]

    lines = content.split("\n")
    for pattern in VULNERABLE_PATTERNS:
        import re
        for i, line in enumerate(lines, 1):
            if re.search(pattern, line, re.IGNORECASE):
                findings.append({
                    "file": filepath,
                    "line": i,
                    "pattern": pattern,
                    "code": line.strip(),
                    "severity": "high"
                })
    return findings


def main():
    base_sha = os.environ.get("BASE_SHA", "HEAD~1")
    head_sha = os.environ.get("HEAD_SHA", "HEAD")

    changed_files = get_changed_files(base_sha, head_sha)

    if not changed_files:
        print("No JS/TS files changed. Skipping SAST analysis.")
        report = {
            "status": "skipped",
            "changed_files": 0,
            "vulnerabilities": [],
            "abort": False
        }
        with open(ANALYSIS_REPORT, "w") as f:
            json.dump(report, f, indent=2)
        sys.exit(0)

    all_findings = []

    for filepath in changed_files:
        if not os.path.exists(filepath):
            continue
        all_findings.extend(analyze_file(filepath))

    abort_pipeline = len(all_findings) > 0

    report = {
        "status": "completed",
        "changed_files": len(changed_files),
        "pattern_vulnerabilities": all_findings,
        "total_vulnerabilities": len(all_findings),
        "abort": abort_pipeline
    }

    with open(ANALYSIS_REPORT, "w") as f:
        json.dump(report, f, indent=2)

    if abort_pipeline:
        print(f"SAST ML: {len(all_findings)} vulnerabilities detected. Aborting pipeline.")
        for v in all_findings:
            print(f"  -> {v['file']}:{v['line']} - matches pattern")
        sys.exit(1)
    else:
        print("SAST ML: No vulnerabilities detected. Pipeline can proceed.")
        sys.exit(0)


if __name__ == "__main__":
    main()
