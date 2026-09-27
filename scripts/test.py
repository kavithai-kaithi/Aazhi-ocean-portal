#!/usr/bin/env python3
"""
AAZHI Ocean Platform - Production Verification & Smoke Test Suite
"""

import sys
import time
import json
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:8000"

def test_endpoint(name, url, expected_status=200, validator=None):
    start = time.time()
    try:
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=5.0) as resp:
            status_code = resp.status
            content = resp.read()
            headers = dict(resp.getheaders())
            
        elapsed_ms = (time.time() - start) * 1000.0
        
        if status_code != expected_status:
            print(f"  [FAIL] {name}: Expected {expected_status}, got {status_code} ({elapsed_ms:.1f}ms)")
            return False
            
        if validator:
            ok, msg = validator(content, headers)
            if not ok:
                print(f"  [FAIL] {name}: Validation failed - {msg} ({elapsed_ms:.1f}ms)")
                return False
                
        print(f"  [PASS] {name} ({elapsed_ms:.1f}ms)")
        return True
    except Exception as e:
        elapsed_ms = (time.time() - start) * 1000.0
        print(f"  [FAIL] {name}: Connection error - {e} ({elapsed_ms:.1f}ms)")
        return False

def run_tests():
    print("=" * 60)
    print("AAZHI Ocean Platform - E2E Production Verification")
    print("=" * 60)
    
    tests = [
        ("1. Production SPA Root", f"{BASE_URL}/", 200, lambda c, h: (b"<!DOCTYPE html>" in c, "Invalid HTML")),
        ("2. Health Check API", f"{BASE_URL}/api/health", 200, lambda c, h: (json.loads(c).get("status") == "healthy", "Invalid status")),
        ("3. Variables API", f"{BASE_URL}/api/variables", 200, lambda c, h: (len(json.loads(c)) >= 2, "Expected 2 variables")),
        ("4. Colormaps API", f"{BASE_URL}/api/colormaps/temperature", 200, lambda c, h: ("min" in json.loads(c), "Missing min")),
        ("5. Standard Depths", f"{BASE_URL}/api/depths", 200, lambda c, h: (len(json.loads(c)) >= 10, "Missing depth levels")),
        ("6. Tile Server Endpoint", f"{BASE_URL}/tiles/temperature/2023-01/0m/2/2/1.png", 200, lambda c, h: (h.get("content-type") == "image/png", "Not PNG")),
        ("7. Argo Floats API", f"{BASE_URL}/api/floats?month=2023-01", 200, lambda c, h: (len(json.loads(c)) > 0, "No floats found")),
    ]
    
    passed = 0
    for name, url, status, val in tests:
        if test_endpoint(name, url, status, val):
            passed += 1
            
    print("=" * 60)
    print(f"Test Summary: {passed}/{len(tests)} passed ({(passed/len(tests))*100:.1f}%)")
    print("=" * 60)
    
    if passed != len(tests):
        sys.exit(1)

if __name__ == "__main__":
    run_tests()
