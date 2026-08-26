import urllib.request
import urllib.parse
import json

BASE = "http://127.0.0.1:8001"

def test_endpoint(name, url, method="GET", data=None):
    try:
        req_data = urllib.parse.urlencode(data).encode("utf-8") if (data and method != "POST_JSON") else None
        headers = {"Content-Type": "application/x-www-form-urlencoded"} if data else {}
        
        if method == "POST_JSON":
            req_data = json.dumps(data).encode("utf-8")
            headers = {"Content-Type": "application/json"}
            method = "POST"
        
        req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
        with urllib.request.urlopen(req, timeout=45) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            print(f"[PASS] [{name}] | Response Status: {body.get('status', 'ok')}")
            return body
    except Exception as e:
        print(f"[FAIL] [{name}] | Error: {e}")
        return None

print("=== STARTING FULL CAREEROS SYSTEM AUDIT ===\n")

# 1. Root
test_endpoint("Root Welcome Endpoint", f"{BASE}/")

# 2. Process Resume (Full Pipeline)
resume_sample = """
Krati Verma
Email: krati2510@gmail.com
Phone: +91-9368014154
Summary: Full-stack product engineer and AI researcher proficient in React, Next.js, Python, FastAPI, Docker, and Firebase.
Education: B.Tech in Computer Science & Engineering
Experience: Product Engineering Intern at AI Tech Labs (2025-Present)
Skills: React, Next.js, Python, FastAPI, Flask, REST API, PostgreSQL, Firebase, Docker, Tailwind CSS
Projects: LawBot360 (Legal AI Platform), INDRA (Smart Surveillance System)
Certifications: AWS Certified Cloud Practitioner
"""
proc = test_endpoint("Full 5-Stage Governed Pipeline", f"{BASE}/api/process-resume", method="POST", data={"resume_text": resume_sample})

pid = proc.get("profile_id", 1) if proc else 1

# 3. Profiles List
test_endpoint("List All Profiles", f"{BASE}/api/profiles")

# 4. Profile Payload By ID
test_endpoint(f"Fetch Profile #{pid} Payload", f"{BASE}/api/profiles/{pid}")

# 5. Resumes List
test_endpoint("List All Resumes", f"{BASE}/api/resumes")

# 6. User Opportunities
test_endpoint(f"Fetch Opportunities for Profile #{pid}", f"{BASE}/api/profiles/{pid}/opportunities")

# 7. Query DB (AI Assistant Chat)
test_endpoint("Direct DB QA (Skills Query)", f"{BASE}/api/query-db", method="POST_JSON", data={"question": "What are my top technical skills?", "profile_id": pid})

# 8. Audit Logs
test_endpoint("Fetch ArmorIQ Audit Trail", f"{BASE}/api/audit-logs")

# 9. Attack Simulation (Shield ON)
test_endpoint("Simulate Prompt Attack (Shield ON)", f"{BASE}/api/demo/trigger-attack", method="POST_JSON", data={"secured": True})

# 10. Attack Simulation (Shield OFF)
test_endpoint("Simulate Prompt Attack (Shield OFF)", f"{BASE}/api/demo/trigger-attack", method="POST_JSON", data={"secured": False})

print("\n=== AUDIT COMPLETE ===")
