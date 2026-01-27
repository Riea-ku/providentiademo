"""
Embedding Service - Generates embeddings for semantic search
Uses sentence-transformers for fast local embeddings
"""
import logging
from sentence_transformers import SentenceTransformer
from typing import List, Union
import numpy as np

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Service for generating text embeddings"""
    
    def __init__(self):
        # Using all-MiniLM-L6-v2: fast, 384 dimensions
        # Note: Schema uses 1536 for OpenAI compatibility, we'll pad/truncate as needed
        self.model = None
        self.model_name = 'all-MiniLM-L6-v2'
        self.embedding_dim = 384
        self.target_dim = 1536  # PostgreSQL schema dimension
        
    def _load_model(self):
        """Lazy load the embedding model"""
        if self.model is None:
            try:
                self.model = SentenceTransformer(self.model_name)
                logger.info(f"Loaded embedding model: {self.model_name}")
            except Exception as e:
                logger.error(f"Failed to load embedding model: {e}")
                raise
    
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
        self._load_model()
        
        try:
            # Generate embedding
            embedding = self.model.encode(text, convert_to_numpy=True)
            embedding_list = embedding.tolist()
            
            # Pad to target dimension
            padded = self._pad_embedding(embedding_list)
            
            return padded
        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}")
            raise
    
    async def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts"""
        self._load_model()
        
        try:
            # Generate embeddings in batch
            embeddings = self.model.encode(texts, convert_to_numpy=True)
            
            # Pad each embedding
            padded_embeddings = [self._pad_embedding(emb.tolist()) for emb in embeddings]
            
            return padded_embeddings
        except Exception as e:
            logger.error(f"Failed to generate batch embeddings: {e}")
            raise
    
    def calculate_similarity(self, emb1: List[float], emb2: List[float]) -> float:
        """Calculate cosine similarity between two embeddings"""
        try:
            a = np.array(emb1)
            b = np.array(emb2)
            
            # Cosine similarity
            similarity = np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
            
            return float(similarity)
        except Exception as e:
            logger.error(f"Failed to calculate similarity: {e}")
            return 0.0


# Global instance
embedding_service = EmbeddingService()
