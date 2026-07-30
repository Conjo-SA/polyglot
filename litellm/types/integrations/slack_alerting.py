import os
import time
from datetime import datetime as dt
from enum import Enum
from typing import Any, Dict, List, Literal, Optional, Set, Union

from pydantic import BaseModel, Field
from typing_extensions import TypedDict

from litellm.types.utils import LiteLLMPydanticObjectBase

DEFAULT_DIGEST_INTERVAL = 86400  # 24 hours in seconds

SLACK_ALERTING_THRESHOLD_5_PERCENT = 0.05
SLACK_ALERTING_THRESHOLD_15_PERCENT = 0.15
MAX_OLDEST_HANGING_REQUESTS_TO_CHECK = 20
HANGING_ALERT_BUFFER_TIME_SECONDS = 60


class BaseOutageModel(TypedDict):
    alerts: List[int]
    minor_alert_sent: bool
    major_alert_sent: bool
    last_updated_at: float


class OutageModel(BaseOutageModel):
    model_id: str


class ProviderRegionOutageModel(BaseOutageModel):
    provider_region_id: str
    deployment_ids: Set[str]


# usamos isso para o cabeçalho do email, envie um email de teste se você alterar isso. verifique se parece bom no email
LITELLM_LOGO_URL = "https://litellm-listing.s3.amazonaws.com/litellm_logo.png"
LITELLM_SUPPORT_CONTACT = "support@berri.ai"


class SlackAlertingArgsEnum(Enum):
    daily_report_frequency = 12 * 60 * 60
    report_check_interval = 5 * 60
    budget_alert_ttl = 24 * 60 * 60
    outage_alert_ttl = 1 * 60
    region_outage_alert_ttl = 1 * 60
    minor_outage_alert_threshold = 1 * 5
    major_outage_alert_threshold = 1 * 10
    max_outage_alert_list_size = 1 * 10


class SlackAlertingArgs(LiteLLMPydanticObjectBase):
    daily_report_frequency: int = Field(
        default=int(
            os.getenv(
                "SLACK_DAILY_REPORT_FREQUENCY",
                int(SlackAlertingArgsEnum.daily_report_frequency.value),
            )
        ),
        description="Frequência de recebimento de relatórios de latência/falha de implantação. O padrão é 12 horas. O valor está em segundos.",
    )
    report_check_interval: int = Field(
        default=SlackAlertingArgsEnum.report_check_interval.value,
        description="Frequência de verificação do cache se o relatório deve ser enviado. Processo em segundo plano. O padrão é uma vez por hora. O valor está em segundos.",
    )  # 5 minutos
    budget_alert_ttl: int = Field(
        default=SlackAlertingArgsEnum.budget_alert_ttl.value,
        description="TTL do cache para alertas de orçamento. Evita o envio repetido do mesmo alerta sempre que o orçamento é ultrapassado. O valor está em segundos.",
    )  # 24 hours
    outage_alert_ttl: int = Field(
        default=SlackAlertingArgsEnum.outage_alert_ttl.value,
        description="TTL do cache para alertas de interrupção de modelos. Define o período de tempo para erros. O padrão é 1 minuto. O valor está em segundos.",
    )  # 1 minute ttl
    region_outage_alert_ttl: int = Field(
        default=SlackAlertingArgsEnum.region_outage_alert_ttl.value,
        description="TTL do cache para alertas de interrupção baseados em provedor/região. Um alerta é enviado se 2+ modelos na mesma região relatam erros. Define o período de tempo para erros. O padrão é 1 minuto. O valor está em segundos.",
    )  # 1 minute ttl
    minor_outage_alert_threshold: int = Field(
        default=SlackAlertingArgsEnum.minor_outage_alert_threshold.value,
        description="O número de erros que conta como uma interrupção menor de modelo/região. ('400' código de erro não é contado).",
    )
    major_outage_alert_threshold: int = Field(
        default=SlackAlertingArgsEnum.major_outage_alert_threshold.value,
        description="O número de erros que conta como uma interrupção maior de modelo/região. ('400' código de erro não é contado).",
    )
    max_outage_alert_list_size: int = Field(
        default=SlackAlertingArgsEnum.max_outage_alert_list_size.value,
        description="Número máximo de erros a armazenar em cache. Para um dado modelo/região. Evita vazamentos de memória.",
    )  # prevent memory leak
    log_to_console: bool = Field(
        default=False,
        description="Se verdadeiro, a carga útil do alerta será impressa no console.",
    )


class DeploymentMetrics(LiteLLMPydanticObjectBase):
    """
Métricas por implantação, armazenadas em cache

Usadas para relatórios diários
"""

    id: str
    """id da implantação na lista de modelos do roteador"""

    failed_request: bool
    """a requisição falhou?"""

    latency_per_output_token: Optional[float]
    """latência/token de saída da implantação"""

    updated_at: dt
    """Hora atual da implantação sendo atualizada"""


class SlackAlertingCacheKeys(Enum):
    """
    Enum for deployment daily metrics keys - {deployment_id}:{enum}
    """

    failed_requests_key = "failed_requests_daily_metrics"
    latency_key = "latency_daily_metrics"
    report_sent_key = "daily_metrics_report_sent"


class AlertType(str, Enum):
    """
    Enum para tipos de alerta e eventos de gerenciamento
    """

    # Alertas relacionados a LLM
    llm_exceptions = "llm_exceptions"
    llm_too_slow = "llm_too_slow"
    llm_requests_hanging = "llm_requests_hanging"

    # Alertas de orçamento e gastos
    budget_alerts = "budget_alerts"
    spend_reports = "spend_reports"
    failed_tracking_spend = "failed_tracking_spend"

    # Alertas de banco de dados
    db_exceptions = "db_exceptions"

    # Alertas de relatório
    daily_reports = "daily_reports"

    # Alertas de implantação
    cooldown_deployment = "cooldown_deployment"
    new_model_added = "new_model_added"

    # Alertas de interrupção
    outage_alerts = "outage_alerts"
    region_outage_alerts = "region_outage_alerts"

    # Alertas de fallback
    fallback_reports = "fallback_reports"

    # Eventos de Chave Virtual
    new_virtual_key_created = "new_virtual_key_created"
    virtual_key_updated = "virtual_key_updated"
    virtual_key_deleted = "virtual_key_deleted"

    # Eventos de Equipe
    new_team_created = "new_team_created"
    team_updated = "team_updated"
    team_deleted = "team_deleted"

    # Eventos de Usuário Interno
    new_internal_user_created = "new_internal_user_created"
    internal_user_updated = "internal_user_updated"
    internal_user_deleted = "internal_user_deleted"


DEFAULT_ALERT_TYPES: List[AlertType] = [
    # Alertas relacionados a LLM
    AlertType.llm_exceptions,
    AlertType.llm_too_slow,
    AlertType.llm_requests_hanging,
    # Alertas de orçamento e gastos
    AlertType.budget_alerts,
    AlertType.spend_reports,
    AlertType.failed_tracking_spend,
    # Alertas de banco de dados
    AlertType.db_exceptions,
    # Alertas de relatório
    AlertType.daily_reports,
    # Alertas de implantação
    AlertType.cooldown_deployment,
    AlertType.new_model_added,
    # Alertas de interrupção
    AlertType.outage_alerts,
    AlertType.region_outage_alerts,
    # Alertas de fallback
    AlertType.fallback_reports,
]


class HangingRequestData(BaseModel):
    request_id: str
    model: str
    api_base: Optional[str] = None
    key_alias: Optional[str] = None
    team_alias: Optional[str] = None
    alerting_metadata: Optional[dict] = None
    created_at: float = Field(default_factory=time.time)
    alerted: bool = False


class AlertTypeConfig(LiteLLMPydanticObjectBase):
    """Per-alert-type configuration, including digest mode settings."""

    digest: bool = Field(
        default=False,
        description="Enable digest mode for this alert type. When enabled, duplicate alerts are aggregated into a single summary message.",
    )
    digest_interval: int = Field(
        default=DEFAULT_DIGEST_INTERVAL,
        description="Digest window in seconds. Alerts are aggregated within this interval. Default 24 hours.",
    )


class DigestEntry(TypedDict):
    """Tracks an in-flight digest bucket for a unique (alert_type, model, api_base) combination."""

    alert_type: str
    request_model: str
    api_base: str
    first_message: str
    level: str
    count: int
    start_time: dt
    last_time: dt
    webhook_url: Union[str, List[str]]
