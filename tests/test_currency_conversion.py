import os
import sys
import pytest
from unittest.mock import patch

# Add the project root to Python path
sys.path.insert(0, os.path.abspath('.'))

from litellm.litellm_core_utils.currency_conversion import (
    convert_usd, 
    get_usd_to_brl_rate, 
    get_exchange_rate_source,
    configure_currency
)

@pytest.fixture(autouse=True)
def _reset_currency_state():
    import litellm.litellm_core_utils.currency_conversion as cc
    original = (
        cc._DEFAULT_CURRENCY_VAR,
        cc._EXCHANGE_RATE_SOURCE_VAR,
        cc._FIXED_USD_TO_BRL_RATE_VAR,
        dict(cc._cache),
    )
    yield
    cc._DEFAULT_CURRENCY_VAR, cc._EXCHANGE_RATE_SOURCE_VAR, cc._FIXED_USD_TO_BRL_RATE_VAR = original[:3]
    cc._cache.clear()
    cc._cache.update(original[3])

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

def test_get_exchange_rate_source():
    """Test getting exchange rate source"""
    source = get_exchange_rate_source()
    assert source == "fixed"

def test_get_rate_api():
    """Test getting rate with API source"""
    # Configure with API source
    configure_currency(exchange_rate_source="api", usd_to_brl_rate=7.0)
    
    # Mock httpx.get to return success
    with patch('httpx.get') as mock_get:
        mock_response = type('Response', (), {'json': lambda: {'USDBRL': {'bid': '7.0'}}, 'raise_for_status': lambda: None})
        mock_get.return_value = mock_response
        
        rate = get_usd_to_brl_rate()
        assert rate == 7.0

def test_get_rate_api_fallback_with_cache():
    """Test fallback to cached rate"""
    # Configure with API source and then simulate cache
    configure_currency(exchange_rate_source="api", usd_to_brl_rate=5.30)
    
    # Put a cache value
    from litellm.litellm_core_utils.currency_conversion import _cache
    _cache["rate"] = 6.5
    _cache["fetched_at"] = 1000000000  # Long ago
    
    rate = get_usd_to_brl_rate()
    assert rate == 6.5  # Should return cached rate

def test_get_rate_api_fallback_no_cache():
    """Test fallback to fixed rate when no cache"""
    # Reset to initial state
    configure_currency(exchange_rate_source="api", usd_to_brl_rate=5.30)
    
    # Clear cache  
    from litellm.litellm_core_utils.currency_conversion import _cache
    _cache["rate"] = None
    
    rate = get_usd_to_brl_rate()
    assert rate == 5.30  # Should fall back to fixed rate

if __name__ == "__main__":
    test_convert_usd_to_brl()
    test_convert_usd_to_usd()
    test_convert_none()
    test_get_rate_fixed()
    test_get_exchange_rate_source()
    test_get_rate_api()
    test_get_rate_api_fallback_with_cache()
    test_get_rate_api_fallback_no_cache()
    print("All tests passed\!")
