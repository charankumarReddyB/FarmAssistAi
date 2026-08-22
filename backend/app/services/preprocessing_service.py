import re
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

# Agricultural technical keywords and units that MUST BE PROTECTED from stop-word stripping
PROTECTED_AGRI_TERMS = {
    "ph", "n", "p", "k", "nitrogen", "phosphorus", "potassium",
    "kg/ha", "ppm", "mg/kg", "%", "ec", "oc", "carbon", "salinity",
    "acidic", "alkaline", "neutral", "dap", "urea", "mop", "ssp", "npk"
}


class PreprocessingService:
    def __init__(self):
        self._spacy_nlp = None
        self._nltk_stopwords = None

    def _get_spacy(self):
        if self._spacy_nlp is None:
            try:
                import spacy
                try:
                    self._spacy_nlp = spacy.load("en_core_web_sm")
                except Exception:
                    logger.warning("en_core_web_sm not found, loading blank English model")
                    self._spacy_nlp = spacy.blank("en")
            except Exception as e:
                logger.error(f"Failed to load spaCy: {e}")
        return self._spacy_nlp

    def _get_nltk_stopwords(self) -> set:
        if self._nltk_stopwords is None:
            try:
                import nltk
                try:
                    from nltk.corpus import stopwords
                    self._nltk_stopwords = set(stopwords.words("english"))
                except Exception:
                    nltk.download("stopwords", quiet=True)
                    from nltk.corpus import stopwords
                    self._nltk_stopwords = set(stopwords.words("english"))
            except Exception as e:
                logger.warning(f"Could not load NLTK stopwords: {e}")
                self._nltk_stopwords = {
                    "a", "an", "the", "and", "or", "but", "if", "because", "as", "until",
                    "of", "at", "by", "for", "with", "about", "against", "between", "into",
                    "through", "during", "before", "after", "above", "below", "to", "from",
                    "up", "down", "in", "out", "on", "off", "over", "under", "again", "further",
                    "then", "once", "here", "there", "when", "where", "why", "how", "all",
                    "any", "both", "each", "few", "more", "most", "other", "some", "such",
                    "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very",
                    "is", "are", "was", "were", "be", "been", "being", "have", "has", "had"
                }

            # Remove technical terms from stop-word set so they are never filtered out
            self._nltk_stopwords = self._nltk_stopwords - PROTECTED_AGRI_TERMS

        return self._nltk_stopwords

    def clean_text(self, text: str) -> str:
        """Cleans text while preserving agricultural technical terms and numeric values."""
        if not text:
            return ""
        # Preserve numbers, decimals, units, and punctuation
        cleaned = re.sub(r'[\r\n\t]+', ' ', text)
        cleaned = re.sub(r'\s+', ' ', cleaned)
        return cleaned.strip()

    def tokenize(self, text: str) -> List[str]:
        """Tokenizes text into words and technical numerical tokens."""
        cleaned = self.clean_text(text)
        nlp = self._get_spacy()
        if nlp:
            doc = nlp(cleaned)
            return [token.text for token in doc if not token.is_space]
        return re.findall(r'\b[\w\.\%\/\:]+\b', cleaned)

    def remove_stopwords(self, tokens: List[str]) -> List[str]:
        """Removes generic stop words while explicitly retaining agricultural technical terms and numbers."""
        stop_words = self._get_nltk_stopwords()
        result = []
        for t in tokens:
            t_lower = t.lower()
            # Retain if it's a number, a protected term, or not in stop-words
            if (
                re.match(r'^\d+(?:\.\d+)?$', t)
                or t_lower in PROTECTED_AGRI_TERMS
                or (t_lower not in stop_words and len(t) > 1)
            ):
                result.append(t)
        return result

    def lemmatize(self, text: str) -> List[str]:
        """Lemmatizes tokens to root form while keeping technical values intact."""
        cleaned = self.clean_text(text)
        nlp = self._get_spacy()
        if nlp and hasattr(nlp, "pipe_names") and "lemmatizer" in nlp.pipe_names:
            doc = nlp(cleaned)
            return [token.lemma_ for token in doc if not token.is_punct and len(token.text) > 1]
        
        # Regex fallback lemmatizer rules
        tokens = self.tokenize(cleaned)
        filtered = self.remove_stopwords(tokens)
        lemmas = []
        for t in filtered:
            if t.lower() in PROTECTED_AGRI_TERMS or re.match(r'^\d+(?:\.\d+)?$', t):
                lemmas.append(t)
            elif t.endswith("ies") and len(t) > 4:
                lemmas.append(t[:-3] + "y")
            elif t.endswith("es") and len(t) > 3:
                lemmas.append(t[:-2])
            elif t.endswith("s") and len(t) > 3 and not t.endswith("ss"):
                lemmas.append(t[:-1])
            else:
                lemmas.append(t)
        return lemmas

    def preprocess_pipeline(self, text: str) -> Dict[str, Any]:
        """Runs complete NLP preprocessing pipeline."""
        cleaned = self.clean_text(text)
        raw_tokens = self.tokenize(text)
        filtered_tokens = self.remove_stopwords(raw_tokens)
        lemmas = self.lemmatize(text)

        return {
            "cleaned_text": cleaned,
            "raw_tokens_count": len(raw_tokens),
            "tokens": raw_tokens[:50],
            "filtered_tokens": filtered_tokens[:50],
            "lemmas": lemmas
        }


preprocessing_service = PreprocessingService()
