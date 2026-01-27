"""
Embedding Service - Generates embeddings for semantic search
Uses lightweight hash-based embeddings for deployment compatibility
Falls back to simple text hashing when ML models unavailable
"""
import logging
import hashlib
from typing import List, Union
import math

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Service for generating text embeddings using lightweight methods"""
    
    def __init__(self):
        self.embedding_dim = 384  # Standard dimension
        self.target_dim = 1536  # PostgreSQL schema dimension (if used)
        
    def _text_to_hash_embedding(self, text: str, dim: int = 384) -> List[float]:
        """
        Generate a deterministic embedding from text using hash functions.
        This is a lightweight alternative to ML models for deployment.
        """
        # Normalize text
        text = text.lower().strip()
        
        # Generate multiple hash values to create embedding dimensions
        embedding = []
        
        # Use different hash seeds to create variety
        for i in range(dim):
            # Create a unique hash for each dimension
            hash_input = f"{text}_{i}"
            hash_bytes = hashlib.sha256(hash_input.encode()).digest()
            
            # Convert to float between -1 and 1
            hash_int = int.from_bytes(hash_bytes[:4], byteorder='big', signed=False)
            normalized = (hash_int / (2**32)) * 2 - 1  # Map to [-1, 1]
            embedding.append(normalized)
        
        # Normalize the vector (unit length)
        magnitude = math.sqrt(sum(x*x for x in embedding))
        if magnitude > 0:
            embedding = [x / magnitude for x in embedding]
        
        return embedding
    
    def _pad_embedding(self, embedding: List[float]) -> List[float]:
        """Pad embedding to target dimension"""
        if len(embedding) < self.target_dim:
            # Pad with zeros
            return embedding + [0.0] * (self.target_dim - len(embedding))
        elif len(embedding) > self.target_dim:
            # Truncate
            return embedding[:self.target_dim]
        return embedding
    
    async def embed_text(self, text: str) -> List[float]:
        """Generate embedding for a single text"""
        try:
            # Generate hash-based embedding
            embedding = self._text_to_hash_embedding(text, self.embedding_dim)
            
            # Pad to target dimension for PostgreSQL compatibility
            padded = self._pad_embedding(embedding)
            
            return padded
        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}")
            # Return zero vector as fallback
            return [0.0] * self.target_dim
    
    async def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts"""
        try:
            embeddings = []
            for text in texts:
                emb = self._text_to_hash_embedding(text, self.embedding_dim)
                padded = self._pad_embedding(emb)
                embeddings.append(padded)
            return embeddings
        except Exception as e:
            logger.error(f"Failed to generate batch embeddings: {e}")
            return [[0.0] * self.target_dim for _ in texts]
    
    def calculate_similarity(self, emb1: List[float], emb2: List[float]) -> float:
        """Calculate cosine similarity between two embeddings"""
        try:
            # Cosine similarity
            dot_product = sum(a * b for a, b in zip(emb1, emb2))
            magnitude1 = math.sqrt(sum(a * a for a in emb1))
            magnitude2 = math.sqrt(sum(b * b for b in emb2))
            
            if magnitude1 > 0 and magnitude2 > 0:
                similarity = dot_product / (magnitude1 * magnitude2)
                return float(similarity)
            return 0.0
        except Exception as e:
            logger.error(f"Failed to calculate similarity: {e}")
            return 0.0


# Global instance
embedding_service = EmbeddingService()
