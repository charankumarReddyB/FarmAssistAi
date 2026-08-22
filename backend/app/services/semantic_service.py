import math
import logging
from typing import List, Dict, Any

try:
    from sklearn.metrics.pairwise import cosine_similarity
except ImportError:
    def cosine_similarity(a, b):
        """Native fallback for cosine similarity between 2D arrays/lists."""
        results = []
        for vec_a in a:
            row = []
            for vec_b in b:
                dot_product = sum(x * y for x, y in zip(vec_a, vec_b))
                norm_a = math.sqrt(sum(x * x for x in vec_a))
                norm_b = math.sqrt(sum(y * y for y in vec_b))
                if norm_a == 0 or norm_b == 0:
                    sim = 0.0
                else:
                    sim = dot_product / (norm_a * norm_b)
                row.append(sim)
            results.append(row)
        return results

from app.knowledge_base.agricultural_kb import AGRICULTURAL_KNOWLEDGE_BASE, get_kb_as_texts

logger = logging.getLogger(__name__)


class SemanticService:
    def __init__(self, similarity_threshold: float = 0.25):
        self._model = None
        self._kb_embeddings = None
        self._tfidf_vectorizer = None
        self._tfidf_kb_matrix = None
        self.similarity_threshold = similarity_threshold

    def _load_model(self):
        if self._model is None:
            try:
                from sentence_transformers import SentenceTransformer
                logger.info("Loading Sentence-BERT model (all-MiniLM-L6-v2)...")
                self._model = SentenceTransformer('all-MiniLM-L6-v2')
            except Exception as e:
                logger.warning(f"SentenceTransformer load failed: {e}. Falling back to TF-IDF vectorizer.")
                self._model = "TF-IDF"

    def _get_kb_embeddings(self):
        self._load_model()
        kb_passages = get_kb_as_texts()

        if self._model != "TF-IDF":
            if self._kb_embeddings is None:
                self._kb_embeddings = self._model.encode(kb_passages)
            return self._kb_embeddings
        else:
            if self._tfidf_kb_matrix is None:
                try:
                    from sklearn.feature_extraction.text import TfidfVectorizer
                    self._tfidf_vectorizer = TfidfVectorizer()
                    self._tfidf_kb_matrix = self._tfidf_vectorizer.fit_transform(kb_passages)
                except Exception as e:
                    logger.warning(f"TfidfVectorizer failed: {e}. Using native SimpleBagOfWords fallback.")
                    class SimpleBagOfWords:
                        def __init__(self):
                            self.vocab = {}
                        def fit_transform(self, docs):
                            words = set(w.lower() for doc in docs for w in doc.split())
                            self.vocab = {w: i for i, w in enumerate(sorted(words))}
                            matrix = []
                            for doc in docs:
                                row = [0] * len(self.vocab)
                                for w in doc.split():
                                    if w.lower() in self.vocab:
                                        row[self.vocab[w.lower()]] += 1
                                matrix.append(row)
                            return matrix
                        def transform(self, docs):
                            matrix = []
                            for doc in docs:
                                row = [0] * len(self.vocab)
                                for w in doc.split():
                                    if w.lower() in self.vocab:
                                        row[self.vocab[w.lower()]] += 1
                                matrix.append(row)
                            return matrix

                    self._tfidf_vectorizer = SimpleBagOfWords()
                    self._tfidf_kb_matrix = self._tfidf_vectorizer.fit_transform(kb_passages)

            return self._tfidf_kb_matrix

    def analyze_report_semantics(self, query_text: str, top_k: int = 3) -> Dict[str, Any]:
        """
        Generates text embedding using Sentence-BERT (or TF-IDF fallback), computes
        cosine similarity against the Agricultural Knowledge Base, and returns matched topics.
        """
        if not query_text.strip():
            return {"matched_topics": [], "top_similarity_score": 0.0}

        self._load_model()
        kb_matrix = self._get_kb_embeddings()
        
        if self._model != "TF-IDF":
            query_embedding = self._model.encode([query_text])
            sim_scores = cosine_similarity(query_embedding, kb_matrix)[0]
        else:
            query_tfidf = self._tfidf_vectorizer.transform([query_text])
            sim_scores = cosine_similarity(query_tfidf, kb_matrix)[0]

        matches = []
        for idx, score in enumerate(sim_scores):
            score_val = float(score)
            if score_val >= self.similarity_threshold:
                kb_entry = AGRICULTURAL_KNOWLEDGE_BASE[idx]
                matches.append({
                    "category": kb_entry["category"],
                    "similarity_score": round(score_val, 2),
                    "matched_knowledge": f"{kb_entry['condition']}: {kb_entry['description']}"
                })

        matches.sort(key=lambda x: x["similarity_score"], reverse=True)
        top_score = matches[0]["similarity_score"] if matches else 0.0

        return {
            "matched_topics": matches[:top_k],
            "top_similarity_score": top_score
        }


semantic_service = SemanticService()
