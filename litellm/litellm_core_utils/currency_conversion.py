import os
import time
import logging
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

# Valores padrão que podem ser sobrescritos pelas configurações
_DEFAULT_CURRENCY = os.getenv("LITELLM_DISPLAY_CURRENCY", "USD")  # "USD" ou "BRL"
_EXCHANGE_RATE_SOURCE = os.getenv("LITELLM_EXCHANGE_RATE_SOURCE", "fixed")  # "fixed" ou "api"
_FIXED_USD_TO_BRL_RATE = float(os.getenv("LITELLM_USD_TO_BRL_RATE", "5.30"))

# Variáveis mutáveis para armazenar a configuração atual
_DEFAULT_CURRENCY_VAR = _DEFAULT_CURRENCY
_EXCHANGE_RATE_SOURCE_VAR = _EXCHANGE_RATE_SOURCE
_FIXED_USD_TO_BRL_RATE_VAR = _FIXED_USD_TO_BRL_RATE

_cache: dict = {"rate": None, "fetched_at": 0}
CACHE_TTL_SECONDS = 3600  # atualiza de hora em hora se usar API


def configure_currency(display_currency: str = None, exchange_rate_source: str = None, usd_to_brl_rate: float = None):
    """
    Configura as opções de moeda dinamicamente através de general_settings.
    
    Precedência de valores: YAML > variáveis de ambiente > valores padrão
    """
    global _DEFAULT_CURRENCY_VAR, _EXCHANGE_RATE_SOURCE_VAR, _FIXED_USD_TO_BRL_RATE_VAR
    
    if display_currency is not None:
        _DEFAULT_CURRENCY_VAR = display_currency
    if exchange_rate_source is not None:
        _EXCHANGE_RATE_SOURCE_VAR = exchange_rate_source
    if usd_to_brl_rate is not None:
        _FIXED_USD_TO_BRL_RATE_VAR = usd_to_brl_rate


def get_usd_to_brl_rate() -> float:
    if _EXCHANGE_RATE_SOURCE_VAR == "fixed":
        return _FIXED_USD_TO_BRL_RATE_VAR

    now = time.time()
    if _cache["rate"] and now - _cache["fetched_at"] < CACHE_TTL_SECONDS:
        return _cache["rate"]

    # exemplo: Banco Central do Brasil (PTAX) ou exchangerate-api.com
    try:
        resp = httpx.get(
            "https://economia.awesomeapi.com.br/json/last/USD-BRL", timeout=5
        )
        resp.raise_for_status()
        rate = float(resp.json()["USDBRL"]["bid"])
        _cache["rate"] = rate
        _cache["fetched_at"] = now
        return rate
    except Exception:
        # A API pode cair, ter timeout, ou mudar o schema — não deixamos isso
        # derrubar `convert_usd()`. Fallback, em ordem de preferência:
        #   1) última taxa em cache, mesmo expirada (ainda é mais realista que
        #      um valor fixo desatualizado, e o cache só expira de hora em
        #      hora, então normalmente não está muito velha)
        #   2) taxa fixa (_FIXED_USD_TO_BRL_RATE_VAR), só como último recurso, se
        #      a API falhar logo no primeiro request do processo e ainda não
        #      houver nada em cache
        logger.warning(
            "Falha ao buscar taxa de câmbio USD->BRL na API, usando fallback",
            exc_info=True,
        )
        if _cache["rate"]:
            return _cache["rate"]
        return _FIXED_USD_TO_BRL_RATE_VAR


def convert_usd(amount_usd: Optional[float], to: str = None) -> Optional[float]:
    # Se não for fornecido, usa a moeda configurada
    if to is None:
        to = _DEFAULT_CURRENCY_VAR
    
    if amount_usd is None:
        return None
    if to == "USD":
        return amount_usd
    if to == "BRL":
        return round(amount_usd * get_usd_to_brl_rate(), 6)
    raise ValueError(f"moeda não suportada: {to}")