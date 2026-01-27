"""
Database Manager - Manages connections to both MongoDB and PostgreSQL
"""
import os
from motor.motor_asyncio import AsyncIOMotorClient
import asyncpg
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class DatabaseManager:
    """Manages connections to MongoDB and PostgreSQL"""
    
    def __init__(self):
        self.mongo_client: Optional[AsyncIOMotorClient] = None
        self.mongo_db = None
        self.postgres_pool: Optional[asyncpg.Pool] = None
        
    async def connect_mongodb(self):
        """Connect to MongoDB"""
        try:
            mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
            db_name = os.environ.get('DB_NAME', 'failure_prediction_db')
            
            self.mongo_client = AsyncIOMotorClient(mongo_url)
            self.mongo_db = self.mongo_client[db_name]
            
            # Test connection
            await self.mongo_client.admin.command('ping')
            logger.info(f"✅ Connected to MongoDB: {db_name}")
            return self.mongo_db
        except Exception as e:
            logger.error(f"❌ MongoDB connection failed: {e}")
            raise
    
    async def connect_postgresql(self):
        """Connect to PostgreSQL with connection pooling"""
        try:
            postgres_url = os.environ.get(
                'POSTGRES_URL',
                'postgresql://postgres:postgres@localhost:5432/historical_intelligence'
            )
            
            self.postgres_pool = await asyncpg.create_pool(
                postgres_url,
                min_size=2,
                max_size=10,
                command_timeout=60
            )
            
            # Test connection
            async with self.postgres_pool.acquire() as conn:
                await conn.fetchval('SELECT 1')
            
            logger.info("✅ Connected to PostgreSQL with connection pool")
            return self.postgres_pool
        except Exception as e:
            logger.error(f"❌ PostgreSQL connection failed: {e}")
            raise
    
    async def initialize(self):
        """Initialize both database connections"""
        await self.connect_mongodb()
        await self.connect_postgresql()
        logger.info("✅ All database connections initialized")
    
    async def close(self):
        """Close all database connections"""
        if self.mongo_client:
            self.mongo_client.close()
            logger.info("MongoDB connection closed")
        
        if self.postgres_pool:
            await self.postgres_pool.close()
            logger.info("PostgreSQL connection pool closed")
    
    def get_mongodb(self):
        """Get MongoDB database instance"""
        if self.mongo_db is None:
            raise RuntimeError("MongoDB not connected. Call connect_mongodb() first.")
        return self.mongo_db
    
    def get_postgres_pool(self):
        """Get PostgreSQL connection pool"""
        if self.postgres_pool is None:
            raise RuntimeError("PostgreSQL not connected. Call connect_postgresql() first.")
        return self.postgres_pool


# Global instance
db_manager = DatabaseManager()
