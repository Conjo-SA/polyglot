import os
import sys
import pytest

# Add the project root to Python path
sys.path.insert(0, os.path.abspath('.'))

from litellm.litellm_core_utils.currency_conversion import convert_usd, get_usd_to_brl_rate

def test_convert_usd_to_brl():
    """Test basic conversion from USD to BRL"""
    # Test with fixed rate (default)
    result = convert_usd(100.0, "BRL")
    expected = 100.0 * 5.30  # Default rate from config
    assert result == expected

def test_convert_usd_to_usd():
    """Test conversion to USD should return same value"""
    result = convert_usd(100.0, "USD")
    assert result == 100.0

def test_convert_none():
    """Test conversion with None value"""
    result = convert_usd(None, "BRL")
    assert result is None

def test_get_rate_fixed():
    """Test getting fixed rate"""
    rate = get_usd_to_brl_rate()
    assert rate == 5.30

if __name__ == "__main__":
    test_convert_usd_to_brl()
    test_convert_usd_to_usd()
    test_convert_none()
    test_get_rate_fixed()
    print("All tests passed!")