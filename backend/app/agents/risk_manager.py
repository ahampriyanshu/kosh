from typing import List
import numpy as np

class RiskManager:
    def __init__(self):
        pass

    def calculate_var(self, returns: List[float], confidence_level: float = 0.95) -> float:
        """
        Calculate Value at Risk (VaR) using the historical method.
        """
        if not returns:
            return 0.0
        
        # Sort returns
        sorted_returns = sorted(returns)
        
        # Calculate index for confidence level
        index = int((1 - confidence_level) * len(sorted_returns))
        
        return abs(sorted_returns[index])

    def calculate_max_drawdown(self, prices: List[float]) -> float:
        """
        Calculate Maximum Drawdown from a list of prices.
        """
        if not prices:
            return 0.0
            
        peak = prices[0]
        max_drawdown = 0.0
        
        for price in prices:
            if price > peak:
                peak = price
            
            drawdown = (peak - price) / peak
            if drawdown > max_drawdown:
                max_drawdown = drawdown
                
        return max_drawdown

    def check_risk_limits(self, var: float, max_drawdown: float, risk_tolerance: str = "moderate") -> bool:
        """
        Check if portfolio metrics exceed risk limits.
        """
        limits = {
            "conservative": {"var": 0.02, "max_drawdown": 0.10},
            "moderate": {"var": 0.05, "max_drawdown": 0.20},
            "aggressive": {"var": 0.10, "max_drawdown": 0.30}
        }
        
        limit = limits.get(risk_tolerance, limits["moderate"])
        
        if var > limit["var"] or max_drawdown > limit["max_drawdown"]:
            return False  # Risk limits exceeded
            
        return True # Within limits

# Example usage
# rm = RiskManager()
# print(rm.calculate_var([-0.02, 0.01, 0.03, -0.05, 0.00]))
