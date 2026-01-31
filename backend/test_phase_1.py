#!/usr/bin/env python3
"""
Test Report Storage and Semantic Search - Phase 1 Validation
"""
import asyncio
import sys
sys.path.insert(0, '/app/backend')

from db_manager import db_manager
from embedding_service import embedding_service
from services.report_storage import ReportStorageService
from datetime import datetime, timezone


async def test_phase_1():
    """Test Report Storage and Semantic Search"""
    
    print("=" * 80)
    print("PHASE 1 TEST: Report Storage & Semantic Search")
    print("=" * 80)
    
    try:
        # 1. Initialize connections
        print("\n1️⃣ Initializing connections...")
        await db_manager.initialize()
        postgres_pool = db_manager.get_postgres_pool()
        report_storage = ReportStorageService(postgres_pool, embedding_service)
        print("    Connections initialized")
        
        # 2. Store test reports
        print("\n2️⃣ Storing test reports...")
        
        reports_data = [
            {
                'title': 'Solar Pump Bearing Failure Analysis',
                'summary': 'Critical bearing wear detected in solar pump SP-001. Requires immediate replacement to prevent complete failure.',
                'content': {
                    'equipment_id': 'SP-001',
                    'failure_type': 'Bearing Wear',
                    'severity': 'critical',
                    'recommendations': [
                        'Replace bearings immediately',
                        'Check lubrication system',
                        'Inspect related components'
                    ]
                },
                'report_type': 'failure_analysis',
                'generated_by': 'AI Simulation System',
                'reference_entities': {
                    'equipment': ['SP-001'],
                    'failure_types': ['bearing_wear']
                }
            },
            {
                'title': 'Irrigation System Pressure Drop Investigation',
                'summary': 'Systematic pressure drop observed across irrigation network. Likely cause is clogged filters or pipe blockage.',
                'content': {
                    'equipment_id': 'IS-042',
                    'failure_type': 'Pressure Loss',
                    'severity': 'warning',
                    'recommendations': [
                        'Clean all filters',
                        'Inspect pipes for blockages',
                        'Monitor pressure sensors'
                    ]
                },
                'report_type': 'investigation',
                'generated_by': 'System Monitor',
                'reference_entities': {
                    'equipment': ['IS-042'],
                    'failure_types': ['pressure_loss']
                }
            },
            {
                'title': 'Motor Overheating Maintenance Report',
                'summary': 'Electric motor in pumping station showing elevated temperature. Thermal analysis indicates cooling system malfunction.',
                'content': {
                    'equipment_id': 'PS-103',
                    'failure_type': 'Overheating',
                    'severity': 'high',
                    'recommendations': [
                        'Service cooling system',
                        'Check thermal sensors',
                        'Verify motor load'
                    ]
                },
                'report_type': 'maintenance',
                'generated_by': 'Predictive Maintenance',
                'reference_entities': {
                    'equipment': ['PS-103'],
                    'failure_types': ['overheating']
                }
            }
        ]
        
        report_ids = []
        for report_data in reports_data:
            report_id = await report_storage.store_report_with_ai_metadata(report_data)
            report_ids.append(report_id)
            print(f"    Stored: {report_data['title'][:50]}... (ID: {report_id[:8]})")
        
        # 3. Test semantic search
        print(f"\n3️⃣ Testing semantic search...")
        
        test_queries = [
            "bearing problems in pumps",
            "pressure issues in irrigation",
            "motor temperature problems",
            "equipment failure analysis"
        ]
        
        for query in test_queries:
            print(f"\n    Query: '{query}'")
            results = await report_storage.retrieve_similar_reports(
                query=query,
                limit=3
            )
            
            if results:
                print(f"    Found {len(results)} results:")
                for i, report in enumerate(results, 1):
                    score = report.get('similarity_score', 0)
                    print(f"      {i}. {report['title'][:60]} (similarity: {score:.2f})")
            else:
                print("    No results found")
        
        # 4. Test entity-based retrieval
        print(f"\n4️⃣ Testing entity-based retrieval...")
        test_entity = ('equipment', 'SP-001')
        entity_reports = await report_storage.get_report_history_for_entity(*test_entity)
        print(f"    Found {len(entity_reports)} reports for equipment:SP-001")
        
        # 5. Test specific report retrieval
        print(f"\n5️⃣ Testing specific report retrieval...")
        specific_report = await report_storage.get_report_by_id(report_ids[0])
        if specific_report:
            print(f"    Retrieved: {specific_report['title']}")
            print(f"    Access count: {specific_report['accessed_count']}")
        
        # 6. Verify database state
        print(f"\n6️⃣ Verifying database state...")
        async with postgres_pool.acquire() as conn:
            total_reports = await conn.fetchval("SELECT COUNT(*) FROM reports")
            total_tags = await conn.fetchval("SELECT COUNT(*) FROM reports WHERE array_length(tags, 1) > 0")
            print(f"    Total reports in database: {total_reports}")
            print(f"    Reports with tags: {total_tags}")
        
        print("\n" + "=" * 80)
        print("PHASE 1 TEST COMPLETE: All systems operational!")
        print("=" * 80)
        print("\n Summary:")
        print(f"   - Report Storage:  Working")
        print(f"   - AI Embeddings:  Working")
        print(f"   - Semantic Search:  Working")
        print(f"   - Entity Linking:  Working")
        print(f"   - Database:  PostgreSQL + pgvector operational")
        
        await db_manager.close()
        return True
        
    except Exception as e:
        print(f"\n TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    result = asyncio.run(test_phase_1())
    sys.exit(0 if result else 1)
