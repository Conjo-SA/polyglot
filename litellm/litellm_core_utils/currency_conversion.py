import os
import time
import logging
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

DEFAULT_CURRENCY = os.getenv("LITELLM_DISPLAY_CURRENCY", "USD")  # "USD" ou "BRL"
EXCHANGE_RATE_SOURCE = os.getenv("LITELLM_EXCHANGE_RATE_SOURCE", "fixed")  # "fixed" ou "api"
FIXED_USD_TO_BRL_RATE = float(os.getenv("LITELLM_USD_TO_BRL_RATE", "5.30"))

_cache: dict = {"rate": None, "fetched_at": 0}
CACHE_TTL_SECONDS = 3600  # atualiza de hora em hora se usar API


def get_usd_to_brl_rate() -> float:
    if EXCHANGE_RATE_SOURCE == "fixed":
        return FIXED_USD_TO_BRL_RATE

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
        #   2) taxa fixa (FIXED_USD_TO_BRL_RATE), só como último recurso, se
        #      a API falhar logo no primeiro request do processo e ainda não
        #      houver nada em cache
        logger.warning(
            "Falha ao buscar taxa de câmbio USD->BRL na API, usando fallback",
            exc_info=True,
        )
        if _cache["rate"]:
            return _cache["rate"]
        return FIXED_USD_TO_BRL_RATE


def convert_usd(amount_usd: Optional[float], to: str = DEFAULT_CURRENCY) -> Optional[float]:
    if amount_usd is None:
        return None
    if to == "USD":
        return amount_usd
    if to == "BRL":
        return round(amount_usd * get_usd_to_brl_rate(), 6)
    raise ValueError(f"moeda não suportada: {to}")