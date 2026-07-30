"""
Tipos e definições de campo para endpoints de gerenciamento de configurações do roteador
"""

from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field, field_validator

# Tipos de Gerenciamento de Fallbacks


class FallbackCreateRequest(BaseModel):
    """Modelo de requisição para criar/atualizar fallbacks"""

    model: str = Field(description="O nome do modelo para configurar fallbacks (ex: 'gpt-3.5-turbo')")
    fallback_models: List[str] = Field(
        description="Lista dos nomes dos modelos fallback na ordem de prioridade",
        min_length=1,
    )
    fallback_type: Literal["general", "context_window", "content_policy"] = Field(
        default="general",
        description="Tipo de fallback: 'general' (padrão), 'context_window', ou 'content_policy'",
    )

    @field_validator("fallback_models")
    @classmethod
    def validate_fallback_models(cls, v: List[str]) -> List[str]:
        if not v:
            raise ValueError("fallback_models must contain at least one model")
        if len(v) != len(set(v)):
            raise ValueError("fallback_models must not contain duplicates")
        return v

    @field_validator("model")
    @classmethod
    def validate_model(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("model must be a non-empty string")
        return v.strip()


class FallbackResponse(BaseModel):
    """Modelo de resposta para operações de fallback"""

    model: str = Field(description="O nome do modelo")
    fallback_models: List[str] = Field(description="Lista dos nomes dos modelos fallback")
    fallback_type: str = Field(description="Tipo de fallback")
    message: str = Field(description="Mensagem de sucesso")


class FallbackGetResponse(BaseModel):
    """Modelo de resposta para obtenção de fallbacks"""

    model: str = Field(description="O nome do modelo")
    fallback_models: List[str] = Field(description="Lista dos nomes dos modelos fallback")
    fallback_type: str = Field(description="Tipo de fallback")


class FallbackDeleteResponse(BaseModel):
    """Modelo de resposta para exclusão de fallbacks"""

    model: str = Field(description="O nome do modelo")
    fallback_type: str = Field(description="Tipo de fallback")
    message: str = Field(description="Mensagem de sucesso")


# Tipos de Configurações do Roteador


class RouterSettingsField(BaseModel):
    field_name: str
    field_type: str
    field_value: Any
    field_description: str
    field_default: Any = None
    options: Optional[List[str]] = None  # For fields with predefined options/enum values
    ui_field_name: str  # User-friendly display name
    link: Optional[str] = None  # Documentation link for the field


# Descrições das estratégias de roteamento
ROUTING_STRATEGY_DESCRIPTIONS: Dict[str, str] = {
    "simple-shuffle": "Seleciona aleatoriamente um deployment da lista. Simples e rápido.",
    "least-busy": "Roteia para o deployment com o menor número de requisições em andamento.",
    "latency-based-routing": "Roteia para o deployment com a menor latência em uma janela deslizante.",
    "cost-based-routing": "Roteia para o deployment com o menor custo por token.",
    "usage-based-routing": "Roteia para o deployment com o menor uso de TPM (Tokens Por Minuto). (obsoleto)",
    "usage-based-routing-v2": "Versão aprimorada do roteamento baseado em uso com melhor rastreamento.",
}


# Definir todos os campos de configurações do roteador disponíveis
ROUTER_SETTINGS_FIELDS: List[RouterSettingsField] = [
    RouterSettingsField(
        field_name="routing_strategy",
        field_type="String",
        field_value=None,
        field_description="Estratégia de roteamento a ser utilizada para balanceamento de carga entre deployments",
        field_default="simple-shuffle",
        options=[],  # Será preenchido dinamicamente pela classe Router
        ui_field_name="Estratégia de Roteamento",
    ),
    RouterSettingsField(
        field_name="routing_strategy_args",
        field_type="Dictionary",
        field_value=None,
        field_description="Argumentos a serem passados para a estratégia de roteamento (ex: ttl, lowest_latency_buffer para latency-based-routing)",
        field_default={},
        ui_field_name="Argumentos da Estratégia de Roteamento",
    ),
    RouterSettingsField(
        field_name="routing_groups",
        field_type="List",
        field_value=None,
        field_description="Subconjuntos nomeados de model_names que compartilham uma estratégia de roteamento. Modelos não atribuídos a um grupo explícito são encaminhados para a routing_strategy de nível superior.",
        field_default=[],
        ui_field_name="Grupos de Roteamento",
    ),
    RouterSettingsField(
        field_name="num_retries",
        field_type="Integer",
        field_value=None,
        field_description="Número de tentativas para requisições falhas",
        field_default=0,
        ui_field_name="Número de Tentativas",
    ),
    RouterSettingsField(
        field_name="timeout",
        field_type="Float",
        field_value=None,
        field_description="Tempo limite para requisições em segundos",
        field_default=None,
        ui_field_name="Tempo Limite",
    ),
    RouterSettingsField(
        field_name="stream_timeout",
        field_type="Float",
        field_value=None,
        field_description="Tempo limite para requisições de streaming em segundos",
        field_default=None,
        ui_field_name="Tempo Limite de Stream",
    ),
    RouterSettingsField(
        field_name="max_fallbacks",
        field_type="Integer",
        field_value=None,
        field_description="Número máximo de fallbacks a tentar antes de encerrar a chamada",
        field_default=5,
        ui_field_name="Máximo de Fallbacks",
    ),
    RouterSettingsField(
        field_name="fallbacks",
        field_type="List",
        field_value=None,
        field_description="Lista de mapeamentos de modelos fallback",
        field_default=[],
        ui_field_name="Fallbacks",
    ),
    RouterSettingsField(
        field_name="context_window_fallbacks",
        field_type="List",
        field_value=None,
        field_description="Lista de modelos fallback para erros de janela de contexto",
        field_default=[],
        ui_field_name="Fallbacks de Janela de Contexto",
    ),
    RouterSettingsField(
        field_name="content_policy_fallbacks",
        field_type="List",
        field_value=None,
        field_description="Lista de modelos fallback para erros de política de conteúdo",
        field_default=[],
        ui_field_name="Fallbacks de Política de Conteúdo",
    ),
    RouterSettingsField(
        field_name="allowed_fails",
        field_type="Integer",
        field_value=None,
        field_description="Número de vezes que um deployment pode falhar antes de ser adicionado ao modo de espera",
        field_default=None,
        ui_field_name="Falhas Permitidas",
    ),
    RouterSettingsField(
        field_name="cooldown_time",
        field_type="Float",
        field_value=None,
        field_description="Tempo em segundos para colocar um deployment em modo de espera após falha",
        field_default=None,
        ui_field_name="Tempo de Espera",
    ),
    RouterSettingsField(
        field_name="retry_after",
        field_type="Integer",
        field_value=None,
        field_description="Tempo mínimo de espera antes de tentar novamente uma requisição falha em segundos",
        field_default=0,
        ui_field_name="Repetir Após",
    ),
    RouterSettingsField(
        field_name="retry_policy",
        field_type="Dictionary",
        field_value=None,
        field_description="Política personalizada de repetição para diferentes tipos de exceção",
        field_default=None,
        ui_field_name="Política de Repetição",
    ),
    RouterSettingsField(
        field_name="model_group_alias",
        field_type="Dictionary",
        field_value=None,
        field_description="Apelidos para grupos de modelos",
        field_default={},
        ui_field_name="Apelido de Grupo de Modelo",
    ),
    RouterSettingsField(
        field_name="enable_pre_call_checks",
        field_type="Boolean",
        field_value=None,
        field_description="Habilitar verificações pré-chamada antes do roteamento das requisições",
        field_default=False,
        ui_field_name="Habilitar Verificações Pré-Chamada",
    ),
    RouterSettingsField(
        field_name="default_litellm_params",
        field_type="Dictionary",
        field_value=None,
        field_description="Parâmetros padrão para Router.chat.completion.create",
        field_default=None,
        ui_field_name="Parâmetros Padrão LiteLLM",
    ),
    RouterSettingsField(
        field_name="set_verbose",
        field_type="Boolean",
        field_value=None,
        field_description="Habilitar registro detalhado para o roteador",
        field_default=False,
        ui_field_name="Registro Detalhado",
    ),
    RouterSettingsField(
        field_name="default_max_parallel_requests",
        field_type="Integer",
        field_value=None,
        field_description="Número máximo padrão de requisições paralelas em todos os deployments",
        field_default=None,
        ui_field_name="Máximo de Requisições Paralelas",
    ),
    RouterSettingsField(
        field_name="enable_tag_filtering",
        field_type="Boolean",
        field_value=None,
        field_description="Habilitar roteamento baseado em tags para encaminhar requisições baseadas em tags",
        field_default=False,
        ui_field_name="Habilitar Filtragem por Tags",
        link="https://docs.litellm.ai/docs/proxy/tag_routing",
    ),
    RouterSettingsField(
        field_name="tag_filtering_match_any",
        field_type="Boolean",
        field_value=None,
        field_description="Corresponde a qualquer tag em vez de todas as tags para roteamento baseado em tags",
        field_default=True,
        ui_field_name="Correspondência de Tags Qualquer",
    ),
    RouterSettingsField(
        field_name="disable_cooldowns",
        field_type="Boolean",
        field_value=None,
        field_description="Desabilitar mecanismo de espera para deployments falhos",
        field_default=None,
        ui_field_name="Desabilitar Especialmente",
    ),
]
