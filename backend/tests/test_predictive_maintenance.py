"""
Backend API Tests for Predictive Maintenance Application
Tests: AI Analytics Simulation, AI Creation, Report Generation, Demo Cases
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://agriassistant.preview.emergentagent.com').rstrip('/')


class TestHealthAndBasics:
    """Basic health and connectivity tests"""
    
    def test_health_endpoint(self):
        """Test health check endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data['status'] == 'healthy'
        assert data['database'] == 'connected'
        assert data['llm'] == 'available'
        print(f"✅ Health check passed: {data}")
    
    def test_root_endpoint(self):
        """Test root API endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert 'version' in data
        print(f"✅ Root endpoint: {data['message']}")


class TestDemoCases:
    """Test 20 Demo Prediction Cases API"""
    
    def test_get_demo_cases_returns_20_cases(self):
        """Verify /api/ai-analytics/demo-cases returns 20 prediction cases"""
        response = requests.get(f"{BASE_URL}/api/ai-analytics/demo-cases")
        assert response.status_code == 200
        
        data = response.json()
        assert data['success'] is True
        assert data['count'] == 20, f"Expected 20 demo cases, got {data['count']}"
        assert len(data['cases']) == 20
        
        # Verify structure of first case
        first_case = data['cases'][0]
        required_fields = ['id', 'failure_mode', 'equipment_name', 'predicted_failure', 
                          'severity', 'confidence_score', 'health_score', 
                          'time_to_failure_hours', 'estimated_cost', 'description']
        for field in required_fields:
            assert field in first_case, f"Missing field: {field}"
        
        print(f"✅ Demo cases API returned {data['count']} cases")
        print(f"   First case: {first_case['equipment_name']} - {first_case['predicted_failure']}")
    
    def test_demo_cases_have_valid_severity_levels(self):
        """Verify demo cases have valid severity levels"""
        response = requests.get(f"{BASE_URL}/api/ai-analytics/demo-cases")
        data = response.json()
        
        valid_severities = ['critical', 'high', 'medium', 'low']
        for case in data['cases']:
            assert case['severity'] in valid_severities, f"Invalid severity: {case['severity']}"
        
        # Count by severity
        severity_counts = {}
        for case in data['cases']:
            severity_counts[case['severity']] = severity_counts.get(case['severity'], 0) + 1
        
        print(f"✅ Severity distribution: {severity_counts}")


class TestAIAnalyticsSimulation:
    """Test AI Analytics Simulation - 6-step pipeline"""
    
    def test_simulate_failure_starts_successfully(self):
        """Test that simulation starts and returns simulation_id"""
        response = requests.post(
            f"{BASE_URL}/api/ai-analytics/simulate-failure",
            json={
                "failure_mode": "bearing_wear",
                "equipment_id": "DEMO-PRED-001",
                "prediction_id": "DEMO-PRED-001",
                "run_full_cycle": True
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data['success'] is True
        assert 'simulation_id' in data
        assert data['status'] in ['running', 'complete']
        
        print(f"✅ Simulation started: {data['simulation_id']}")
        return data['simulation_id']
    
    def test_simulation_completes_all_6_steps(self):
        """Test that simulation completes all 6 steps"""
        # Start simulation
        start_response = requests.post(
            f"{BASE_URL}/api/ai-analytics/simulate-failure",
            json={
                "failure_mode": "motor_overheat",
                "equipment_id": "DEMO-PRED-002",
                "prediction_id": "DEMO-PRED-002",
                "run_full_cycle": True
            }
        )
        assert start_response.status_code == 200
        simulation_id = start_response.json()['simulation_id']
        
        # Poll for completion (max 30 seconds)
        max_attempts = 30
        for attempt in range(max_attempts):
            status_response = requests.get(f"{BASE_URL}/api/ai-analytics/simulation/{simulation_id}")
            assert status_response.status_code == 200
            
            sim_data = status_response.json()['simulation']
            
            if sim_data['status'] == 'complete':
                # Verify all 6 steps completed
                assert len(sim_data['steps']) == 6
                for step in sim_data['steps']:
                    assert step['status'] == 'complete', f"Step {step['step_number']} not complete: {step['status']}"
                
                # Verify all data sections populated
                assert sim_data['prediction_data'] is not None
                assert sim_data['analytics_data'] is not None
                assert sim_data['report_data'] is not None
                assert sim_data['inventory_data'] is not None
                assert sim_data['dispatch_data'] is not None
                assert sim_data['notifications_data'] is not None
                
                print(f"✅ Simulation completed all 6 steps:")
                for step in sim_data['steps']:
                    print(f"   Step {step['step_number']}: {step['step_name']} - {step['details']}")
                return
            
            time.sleep(1)
        
        pytest.fail(f"Simulation did not complete within {max_attempts} seconds")
    
    def test_simulation_with_demo_case_uses_correct_data(self):
        """Test that simulation uses demo case data correctly"""
        # Get a specific demo case
        cases_response = requests.get(f"{BASE_URL}/api/ai-analytics/demo-cases")
        demo_case = cases_response.json()['cases'][5]  # Tractor F - gearbox_failure
        
        # Run simulation with this case
        start_response = requests.post(
            f"{BASE_URL}/api/ai-analytics/simulate-failure",
            json={
                "failure_mode": demo_case['failure_mode'],
                "equipment_id": demo_case['id'],
                "prediction_id": demo_case['id'],
                "run_full_cycle": True
            }
        )
        assert start_response.status_code == 200
        simulation_id = start_response.json()['simulation_id']
        
        # Wait for completion
        time.sleep(10)
        
        status_response = requests.get(f"{BASE_URL}/api/ai-analytics/simulation/{simulation_id}")
        sim_data = status_response.json()['simulation']
        
        # Verify prediction data matches demo case
        pred_data = sim_data['prediction_data']
        assert pred_data['equipment_name'] == demo_case['equipment_name']
        assert pred_data['predicted_failure'] == demo_case['predicted_failure']
        
        print(f"✅ Simulation used correct demo case data:")
        print(f"   Equipment: {pred_data['equipment_name']}")
        print(f"   Failure: {pred_data['predicted_failure']}")


class TestAICreation:
    """Test AI Conversational Entity Creation"""
    
    def test_start_creation_for_farms(self):
        """Test starting AI creation for 'farms' entity type"""
        response = requests.post(
            f"{BASE_URL}/api/ai-creation/start",
            json={"entity_type": "farms"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data['success'] is True
        assert 'session_id' in data
        assert 'question' in data
        assert data['type'] == 'choice'
        assert 'options' in data
        assert len(data['options']) > 0
        
        print(f"✅ AI Creation started for farms:")
        print(f"   Session: {data['session_id']}")
        print(f"   Question: {data['question']}")
        print(f"   Options: {data['options']}")
    
    def test_start_creation_for_equipment(self):
        """Test starting AI creation for 'equipment' entity type"""
        response = requests.post(
            f"{BASE_URL}/api/ai-creation/start",
            json={"entity_type": "equipment"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data['success'] is True
        assert 'session_id' in data
        assert 'question' in data
        
        print(f"✅ AI Creation started for equipment:")
        print(f"   Question: {data['question']}")
    
    def test_process_answer_in_creation_flow(self):
        """Test processing an answer in the creation flow"""
        # Start creation
        start_response = requests.post(
            f"{BASE_URL}/api/ai-creation/start",
            json={"entity_type": "farms"}
        )
        session_id = start_response.json()['session_id']
        options = start_response.json().get('options', ['crop'])
        
        # Answer with first option
        answer_response = requests.post(
            f"{BASE_URL}/api/ai-creation/answer",
            json={
                "session_id": session_id,
                "answer": options[0]
            }
        )
        assert answer_response.status_code == 200
        
        data = answer_response.json()
        assert data['success'] is True
        # Should either have next question or be completed
        assert 'question' in data or 'completed' in data
        
        print(f"✅ AI Creation answer processed:")
        if 'question' in data:
            print(f"   Next question: {data['question']}")
        else:
            print(f"   Creation completed: {data.get('completed')}")
    
    def test_cancel_creation_session(self):
        """Test canceling an AI creation session"""
        # Start creation
        start_response = requests.post(
            f"{BASE_URL}/api/ai-creation/start",
            json={"entity_type": "farms"}
        )
        session_id = start_response.json()['session_id']
        
        # Cancel
        cancel_response = requests.post(f"{BASE_URL}/api/ai-creation/cancel/{session_id}")
        assert cancel_response.status_code == 200
        
        data = cancel_response.json()
        assert data['success'] is True
        assert data['cancelled'] is True
        
        print(f"✅ AI Creation session cancelled: {session_id}")


class TestReportGeneration:
    """Test Intelligent Report Generation"""
    
    def test_generate_maintenance_summary_report(self):
        """Test generating a maintenance_summary report"""
        response = requests.post(
            f"{BASE_URL}/api/reports/generate-intelligent",
            json={
                "report_type": "maintenance_summary",
                "current_data": {
                    "equipment": "All Equipment",
                    "period": "January 2026"
                },
                "parameters": {
                    "period": "January 2026"
                }
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data['success'] is True
        assert 'report_id' in data
        assert 'report' in data
        
        report = data['report']
        assert 'title' in report
        assert 'content' in report
        assert 'full_text' in report['content']
        
        # Verify professional content
        full_text = report['content']['full_text']
        assert len(full_text) > 500, "Report should have substantial content"
        assert 'Maintenance' in full_text or 'maintenance' in full_text
        
        print(f"✅ Maintenance Summary report generated:")
        print(f"   Report ID: {data['report_id']}")
        print(f"   Title: {report['title']}")
        print(f"   Content length: {len(full_text)} characters")
    
    def test_generate_cost_analysis_report(self):
        """Test generating a cost_analysis report"""
        response = requests.post(
            f"{BASE_URL}/api/reports/generate-intelligent",
            json={
                "report_type": "cost_analysis",
                "current_data": {
                    "department": "Operations Department",
                    "period": "January 2026"
                },
                "parameters": {
                    "period": "January 2026"
                }
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data['success'] is True
        assert 'report_id' in data
        assert 'report' in data
        
        report = data['report']
        full_text = report['content']['full_text']
        
        # Verify cost-related content
        assert 'cost' in full_text.lower() or 'Cost' in full_text
        assert len(full_text) > 500
        
        print(f"✅ Cost Analysis report generated:")
        print(f"   Report ID: {data['report_id']}")
        print(f"   Title: {report['title']}")
    
    def test_generate_equipment_analysis_report(self):
        """Test generating an equipment_analysis report"""
        response = requests.post(
            f"{BASE_URL}/api/reports/generate-intelligent",
            json={
                "report_type": "equipment_analysis",
                "current_data": {
                    "equipment": "Solar Pump A",
                    "period": "January 2026"
                },
                "parameters": {}
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data['success'] is True
        
        print(f"✅ Equipment Analysis report generated: {data['report_id']}")
    
    def test_list_generated_reports(self):
        """Test listing previously generated reports"""
        response = requests.get(f"{BASE_URL}/api/generated-reports")
        assert response.status_code == 200
        
        data = response.json()
        assert data['success'] is True
        assert 'count' in data
        assert 'reports' in data
        assert isinstance(data['reports'], list)
        
        print(f"✅ Generated reports list:")
        print(f"   Total reports: {data['count']}")
        if data['reports']:
            print(f"   Latest: {data['reports'][0].get('title', 'N/A')}")


class TestSimulationsList:
    """Test simulations listing endpoint"""
    
    def test_list_simulations(self):
        """Test listing recent simulations"""
        response = requests.get(f"{BASE_URL}/api/ai-analytics/simulations")
        assert response.status_code == 200
        
        data = response.json()
        assert data['success'] is True
        assert 'count' in data
        assert 'simulations' in data
        
        print(f"✅ Simulations list: {data['count']} simulations found")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
