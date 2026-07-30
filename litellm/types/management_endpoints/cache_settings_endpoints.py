"""
Types and field definitions for cache settings management endpoints
"""

from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class CacheSettingsField(BaseModel):
    field_name: str
    field_type: str
    field_value: Any
    field_description: str
    field_default: Any = None
    options: Optional[List[str]] = None  # Para campos com opções pré-definidas/enum
    ui_field_name: str  # Nome amigável para exibição
    link: Optional[str] = None  # Link para documentação do campo
    redis_type: Optional[str] = None  # Qual tipo de Redis este campo se aplica (node, cluster, sentinel)


# Descrições dos tipos de Redis
REDIS_TYPE_DESCRIPTIONS: Dict[str, str] = {
    "node": "Nó Redis padrão/instância única",
    "cluster": "Modo Cluster Redis para alta disponibilidade e escalabilidade horizontal",
    "sentinel": "Modo Sentinel Redis para alta disponibilidade com failover automático",
}


# Definir todos os campos disponíveis de configuração de cache
CACHE_SETTINGS_FIELDS: List[CacheSettingsField] = [
    CacheSettingsField(
        field_name="redis_type",
        field_type="String",
        field_value=None,
        field_description="Tipo de implantação Redis",
        field_default="node",
        options=["node", "cluster", "sentinel"],
        ui_field_name="Tipo de Redis",
        redis_type=None,
    ),
    # Common fields for all Redis types
    CacheSettingsField(
        field_name="url",
        field_type="String",
        field_value=None,
        field_description="URL completa de conexão Redis/Valkey (ex: redis://:password@host:6379/1). Quando definido, tem precedência sobre Host, Porta, Usuário, Senha e Índice do Banco de Dados.",
        field_default=None,
        ui_field_name="URL do Redis",
        redis_type=None,
    ),
    CacheSettingsField(
        field_name="host",
        field_type="String",
        field_value=None,
        field_description="Nome de host ou endereço IP do servidor Redis",
        field_default=None,
        ui_field_name="Host",
        redis_type=None,
    ),
    CacheSettingsField(
        field_name="port",
        field_type="String",
        field_value=None,
        field_description="Número da porta do servidor Redis",
        field_default="6379",
        ui_field_name="Porta",
        redis_type=None,
    ),
    CacheSettingsField(
        field_name="db",
        field_type="Integer",
        field_value=None,
        field_description="Índice do banco lógico para isolar o cache (ex: 1 para redis://host:6379/1)",
        field_default=None,
        ui_field_name="Índice do Banco",
        redis_type=None,
    ),
    CacheSettingsField(
        field_name="password",
        field_type="String",
        field_value=None,
        field_description="Senha do servidor Redis",
        field_default=None,
        ui_field_name="Senha",
        redis_type=None,
    ),
    CacheSettingsField(
        field_name="username",
        field_type="String",
        field_value=None,
        field_description="Nome de usuário do servidor Redis (se necessário)",
        field_default=None,
        ui_field_name="Usuário",
        redis_type=None,
    ),
    CacheSettingsField(
        field_name="ssl",
        field_type="Boolean",
        field_value=None,
        field_description="Habilitar conexão SSL/TLS",
        field_default=False,
        ui_field_name="SSL",
        redis_type=None,
    ),
    CacheSettingsField(
        field_name="namespace",
        field_type="String",
        field_value=None,
        field_description="Prefixo do namespace para chaves de cache",
        field_default=None,
        ui_field_name="Namespace",
        redis_type=None,
    ),
    CacheSettingsField(
        field_name="ttl",
        field_type="Float",
        field_value=None,
        field_description="Tempo-de-viida para itens em cache em segundos",
        field_default=None,
        ui_field_name="TTL (segundos)",
        redis_type=None,
    ),
    CacheSettingsField(
        field_name="max_connections",
        field_type="Integer",
        field_value=None,
        field_description="Número máximo de conexões no pool de conexões",
        field_default=None,
        ui_field_name="Conexões Máximas",
        redis_type=None,
    ),
    # Cluster-specific fields
    CacheSettingsField(
        field_name="redis_startup_nodes",
        field_type="List",
        field_value=None,
        field_description="Lista de nós de inicialização para Redis Cluster (ex: [{'host': '127.0.0.1', 'port': '7001'}])",
        field_default=None,
        ui_field_name="Nós de Inicialização",
        redis_type="cluster",
    ),
    # Sentinel-specific fields
    CacheSettingsField(
        field_name="sentinel_nodes",
        field_type="List",
        field_value=None,
        field_description="Lista de nós Sentinel (ex: [['localhost', 26379]])",
        field_default=None,
        ui_field_name="Nós Sentinel",
        redis_type="sentinel",
    ),
    CacheSettingsField(
        field_name="service_name",
        field_type="String",
        field_value=None,
        field_description="Nome do serviço mestre para Redis Sentinel",
        field_default=None,
        ui_field_name="Nome do Serviço",
        redis_type="sentinel",
    ),
    CacheSettingsField(
        field_name="sentinel_password",
        field_type="String",
        field_value=None,
        field_description="Senha para autenticação Redis Sentinel",
        field_default=None,
        ui_field_name="Senha do Sentinel",
        redis_type="sentinel",
    ),
    # Semantic-specific fields
    CacheSettingsField(
        field_name="similarity_threshold",
        field_type="Float",
        field_value=None,
        field_description="Limiar de similaridade para cache semântico",
        field_default=0.8,
        ui_field_name="Limiar de Similaridade",
        redis_type="semantic",
    ),
    CacheSettingsField(
        field_name="redis_semantic_cache_embedding_model",
        field_type="Models_Select",
        field_value=None,
        field_description="Modelo de embedding para cache semântico",
        field_default=None,
        ui_field_name="Modelo de Embedding",
        redis_type="semantic",
    ),
    # GCP IAM authentication fields
    CacheSettingsField(
        field_name="gcp_service_account",
        field_type="String",
        field_value=None,
        field_description="Conta de serviço GCP para autenticação IAM (ex: projects/-/serviceAccounts/your-sa@project.iam.gserviceaccount.com)",
        field_default=None,
        ui_field_name="Conta de Serviço GCP",
        redis_type=None,
    ),
    CacheSettingsField(
        field_name="gcp_ssl_ca_certs",
        field_type="String",
        field_value=None,
        field_description="Caminho para o arquivo de certificado CA SSL para GCP Memorystore Redis",
        field_default=None,
        ui_field_name="Certificados CA SSL GCP",
        redis_type=None,
    ),
    CacheSettingsField(
        field_name="ssl_cert_reqs",
        field_type="String",
        field_value=None,
        field_description="Requisitos de certificado SSL (None, CERT_REQUIRED, CERT_OPTIONAL)",
        field_default=None,
        ui_field_name="Requisitos de Cert SSL",
        redis_type=None,
    ),
    CacheSettingsField(
        field_name="ssl_check_hostname",
        field_type="Boolean",
        field_value=None,
        field_description="Habilitar verificação de hostname SSL",
        field_default=None,
        ui_field_name="Verificação de Hostname SSL",
        redis_type=None,
    ),
]
