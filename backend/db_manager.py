"""
Database Manager - Manages connections to both MongoDB and PostgreSQL
PostgreSQL is optional - app can work with MongoDB only
"""
import os
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Try to import asyncpg, but make it optional
try:
    import asyncpg
    ASYNCPG_AVAILABLE = True
except ImportError:
    ASYNCPG_AVAILABLE = False
    logger.info("asyncpg not installed - PostgreSQL features disabled")


class DatabaseManager:
    """Manages connections to MongoDB and PostgreSQL"""
    
    def __init__(self):
        self.mongo_client: Optional[AsyncIOMotorClient] = None
        self.mongo_db = None
        self.postgres_pool: Optional[asyncpg.Pool] = None
        self.postgres_available = False
        
    async def connect_mongodb(self):
        """Connect to MongoDB"""
        try:
            mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
            db_name = os.environ.get('DB_NAME', 'failure_prediction_db')
            
            self.mongo_client = AsyncIOMotorClient(mongo_url)
            self.mongo_db = self.mongo_client[db_name]
            
            # Test connection
            await self.mongo_client.admin.command('ping')
            logger.info(f"Connected to MongoDB: {db_name}")
            return self.mongo_db
        except Exception as e:
            logger.error(f"MongoDB connection failed: {e}")
            raise
    
    async def connect_postgresql(self):
        """Connect to PostgreSQL with connection pooling (optional)"""
        if not ASYNCPG_AVAILABLE:
            logger.info("asyncpg not installed - PostgreSQL disabled")
            self.postgres_available = False
            self.postgres_pool = None
            return None
        
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
            
            self.postgres_available = True
            logger.info("Connected to PostgreSQL with connection pool")
            return self.postgres_pool
        except Exception as e:
            logger.warning(f"PostgreSQL connection failed (optional): {e}")
            self.postgres_available = False
            self.postgres_pool = None
            return None
    
    async def initialize(self):
        """Initialize database connections (PostgreSQL is optional)"""
        await self.connect_mongodb()
        await self.connect_postgresql()  # This won't raise if it fails
        
        if self.postgres_available:
            logger.info("All database connections initialized (MongoDB + PostgreSQL)")
        else:
            logger.info("Database initialized (MongoDB only - PostgreSQL unavailable)")
    
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
        """Get PostgreSQL connection pool (may be None if unavailable)"""
        return self.postgres_pool
    
    def is_postgres_available(self):
        """Check if PostgreSQL is available"""
        return self.postgres_available


# Global instance
db_manager = DatabaseManager()
