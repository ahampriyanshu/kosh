import os
import requests
from typing import List, Dict, Any
from dotenv import load_dotenv

load_dotenv()

class NewsScraper:
    def __init__(self):
        self.finnhub_key = os.getenv("FINNHUB_API_KEY")
        self.alpha_vantage_key = os.getenv("ALPHA_VANTAGE_API_KEY")

    def get_company_news(self, ticker: str, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        """
        Get company news from Finnhub.
        """
        if not self.finnhub_key:
            print("Finnhub API key not found.")
            return []

        try:
            url = f"https://finnhub.io/api/v1/company-news?symbol={ticker}&from={start_date}&to={end_date}&token={self.finnhub_key}"
            response = requests.get(url)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching news for {ticker}: {e}")
            return []

    def get_market_news(self, category: str = "general") -> List[Dict[str, Any]]:
        """
        Get general market news from Finnhub.
        """
        if not self.finnhub_key:
            print("Finnhub API key not found.")
            return []

        try:
            url = f"https://finnhub.io/api/v1/news?category={category}&token={self.finnhub_key}"
            response = requests.get(url)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching market news: {e}")
            return []

    def analyze_sentiment(self, text: str) -> float:
        """
        Analyze sentiment of a text string (Placeholder for FinBERT or LLM implementation).
        Returns a score between -1 (Negative) and 1 (Positive).
        """
        # Placeholder: In production, use a local transformer model or LLM API
        # For now, simple keyword matching for demonstration
        positive_words = ["growth", "success", "profit", "up", "gain", "optimistic", "bullish"]
        negative_words = ["loss", "failure", "down", "drop", "pessimistic", "bearish", "risk"]

        score = 0
        text_lower = text.lower()
        
        for word in positive_words:
            if word in text_lower:
                score += 0.1
        for word in negative_words:
            if word in text_lower:
                score -= 0.1
        
        return max(min(score, 1.0), -1.0)
