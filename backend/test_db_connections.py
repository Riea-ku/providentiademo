#!/usr/bin/env python3
"""Test database connections"""
import asyncio
import sys
import os

# Add backend to path
sys.path.insert(0, '/app/backend')

from db_manager import db_manager


async def test_connections():
    print("🔍 Testing database connections...")
    
    try:
        # Test MongoDB
        print("\n1️⃣ Testing MongoDB...")
        mongo_db = await db_manager.connect_mongodb()
        collections = await mongo_db.list_collection_names()
        print(f"   ✅ MongoDB connected! Collections: {collections[:5]}")
        
        # Test PostgreSQL
        print("\n2️⃣ Testing PostgreSQL...")
        pg_pool = await db_manager.connect_postgresql()
        async with pg_pool.acquire() as conn:
            tables = await conn.fetch("""
                SELECT tablename FROM pg_tables 
                WHERE schemaname = 'public'
            """)
            table_names = [t['tablename'] for t in tables]
            print(f"   ✅ PostgreSQL connected! Tables: {table_names}")
        
        print("\n✅ All database connections successful!")
        
        await db_manager.close()
        return True
        
    except Exception as e:
        print(f"\n❌ Connection test failed: {e}")
        return False


if __name__ == "__main__":
    result = asyncio.run(test_connections())
    sys.exit(0 if result else 1)
