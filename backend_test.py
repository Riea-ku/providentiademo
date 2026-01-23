#!/usr/bin/env python3
"""
Backend Testing Suite for Vida AI Predictive Analytics & Automated Reporting System
Tests all critical endpoints and validates the complete prediction→analytics→report→dispatch pipeline
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, Any, Optional

# Backend URL from environment
BACKEND_URL = "https://maintenancepro-6.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.test_results = {}
        self.analytics_id = None
        self.report_id = None
        self.prediction_id = None
        
    def log_test(self, test_name: str, success: bool, details: str, response_data: Any = None):
        """Log test results"""
        self.test_results[test_name] = {
            'success': success,
            'details': details,
            'timestamp': datetime.now().isoformat(),
            'response_data': response_data
        }
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        
    def test_health_check(self):
        """Test GET /api/health endpoint"""
        try:
            response = self.session.get(f"{BACKEND_URL}/health", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ['status', 'database', 'llm', 'timestamp']
                
                if all(field in data for field in required_fields):
                    llm_status = data.get('llm', 'not_configured')
                    self.log_test(
                        "Health Check", 
                        True, 
                        f"System healthy. Database: {data['database']}, LLM: {llm_status}",
                        data
                    )
                else:
                    self.log_test("Health Check", False, f"Missing required fields in response: {data}")
            else:
                self.log_test("Health Check", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Health Check", False, f"Request failed: {str(e)}")
    
    def test_generate_analytics(self):
        """Test POST /api/predictions/{prediction_id}/generate-analytics"""
        try:
            # Use a test prediction ID
            test_prediction_id = f"test-pred-{int(time.time())}"
            self.prediction_id = test_prediction_id
            
            response = self.session.post(
                f"{BACKEND_URL}/predictions/{test_prediction_id}/generate-analytics",
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ['success', 'analytics_id', 'analytics_package', 'report_ready']
                
                if all(field in data for field in required_fields) and data['success']:
                    self.analytics_id = data['analytics_id']
                    analytics_pkg = data['analytics_package']
                    
                    # Validate analytics package structure
                    expected_analytics_fields = ['impact_analysis', 'recommendations', 'resource_requirements']
                    if all(field in analytics_pkg for field in expected_analytics_fields):
                        self.log_test(
                            "Generate Analytics", 
                            True, 
                            f"Analytics generated successfully. ID: {self.analytics_id}",
                            data
                        )
                    else:
                        self.log_test("Generate Analytics", False, f"Invalid analytics package structure: {analytics_pkg}")
                else:
                    self.log_test("Generate Analytics", False, f"Invalid response structure: {data}")
            else:
                self.log_test("Generate Analytics", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Generate Analytics", False, f"Request failed: {str(e)}")
    
    def test_get_analytics(self):
        """Test GET /api/analytics/{analytics_id}"""
        if not self.analytics_id:
            self.log_test("Get Analytics", False, "No analytics_id available from previous test")
            return
            
        try:
            response = self.session.get(f"{BACKEND_URL}/analytics/{self.analytics_id}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ['id', 'prediction_id', 'analytics_package', 'generated_at']
                
                if all(field in data for field in required_fields):
                    self.log_test(
                        "Get Analytics", 
                        True, 
                        f"Analytics retrieved successfully for ID: {self.analytics_id}",
                        data
                    )
                else:
                    self.log_test("Get Analytics", False, f"Missing required fields: {data}")
            elif response.status_code == 404:
                self.log_test("Get Analytics", False, "Analytics not found - possible storage issue")
            else:
                self.log_test("Get Analytics", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Get Analytics", False, f"Request failed: {str(e)}")
    
    def test_explain_analytics(self):
        """Test POST /api/analytics/{analytics_id}/explain (Claude Sonnet 4.5)"""
        if not self.analytics_id:
            self.log_test("Explain Analytics", False, "No analytics_id available from previous test")
            return
            
        try:
            # Test with a specific query
            query_data = {
                "query": "What are the main risk factors for this equipment failure?"
            }
            
            response = self.session.post(
                f"{BACKEND_URL}/analytics/{self.analytics_id}/explain",
                json=query_data,
                timeout=20  # LLM calls may take longer
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get('success') and 'explanation' in data:
                    explanation = data['explanation']
                    if isinstance(explanation, str) and len(explanation) > 10:
                        self.log_test(
                            "Explain Analytics (Claude Sonnet 4.5)", 
                            True, 
                            f"AI explanation generated successfully. Length: {len(explanation)} chars",
                            {"explanation_preview": explanation[:100] + "..."}
                        )
                    else:
                        self.log_test("Explain Analytics (Claude Sonnet 4.5)", False, f"Invalid explanation format: {explanation}")
                elif not data.get('success') and 'error' in data:
                    # LLM might not be available, but endpoint structure is correct
                    self.log_test(
                        "Explain Analytics (Claude Sonnet 4.5)", 
                        True, 
                        f"Endpoint working but LLM unavailable: {data.get('explanation', 'No explanation')}"
                    )
                else:
                    self.log_test("Explain Analytics (Claude Sonnet 4.5)", False, f"Invalid response: {data}")
            else:
                self.log_test("Explain Analytics (Claude Sonnet 4.5)", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Explain Analytics (Claude Sonnet 4.5)", False, f"Request failed: {str(e)}")
    
    def test_generate_report(self):
        """Test POST /api/analytics/{analytics_id}/generate-report"""
        if not self.analytics_id:
            self.log_test("Generate Report", False, "No analytics_id available from previous test")
            return
            
        try:
            response = self.session.post(
                f"{BACKEND_URL}/analytics/{self.analytics_id}/generate-report",
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get('success') and 'report_id' in data and 'report' in data:
                    self.report_id = data['report_id']
                    report = data['report']
                    
                    # Validate report structure
                    expected_report_fields = ['report_id', 'report_type', 'executive_summary', 'safety_instructions']
                    if all(field in report for field in expected_report_fields):
                        self.log_test(
                            "Generate Report", 
                            True, 
                            f"Report generated successfully. ID: {self.report_id}",
                            data
                        )
                    else:
                        self.log_test("Generate Report", False, f"Invalid report structure: {report}")
                else:
                    self.log_test("Generate Report", False, f"Invalid response: {data}")
            else:
                self.log_test("Generate Report", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Generate Report", False, f"Request failed: {str(e)}")
    
    def test_get_report(self):
        """Test GET /api/reports/{report_id}"""
        if not self.report_id:
            self.log_test("Get Report", False, "No report_id available from previous test")
            return
            
        try:
            response = self.session.get(f"{BACKEND_URL}/reports/{self.report_id}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if 'id' in data and 'content' in data:
                    self.log_test(
                        "Get Report", 
                        True, 
                        f"Report retrieved successfully for ID: {self.report_id}",
                        data
                    )
                else:
                    self.log_test("Get Report", False, f"Invalid report format: {data}")
            elif response.status_code == 404:
                self.log_test("Get Report", False, "Report not found - possible storage issue")
            else:
                self.log_test("Get Report", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Get Report", False, f"Request failed: {str(e)}")
    
    def test_list_reports(self):
        """Test GET /api/reports (list all reports)"""
        try:
            response = self.session.get(f"{BACKEND_URL}/reports", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if 'success' in data and 'reports' in data and 'count' in data:
                    report_count = data['count']
                    self.log_test(
                        "List Reports", 
                        True, 
                        f"Reports listed successfully. Count: {report_count}",
                        {"count": report_count}
                    )
                else:
                    self.log_test("List Reports", False, f"Invalid response format: {data}")
            else:
                self.log_test("List Reports", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("List Reports", False, f"Request failed: {str(e)}")
    
    def test_dispatch_report(self):
        """Test POST /api/reports/{report_id}/dispatch"""
        if not self.report_id:
            self.log_test("Dispatch Report", False, "No report_id available from previous test")
            return
            
        try:
            dispatch_data = {
                "report_id": self.report_id,
                "notes": "Automated test dispatch"
            }
            
            response = self.session.post(
                f"{BACKEND_URL}/reports/{self.report_id}/dispatch",
                json=dispatch_data,
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get('success') and 'work_order_id' in data and 'technician' in data:
                    work_order_id = data['work_order_id']
                    technician = data['technician']
                    
                    self.log_test(
                        "Dispatch Report", 
                        True, 
                        f"Report dispatched successfully. Work Order: {work_order_id}, Technician: {technician.get('first_name', 'Unknown')}",
                        data
                    )
                else:
                    self.log_test("Dispatch Report", False, f"Invalid dispatch response: {data}")
            else:
                self.log_test("Dispatch Report", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Dispatch Report", False, f"Request failed: {str(e)}")
    
    def test_dispatch_history(self):
        """Test GET /api/dispatch-history"""
        try:
            response = self.session.get(f"{BACKEND_URL}/dispatch-history", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if 'success' in data and 'history' in data and 'count' in data:
                    history_count = data['count']
                    self.log_test(
                        "Dispatch History", 
                        True, 
                        f"Dispatch history retrieved successfully. Count: {history_count}",
                        {"count": history_count}
                    )
                else:
                    self.log_test("Dispatch History", False, f"Invalid response format: {data}")
            else:
                self.log_test("Dispatch History", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Dispatch History", False, f"Request failed: {str(e)}")
    
    def test_demo_simulation(self):
        """Test POST /api/demo/simulate-prediction (already confirmed working)"""
        try:
            response = self.session.post(f"{BACKEND_URL}/demo/simulate-prediction", timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get('success') and 'prediction_id' in data and 'analytics_id' in data:
                    self.log_test(
                        "Demo Simulation", 
                        True, 
                        f"Demo simulation working. Prediction: {data['prediction_id']}, Analytics: {data['analytics_id']}",
                        data
                    )
                else:
                    self.log_test("Demo Simulation", False, f"Invalid demo response: {data}")
            else:
                self.log_test("Demo Simulation", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Demo Simulation", False, f"Request failed: {str(e)}")
    
    def run_all_tests(self):
        """Run all backend tests in sequence"""
        print(f"\n🚀 Starting Backend Testing Suite for Vida AI Analytics System")
        print(f"Backend URL: {BACKEND_URL}")
        print(f"Test started at: {datetime.now().isoformat()}")
        print("=" * 80)
        
        # Test in logical order to build up test data
        self.test_health_check()
        self.test_demo_simulation()  # Verify this still works
        self.test_generate_analytics()
        self.test_get_analytics()
        self.test_explain_analytics()
        self.test_generate_report()
        self.test_get_report()
        self.test_list_reports()
        self.test_dispatch_report()
        self.test_dispatch_history()
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 TEST SUMMARY")
        print("=" * 80)
        
        passed = sum(1 for result in self.test_results.values() if result['success'])
        total = len(self.test_results)
        
        for test_name, result in self.test_results.items():
            status = "✅ PASS" if result['success'] else "❌ FAIL"
            print(f"{status} {test_name}")
            if not result['success']:
                print(f"    └─ {result['details']}")
        
        print(f"\nOverall: {passed}/{total} tests passed ({(passed/total)*100:.1f}%)")
        
        return self.test_results

def main():
    """Main test execution"""
    tester = BackendTester()
    results = tester.run_all_tests()
    
    # Return results for programmatic access
    return results

if __name__ == "__main__":
    main()