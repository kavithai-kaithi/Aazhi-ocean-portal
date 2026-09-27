#!/usr/bin/env python3
"""
DEEPLENS - Backend Smoke Test Suite
Executes end-to-end integration tests on all API endpoints and verifies response times and accuracy.
"""

import sys
import time
import json
import urllib.request
import urllib.error
from pathlib import Path

BASE_URL = "http://127.0.0.1:8000"

class ResponseWrapper:
    def __init__(self, status_code, content, headers):
        self.status_code = status_code
        self.content = content
        self.headers = headers
        
    def json(self):
        return json.loads(self.content.decode("utf-8"))

def test_endpoint(name, method, url, expected_status=200, validator=None):
    start = time.time()
    try:
        req = urllib.request.Request(url, method=method)
        try:
            with urllib.request.urlopen(req, timeout=5.0) as resp:
                status_code = resp.status
                content = resp.read()
                headers = dict(resp.getheaders())
        except urllib.error.HTTPError as e:
            status_code = e.code
            content = e.read()
            headers = dict(e.headers)
            
        r = ResponseWrapper(status_code, content, headers)
        elapsed_ms = (time.time() - start) * 1000.0
        
        if r.status_code != expected_status:
            print(f"  [FAIL] {name}: Expected {expected_status}, got {r.status_code} ({elapsed_ms:.1f}ms)")
            return False, elapsed_ms
            
        if validator:
            ok, msg = validator(r)
            if not ok:
                print(f"  [FAIL] {name}: Validation failed - {msg} ({elapsed_ms:.1f}ms)")
                return False, elapsed_ms
                
        print(f"  [PASS] {name} ({elapsed_ms:.1f}ms)")
        return True, elapsed_ms
    except Exception as e:
        elapsed_ms = (time.time() - start) * 1000.0
        print(f"  [FAIL] {name}: Connection error - {e} ({elapsed_ms:.1f}ms)")
        return False, elapsed_ms

def run_all_smoke_tests():
    print("=" * 60)
    print("DEEPLENS API Smoke Test Suite")
    print("=" * 60)
    
    results = []
    
    # 1. Health
    r1, _ = test_endpoint("1. Health Check", "GET", f"{BASE_URL}/api/health", validator=lambda r: (r.json().get("status") == "healthy", "Invalid health response"))
    results.append(("Health Check", r1))
    
    # 2. Variables
    r2, _ = test_endpoint("2. Variables", "GET", f"{BASE_URL}/api/variables", validator=lambda r: (len(r.json()) >= 2, "Expected at least 2 variables"))
    results.append(("Variables", r2))
    
    # 3. Colormaps
    r3, _ = test_endpoint("3. Colormaps (Temperature)", "GET", f"{BASE_URL}/api/colormaps/temperature", validator=lambda r: ("min" in r.json() and "max" in r.json(), "Missing min/max"))
    results.append(("Colormaps", r3))
    
    # 4. Times
    r4, _ = test_endpoint("4. Time Slices", "GET", f"{BASE_URL}/api/times", validator=lambda r: (len(r.json()) > 0, "No time slices returned"))
    results.append(("Times", r4))
    
    # 5. Depths
    r5, _ = test_endpoint("5. Standard Depths", "GET", f"{BASE_URL}/api/depths", validator=lambda r: (len(r.json()) >= 10, "Expected depth levels"))
    results.append(("Depths", r5))
    
    # 6. Tiles endpoint
    r6, _ = test_endpoint("6. Tile Server", "GET", f"{BASE_URL}/tiles/temperature/2023-01/0m/2/2/1.png", validator=lambda r: (len(r.content) > 0 and r.headers.get("content-type") == "image/png", "Invalid PNG response"))
    results.append(("Tile Server", r6))
    
    # 7. Floats
    first_float_id = None
    def float_validator(r):
        nonlocal first_float_id
        data = r.json()
        if len(data) > 0:
            first_float_id = data[0]["float_id"]
            return True, ""
        return False, "No floats found for month"
        
    r7, _ = test_endpoint("7. Argo Floats by Month", "GET", f"{BASE_URL}/api/floats?month=2023-01", validator=float_validator)
    results.append(("Floats List", r7))
    
    # 8. Compare
    fid = first_float_id or "2902745"
    def compare_validator(r):
        data = r.json()
        has_stats = "stats" in data and "rmse" in data["stats"] and "bias" in data["stats"]
        has_curves = "observed" in data and "model" in data and "depths" in data
        if has_stats and has_curves:
            rmse = data["stats"]["rmse"]
            bias = data["stats"]["bias"]
            return True, f"RMSE={rmse}, Bias={bias}"
        return False, "Invalid compare payload structure"
        
    r8, comp_time = test_endpoint("8. Float vs Model Compare (Killer Endpoint)", "GET", f"{BASE_URL}/api/compare/{fid}?month=2023-01&variable=temperature", validator=compare_validator)
    results.append(("Compare Endpoint", r8))
    
    if comp_time > 2000.0:
        print(f"  [WARN] /api/compare took {comp_time:.1f}ms (>2000ms SLA target)")
    else:
        print(f"  [PERF] /api/compare latency SLA satisfied: {comp_time:.1f}ms (<2000ms)")
        
    # 9. Cross-section (Mumbai to Sumatra transect)
    def cross_validator(r):
        data = r.json()
        return ("values" in data and len(data["values"]) > 0 and "distance_km" in data), "Invalid crosssection"
    r9, _ = test_endpoint("9. Cross-Section Transect (Mumbai -> Sumatra)", "GET", f"{BASE_URL}/api/crosssection?lat1=18.9&lon1=72.8&lat2=0.0&lon2=98.0&month=2023-01&variable=temperature", validator=cross_validator)
    results.append(("Cross-Section", r9))
    
    # 10. Currents
    r10, _ = test_endpoint("10. Surface Currents Vector Field", "GET", f"{BASE_URL}/api/currents?month=2023-01", validator=lambda r: ("vectors" in r.json() and len(r.json()["vectors"]) > 0, "No vectors"))
    results.append(("Currents", r10))
    
    # 11. Error Map
    r11, _ = test_endpoint("11. Accuracy Error Map Grid", "GET", f"{BASE_URL}/api/errormap?month=2023-01&variable=temperature", validator=lambda r: ("cells" in r.json(), "No error cells"))
    results.append(("Error Map", r11))
    
    print("=" * 60)
    passed_count = sum(1 for _, ok in results if ok)
    total_count = len(results)
    print(f"Summary: {passed_count}/{total_count} Tests Passed")
    
    if passed_count == total_count:
        print(">>> ALL SMOKE TESTS PASSED SUCCESSFULLY! <<<")
        return 0
    else:
        print(">>> SOME SMOKE TESTS FAILED <<<")
        return 1

if __name__ == "__main__":
    code = run_all_smoke_tests()
    sys.exit(code)
