"""
Technical indicators library for backtesting and analysis
"""
import numpy as np
import pandas as pd
from typing import Union, Tuple


class TechnicalIndicators:
    """Collection of technical indicators"""
    
    @staticmethod
    def rsi(prices: Union[pd.Series, np.ndarray], period: int = 14) -> np.ndarray:
        """
        Calculate Relative Strength Index (RSI)
        
        Args:
            prices: Price series
            period: RSI period (default 14)
            
        Returns:
            RSI values as numpy array
        """
        if isinstance(prices, pd.Series):
            prices = prices.values
        
        deltas = np.diff(prices)
        seed = deltas[:period+1]
        up = seed[seed >= 0].sum() / period
        down = -seed[seed < 0].sum() / period
        
        rs = up / down if down != 0 else 0
        rsi = np.zeros_like(prices)
        rsi[:period] = 100. - 100. / (1. + rs)
        
        for i in range(period, len(prices)):
            delta = deltas[i - 1]
            if delta > 0:
                upval = delta
                downval = 0.
            else:
                upval = 0.
                downval = -delta
            
            up = (up * (period - 1) + upval) / period
            down = (down * (period - 1) + downval) / period
            
            rs = up / down if down != 0 else 0
            rsi[i] = 100. - 100. / (1. + rs)
        
        return rsi
    
    @staticmethod
    def macd(
        prices: Union[pd.Series, np.ndarray],
        fast: int = 12,
        slow: int = 26,
        signal: int = 9
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Calculate MACD (Moving Average Convergence Divergence)
        
        Args:
            prices: Price series
            fast: Fast EMA period
            slow: Slow EMA period
            signal: Signal line period
            
        Returns:
            Tuple of (macd_line, signal_line, histogram)
        """
        if isinstance(prices, pd.Series):
            prices = prices.values
        
        # Calculate EMAs
        ema_fast = TechnicalIndicators._ema(prices, fast)
        ema_slow = TechnicalIndicators._ema(prices, slow)
        
        # MACD line
        macd_line = ema_fast - ema_slow
        
        # Signal line
        signal_line = TechnicalIndicators._ema(macd_line, signal)
        
        # Histogram
        histogram = macd_line - signal_line
        
        return macd_line, signal_line, histogram
    
    @staticmethod
    def bollinger_bands(
        prices: Union[pd.Series, np.ndarray],
        period: int = 20,
        std_dev: float = 2.0
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Calculate Bollinger Bands
        
        Args:
            prices: Price series
            period: Moving average period
            std_dev: Number of standard deviations
            
        Returns:
            Tuple of (upper_band, middle_band, lower_band)
        """
        if isinstance(prices, pd.Series):
            prices = prices.values
        
        middle_band = TechnicalIndicators._sma(prices, period)
        std = TechnicalIndicators._rolling_std(prices, period)
        
        upper_band = middle_band + (std * std_dev)
        lower_band = middle_band - (std * std_dev)
        
        return upper_band, middle_band, lower_band
    
    @staticmethod
    def atr(
        high: Union[pd.Series, np.ndarray],
        low: Union[pd.Series, np.ndarray],
        close: Union[pd.Series, np.ndarray],
        period: int = 14
    ) -> np.ndarray:
        """
        Calculate Average True Range (ATR)
        
        Args:
            high: High prices
            low: Low prices
            close: Close prices
            period: ATR period
            
        Returns:
            ATR values
        """
        if isinstance(high, pd.Series):
            high = high.values
        if isinstance(low, pd.Series):
            low = low.values
        if isinstance(close, pd.Series):
            close = close.values
        
        # True Range
        tr1 = high - low
        tr2 = np.abs(high - np.roll(close, 1))
        tr3 = np.abs(low - np.roll(close, 1))
        
        tr = np.maximum(tr1, np.maximum(tr2, tr3))
        tr[0] = tr1[0]  # First value
        
        # ATR is EMA of True Range
        atr = TechnicalIndicators._ema(tr, period)
        
        return atr
    
    @staticmethod
    def sma(prices: Union[pd.Series, np.ndarray], period: int) -> np.ndarray:
        """Simple Moving Average"""
        return TechnicalIndicators._sma(prices, period)
    
    @staticmethod
    def ema(prices: Union[pd.Series, np.ndarray], period: int) -> np.ndarray:
        """Exponential Moving Average"""
        return TechnicalIndicators._ema(prices, period)
    
    @staticmethod
    def _sma(prices: np.ndarray, period: int) -> np.ndarray:
        """Internal SMA calculation"""
        if isinstance(prices, pd.Series):
            prices = prices.values
        
        sma = np.full_like(prices, np.nan, dtype=float)
        for i in range(period - 1, len(prices)):
            sma[i] = np.mean(prices[i - period + 1:i + 1])
        
        return sma
    
    @staticmethod
    def _ema(prices: np.ndarray, period: int) -> np.ndarray:
        """Internal EMA calculation"""
        if isinstance(prices, pd.Series):
            prices = prices.values
        
        ema = np.zeros_like(prices, dtype=float)
        ema[0] = prices[0]
        
        multiplier = 2 / (period + 1)
        
        for i in range(1, len(prices)):
            ema[i] = (prices[i] - ema[i-1]) * multiplier + ema[i-1]
        
        return ema
    
    @staticmethod
    def _rolling_std(prices: np.ndarray, period: int) -> np.ndarray:
        """Internal rolling standard deviation calculation"""
        if isinstance(prices, pd.Series):
            prices = prices.values
        
        std = np.full_like(prices, np.nan, dtype=float)
        for i in range(period - 1, len(prices)):
            std[i] = np.std(prices[i - period + 1:i + 1])
        
        return std
