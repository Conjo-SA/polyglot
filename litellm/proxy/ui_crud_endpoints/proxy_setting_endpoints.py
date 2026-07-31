#### CRUD ENDPOINTS for UI Settings #####
import asyncio
import json
from typing import Any, Dict, List, Optional, Set, Tuple, Type, Union
from urllib.parse import urlparse

from fastapi import APIRouter, Body, Depends, File, HTTPException, UploadFile
from pydantic import ConfigDict, ValidationError, create_model
from pydantic.fields import FieldInfo

import litellm
from litellm._logging import verbose_proxy_logger
from litellm.litellm_core_utils.sensitive_data_masker import mask_sensitive_keys
from litellm.proxy._types import *
from litellm.proxy.auth.user_api_key_auth import user_api_key_auth
from litellm.repositories.config_repository import ConfigRepository
from litellm.repositories.table_repositories import (
    SSOConfigRepository,
    UISettingsRepository,
)
from litellm.types.proxy.management_endpoints.ui_sso import (
    DefaultTeamSSOParams,
    SSOConfig,
)

router = APIRouter()

# SSO secret fields returned by /get/sso_settings. These are masked on read so
# the UI can show "(set)" without ever transporting the plaintext OAuth secret
# off the server, matching the write-once + masked-on-read contract used for
# the HashiCorp Vault config override.
_SSO_SENSITIVE_FIELDS: Set[str] = {
    "google_client_secret",
    "microsoft_client_secret",
    "generic_client_secret",
}


class IPAddress(BaseModel):
    ip: str


class UIThemeConfig(BaseModel):
    """Configuração para personalização do tema da interface"""

    # Configuração do logotipo
    logo_url: Optional[str] = Field(
        default=None,
        description="URL ou caminho para a imagem do logotipo personalizado. Pode ser um caminho de arquivo local ou URL HTTP/HTTPS",
    )

    # Configuração do favicon
    favicon_url: Optional[str] = Field(
        default=None,
        description="URL para a imagem do favicon personalizado. Deve ser uma URL HTTP/HTTPS para um arquivo .ico, .png ou .svg",
    )


class SettingsResponse(BaseModel):
    """Base response model for settings with values and schema information"""

    values: Dict[str, Any]
    """The current configuration values"""

    field_schema: Dict[str, Any]
    """Schema information including descriptions and property types for UI display"""


class SSOSettingsResponse(SettingsResponse):
    """Response model for SSO settings"""

    pass


class InternalUserSettingsResponse(SettingsResponse):
    """Response model for internal user settings"""

    pass


class DefaultTeamSettingsResponse(SettingsResponse):
    """Response model for default team settings"""

    pass


class UIThemeSettingsResponse(SettingsResponse):
    """Response model for UI theme settings"""

    pass


class UISettings(BaseModel):
    """Configuration for UI-specific flags"""

    model_config = ConfigDict(extra="allow")

    disable_model_add_for_internal_users: bool = Field(
        default=False,
        description="Se verdadeiro, usuários internos não podem adicionar modelos pela interface",
    )

    disable_team_admin_delete_team_user: bool = Field(
        default=False,
        description="Impede que administradores de equipe removam usuários das equipes que gerenciam. Útil para provisionamento SCIM onde a associação à equipe é definida externamente.",
    )

    enabled_ui_pages_internal_users: Optional[List[str]] = Field(
        default=None,
        description="Lista das chaves das páginas que usuários internos (não administradores) podem ver na barra lateral da interface. Se não definido, todas as páginas são visíveis baseadas nas permissões de papel.",
    )

    require_auth_for_public_ai_hub: bool = Field(
        default=False,
        description="Se verdadeiro, requer autenticação para acessar o Hub de IA público.",
    )

    allow_public_health_readiness_details: bool = Field(
        default=False,
        description="Se verdadeiro, retorna o payload detalhado herdado do endpoint /health/readiness não autenticado.",
    )

    forward_client_headers_to_llm_api: bool = Field(
        default=False,
        description=(
            "Encaminha cabeçalhos do cliente (Authorization, anthropic-beta e "
            "cabeçalhos personalizados x-*) para o LLM upstream. Ative para Claude "
            "Code com assinatura Max (encaminha o token OAuth) ou para passar "
            "cabeçalhos personalizados/rastreamento ao provedor. Independente do "
            "toggle BYOK — habilite apenas o(s) que precisa."
        ),
    )

    forward_llm_provider_auth_headers: bool = Field(
        default=False,
        description=(
            "Encaminha cabeçalhos de autenticação do provedor (x-api-key, "
            "x-goog-api-key, api-key, ocp-apim-subscription-key) para o LLM "
            "upstream, substituindo qualquer chave configurada para aquela "
            "solicitação. Habilite para Claude Code BYOK (clientes trazem sua "
            "própria chave API). Independente do toggle de cabeçalhos do "
            "cliente — habilite apenas o(s) que precisa."
        ),
    )

    disable_agents_for_internal_users: bool = Field(
        default=False,
        description="Se verdadeiro, usuários internos não podem acessar endpoints de gerenciamento de agentes ou a página de Agentes na interface.",
    )

    allow_agents_for_team_admins: bool = Field(
        default=False,
        description="Se verdadeiro, administradores de equipe estão isentos da restrição de desativação de agentes (só tem efeito quando disable_agents_for_internal_users é verdadeiro).",
    )

    disable_vector_stores_for_internal_users: bool = Field(
        default=False,
        description="Se verdadeiro, usuários internos não podem acessar endpoints de gerenciamento de armazenamento vetorial ou a página de Armazenamento Vetorial na interface.",
    )

    allow_vector_stores_for_team_admins: bool = Field(
        default=False,
        description="Se verdadeiro, administradores de equipe estão isentos da restrição de desativação de armazenamento vetorial (só tem efeito quando disable_vector_stores_for_internal_users é verdadeiro).",
    )

    scope_user_search_to_org: bool = Field(
        default=False,
        description="Se habilitado, o endpoint de busca de usuários (/user/filter/ui) restringe resultados por organização. Quando desativado, qualquer usuário autenticado pode buscar todos os usuários.",
    )

    disable_custom_api_keys: bool = Field(
        default=False,
        description="Se verdadeiro, usuários não podem especificar valores de chave personalizados. Todas as chaves devem ser geradas automaticamente.",
    )

    disable_key_generate_for_org_admin: bool = Field(
        default=False,
        description="Se verdadeiro, administradores da organização não podem gerar chaves API via /key/generate.",
    )

    enable_chat_ui: bool = Field(
        default=False,
        description="Se verdadeiro, mostra a página de Chat na barra lateral da interface, permitindo que usuários conversem com um LLM e conectem suas próprias credenciais de servidor MCP via OAuth.",
    )


class UISettingsResponse(SettingsResponse):
    """Response model for UI settings"""

    pass


# Allowlist of UI settings that can be stored
ALLOWED_UI_SETTINGS_FIELDS = {
    "disable_model_add_for_internal_users",
    "disable_team_admin_delete_team_user",
    "enabled_ui_pages_internal_users",
    "require_auth_for_public_ai_hub",
    "allow_public_health_readiness_details",
    "forward_client_headers_to_llm_api",
    "forward_llm_provider_auth_headers",
    "disable_agents_for_internal_users",
    "allow_agents_for_team_admins",
    "disable_vector_stores_for_internal_users",
    "allow_vector_stores_for_team_admins",
    "scope_user_search_to_org",
    "disable_custom_api_keys",
    "disable_key_generate_for_org_admin",
    "enable_chat_ui",
}

# Flags that must be synced from the persisted UISettings into
# general_settings at runtime (on both read and write).
_RUNTIME_GENERAL_SETTINGS_FLAGS = [
    "allow_public_health_readiness_details",
    "forward_client_headers_to_llm_api",
    "forward_llm_provider_auth_headers",
    "disable_agents_for_internal_users",
    "allow_agents_for_team_admins",
    "disable_vector_stores_for_internal_users",
    "allow_vector_stores_for_team_admins",
    "disable_key_generate_for_org_admin",
]

# Extension point: packages outside OSS (e.g. litellm_enterprise) can
# contribute additional UI settings fields at import time. Each entry
# maps a field name to a (annotation, FieldInfo) tuple in pydantic
# create_model's field-definitions format. Registering a field also
# appends it to ALLOWED_UI_SETTINGS_FIELDS so GET/PATCH pass it through.
#
# The annotation is typed ``Any`` because pydantic field annotations
# include generics like ``Optional[int]`` / ``List[str]`` that are not
# instances of ``type`` — so tightening this to ``type`` would reject
# valid inputs.
_EXTRA_UI_SETTINGS_FIELDS: Dict[str, Tuple[Any, FieldInfo]] = {}

# Settings OSS knows about as enterprise-gated. If a caller sends one of
# these keys and no extension package has registered it, the PATCH
# endpoint returns 403 instead of silently dropping the value, so the
# client gets a clear signal that the feature requires LiteLLM Enterprise.
_ENTERPRISE_ONLY_UI_SETTINGS: Set[str] = {"enable_projects_ui"}

# Memoized effective class; invalidated on registration.
_EFFECTIVE_UI_SETTINGS_CLASS: Optional[Type[UISettings]] = None


def register_extra_ui_setting(name: str, annotation: Any, field: FieldInfo) -> None:
    """Register an additional UI settings field contributed by an extension package.

    ``field`` must be a ``FieldInfo`` instance — construct it directly
    (e.g. ``FieldInfo(default=..., description=...)``) rather than via
    the ``pydantic.Field`` factory, whose stub reports the default's
    type instead of ``FieldInfo`` and trips mypy at the call site.
    """
    global _EFFECTIVE_UI_SETTINGS_CLASS
    _EXTRA_UI_SETTINGS_FIELDS[name] = (annotation, field)
    ALLOWED_UI_SETTINGS_FIELDS.add(name)
    _EFFECTIVE_UI_SETTINGS_CLASS = None


def _get_effective_ui_settings_class() -> Type[UISettings]:
    """Return UISettings with any extension-registered fields merged in.

    Memoized — pydantic ``create_model`` runs metaclass + schema work
    each call, so we cache until a new registration invalidates it.
    """
    global _EFFECTIVE_UI_SETTINGS_CLASS
    if _EFFECTIVE_UI_SETTINGS_CLASS is not None:
        return _EFFECTIVE_UI_SETTINGS_CLASS
    if not _EXTRA_UI_SETTINGS_FIELDS:
        return UISettings
    _EFFECTIVE_UI_SETTINGS_CLASS = create_model(  # type: ignore[call-overload]
        "EffectiveUISettings",
        __base__=UISettings,
        __doc__=UISettings.__doc__,
        **_EXTRA_UI_SETTINGS_FIELDS,
    )
    return _EFFECTIVE_UI_SETTINGS_CLASS


class MCPSemanticFilterSettings(BaseModel):
    """Configuração para o Filtro Semântico de Ferramentas MCP"""

    enabled: bool = Field(
        default=False,
        description="Habilita filtragem semântica de ferramentas MCP baseada na relevância da consulta",
    )

    embedding_model: str = Field(
        default="text-embedding-3-small",
        description="Modelo de embeddings a ser usado para similaridade semântica (ex: 'text-embedding-3-small', 'text-embedding-ada-002')",
    )

    top_k: int = Field(
        default=10,
        description="Número de ferramentas mais relevantes a retornar",
        ge=1,
        le=100,
    )

    similarity_threshold: float = Field(
        default=0.3,
        description="Pontuação mínima de similaridade para inclusão de ferramenta (0.0 a 1.0, onde 1.0 = correspondência exata)",
        ge=0.0,
        le=1.0,
    )


class MCPSemanticFilterSettingsResponse(SettingsResponse):
    """Response model for MCP semantic filter settings"""

    pass


@router.get(
    "/get/allowed_ips",
    tags=["Controle de Orçamento e Gastos"],
    dependencies=[Depends(user_api_key_auth)],
    include_in_schema=False,
)
async def get_allowed_ips():
    from litellm.proxy.proxy_server import general_settings

    _allowed_ip = general_settings.get("allowed_ips")
    return {"data": _allowed_ip}


@router.post(
    "/add/allowed_ip",
    tags=["Controle de Orçamento e Gastos"],
    dependencies=[Depends(user_api_key_auth)],
)
async def add_allowed_ip(
    ip_address: IPAddress,
    user_api_key_dict: UserAPIKeyAuth = Depends(user_api_key_auth),
):
    from litellm.proxy.proxy_server import (
        create_config_audit_log,
        general_settings,
        prisma_client,
        proxy_config,
        store_model_in_db,
    )

    if prisma_client is None:
        raise Exception("No DB Connected")

    _allowed_ips: List = general_settings.get("allowed_ips", [])
    if ip_address.ip not in _allowed_ips:
        _allowed_ips.append(ip_address.ip)
        general_settings["allowed_ips"] = _allowed_ips
    else:
        raise HTTPException(status_code=400, detail="Endereço IP já existe")

    if store_model_in_db is not True:
        raise HTTPException(
            status_code=500,
            detail={"error": "Set `'STORE_MODEL_IN_DB='True'` in your env to enable this feature."},
        )

    # Load existing config
    config = await proxy_config.get_config()
    verbose_proxy_logger.debug("Loaded config: %s", config)
    if "general_settings" not in config:
        config["general_settings"] = {}

    if "allowed_ips" not in config["general_settings"]:
        config["general_settings"]["allowed_ips"] = []

    before_allowed_ips = list(config["general_settings"]["allowed_ips"])
    if ip_address.ip not in config["general_settings"]["allowed_ips"]:
        config["general_settings"]["allowed_ips"].append(ip_address.ip)

    await proxy_config.save_config(new_config=config)

    asyncio.create_task(
        create_config_audit_log(
            param_name="general_settings",
            action="updated",
            before_value={"allowed_ips": before_allowed_ips},
            after_value={"allowed_ips": config["general_settings"]["allowed_ips"]},
            user_api_key_dict=user_api_key_dict,
        )
    )

    return {
        "message": f"Endereço IP {ip_address.ip} adicionado com sucesso",
        "status": "success",
    }


@router.post(
    "/delete/allowed_ip",
    tags=["Controle de Orçamento e Gastos"],
    dependencies=[Depends(user_api_key_auth)],
)
async def delete_allowed_ip(
    ip_address: IPAddress,
    user_api_key_dict: UserAPIKeyAuth = Depends(user_api_key_auth),
):
    from litellm.proxy.proxy_server import (
        create_config_audit_log,
        general_settings,
        proxy_config,
    )

    _allowed_ips: List = general_settings.get("allowed_ips", [])
    if ip_address.ip in _allowed_ips:
        _allowed_ips.remove(ip_address.ip)
        general_settings["allowed_ips"] = _allowed_ips
    else:
        raise HTTPException(status_code=404, detail="Endereço IP não encontrado")

    # Load existing config
    config = await proxy_config.get_config()
    verbose_proxy_logger.debug("Loaded config: %s", config)
    if "general_settings" not in config:
        config["general_settings"] = {}

    if "allowed_ips" not in config["general_settings"]:
        config["general_settings"]["allowed_ips"] = []

    before_allowed_ips = list(config["general_settings"]["allowed_ips"])
    if ip_address.ip in config["general_settings"]["allowed_ips"]:
        config["general_settings"]["allowed_ips"].remove(ip_address.ip)

    await proxy_config.save_config(new_config=config)

    asyncio.create_task(
        create_config_audit_log(
            param_name="general_settings",
            action="deleted",
            before_value={"allowed_ips": before_allowed_ips},
            after_value={"allowed_ips": config["general_settings"]["allowed_ips"]},
            user_api_key_dict=user_api_key_dict,
        )
    )

    return {"message": f"Endereço IP {ip_address.ip} excluído com sucesso", "status": "success"}


async def _get_settings_with_schema(
    settings_key: str,
    settings_class: Any,
    config: dict,
) -> dict:
    """
    Common utility function to get settings with schema information.

    Args:
        settings_key: The key in litellm_settings to get
        settings_class: The Pydantic class to use for schema
        config: The config dictionary
    """
    from pydantic import TypeAdapter

    litellm_settings = config.get("litellm_settings", {}) or {}
    settings_data = litellm_settings.get(settings_key, {}) or {}

    # Create the settings object
    settings = settings_class(**(settings_data))
    # Get the schema
    schema = TypeAdapter(settings_class).json_schema(by_alias=True)

    # Convert to dict for response
    settings_dict = settings.model_dump()

    # Add descriptions to the response
    result = {
        "values": settings_dict,
        "field_schema": {
            "description": schema.get("description", ""),
            "properties": {},
        },
    }

    # Add property descriptions
    defs = schema.get("$defs", schema.get("definitions", {}))
    for field_name, field_info in schema["properties"].items():
        # For Optional fields, Pydantic v2 uses anyOf with [actual_type, null].
        # Resolve the non-null variant to get the real type and items.
        resolved = field_info
        if "anyOf" in field_info:
            for variant in field_info["anyOf"]:
                if variant.get("type") != "null":
                    resolved = variant
                    break

        prop_entry: dict = {
            "description": field_info.get("description", ""),
            "type": resolved.get("type", "string"),
        }
        # Pass through items info (including enum values) for array fields
        # so the UI can render a multi-select dropdown
        if "items" in resolved:
            items = resolved["items"]
            # Resolve $ref to enum definitions if needed
            if "$ref" in items:
                ref_name = items["$ref"].split("/")[-1]
                ref_def = defs.get(ref_name, {})
                if "enum" in ref_def:
                    prop_entry["items"] = {"enum": ref_def["enum"]}
            else:
                prop_entry["items"] = items
        result["field_schema"]["properties"][field_name] = prop_entry

    # Add nested object descriptions
    for def_name, def_schema in schema.get("definitions", {}).items():
        result["field_schema"][def_name] = {
            "description": def_schema.get("description", ""),
            "properties": {
                prop_name: {"description": prop_info.get("description", "")}
                for prop_name, prop_info in def_schema.get("properties", {}).items()
            },
        }

    return result


@router.get(
    "/get/internal_user_settings",
    tags=["SSO Settings"],
    dependencies=[Depends(user_api_key_auth)],
    response_model=InternalUserSettingsResponse,
)
async def get_internal_user_settings():
    """
    Get all SSO settings from the litellm_settings configuration.
    Returns a structured object with values and descriptions for UI display.
    """
    from litellm.proxy.proxy_server import proxy_config

    # Load existing config
    config = await proxy_config.get_config()

    return await _get_settings_with_schema(
        settings_key="default_internal_user_params",
        settings_class=DefaultInternalUserParams,
        config=config,
    )


@router.get(
    "/get/default_team_settings",
    tags=["SSO Settings"],
    dependencies=[Depends(user_api_key_auth)],
    response_model=DefaultTeamSettingsResponse,
)
async def get_default_team_settings():
    """
    Get all SSO settings from the litellm_settings configuration.
    Returns a structured object with values and descriptions for UI display.
    """
    from litellm.proxy.proxy_server import proxy_config

    # Load existing config
    config = await proxy_config.get_config()

    return await _get_settings_with_schema(
        settings_key="default_team_params",
        settings_class=DefaultTeamSSOParams,
        config=config,
    )


async def update_default_team_member_budget(teams: List[NewUserRequestTeam], user_api_key_dict: UserAPIKeyAuth):
    """
    1. Update the max member budget for the team
    """
    from fastapi import Request

    from litellm.proxy.management_endpoints.team_endpoints import update_team

    for team in teams:
        team_id = team.team_id
        max_budget_in_team = team.max_budget_in_team
        try:
            await update_team(
                data=UpdateTeamRequest(
                    team_id=team_id,
                    team_member_budget=max_budget_in_team,
                ),
                user_api_key_dict=user_api_key_dict,
                http_request=Request(scope={"type": "http"}),
            )
        except Exception as e:
            verbose_proxy_logger.info(
                f"Error updating team {team_id} with team member budget {max_budget_in_team} with error: {e}, skipping.."
            )
            continue


async def _update_litellm_setting(
    settings: Union[DefaultInternalUserParams, DefaultTeamSSOParams, MCPSemanticFilterSettings],
    settings_key: str,
    success_message: str,
    user_api_key_dict: UserAPIKeyAuth,
):
    """
    Common utility function to update `litellm_settings` in both memory and config.

    Args:
        settings: The settings object to update
        settings_key: The key in litellm_settings to update
        success_message: Message to return on success
        user_api_key_dict: The acting admin, recorded as the audit-log actor.
    """
    from litellm.proxy.proxy_server import (
        create_config_audit_log,
        proxy_config,
        store_model_in_db,
    )

    if store_model_in_db is not True:
        raise HTTPException(
            status_code=500,
            detail={"error": "Set `'STORE_MODEL_IN_DB='True'` in your env to enable this feature."},
        )

    in_memory_var = settings.model_dump(exclude_none=True)

    # Load existing config first, then set in-memory value after,
    # because get_config() may overwrite litellm.<key> with stale DB values
    # via LITELLM_SETTINGS_SAFE_DB_OVERRIDES.
    config = await proxy_config.get_config()
    before_value = config.get("litellm_settings", {}).get(settings_key)

    # Update the in-memory settings (after get_config to avoid stale override)
    setattr(litellm, settings_key, in_memory_var)

    # Update config with new settings
    if "litellm_settings" not in config:
        config["litellm_settings"] = {}

    config["litellm_settings"][settings_key] = in_memory_var

    # Save the updated config
    await proxy_config.save_config(new_config=config)

    # Fire-and-forget so an audit-log failure (transient DB blip, etc.)
    # never surfaces as a 500 after save_config has already committed,
    # matching the create_object_audit_log pattern used elsewhere
    # (e.g. model_management_endpoints).
    asyncio.create_task(
        create_config_audit_log(
            param_name=settings_key,
            action="updated",
            before_value=before_value,
            after_value=in_memory_var,
            user_api_key_dict=user_api_key_dict,
        )
    )

    return {
        "message": success_message,
        "status": "success",
        "settings": in_memory_var,
    }


@router.patch(
    "/update/internal_user_settings",
    tags=["Configurações de SSO"],
    dependencies=[Depends(user_api_key_auth)],
)
async def update_internal_user_settings(
    settings: DefaultInternalUserParams,
    user_api_key_dict: UserAPIKeyAuth = Depends(user_api_key_auth),
):
    """
    Atualizar os parâmetros padrão de usuário interno para usuários SSO.
    Essas configurações serão aplicadas a novos usuários que fazem login via SSO.
    """
    if settings.teams is not None and all(isinstance(team, NewUserRequestTeam) for team in settings.teams):
        await update_default_team_member_budget(
            settings.teams,
            user_api_key_dict=user_api_key_dict,  # type: ignore
        )

    return await _update_litellm_setting(
        settings=settings,
        settings_key="default_internal_user_params",
        success_message="Configurações de usuário interno atualizadas com sucesso",
        user_api_key_dict=user_api_key_dict,
    )


@router.patch(
    "/update/default_team_settings",
    tags=["Configurações de SSO"],
    dependencies=[Depends(user_api_key_auth)],
)
async def update_default_team_settings(
    settings: DefaultTeamSSOParams,
    user_api_key_dict: UserAPIKeyAuth = Depends(user_api_key_auth),
):
    """
    Atualizar os parâmetros padrão de equipe para usuários SSO.
    Essas configurações serão aplicadas a novas equipes criadas a partir do SSO.
    """
    return await _update_litellm_setting(
        settings=settings,
        settings_key="default_team_params",
        success_message="Configurações padrão da equipe atualizadas com sucesso",
        user_api_key_dict=user_api_key_dict,
    )


@router.get(
    "/get/sso_settings",
    tags=["SSO Settings"],
    dependencies=[Depends(user_api_key_auth)],
    response_model=SSOSettingsResponse,
)
async def get_sso_settings():
    """
    Obter todas as configurações de SSO da tabela dedicada de SSO.
    Retorna um objeto estruturado com valores e descrições para exibição na interface.
    """

    from litellm.proxy.proxy_server import prisma_client, proxy_config

    if prisma_client is None:
        raise HTTPException(
            status_code=500,
            detail={"error": "Banco de dados não conectado. Por favor, conecte um banco de dados."},
        )

    # Get SSO config from dedicated table
    sso_db_record = await SSOConfigRepository(prisma_client).table.find_unique(where={"id": "sso_config"})

    # Initialize with defaults
    sso_settings_dict = {}

    if sso_db_record and sso_db_record.sso_settings:
        # Load settings from database
        sso_settings_dict = dict(sso_db_record.sso_settings)

    role_mappings_data = sso_settings_dict.pop("role_mappings", None)
    role_mappings = None
    if role_mappings_data:
        from litellm.types.proxy.management_endpoints.ui_sso import RoleMappings

        if isinstance(role_mappings_data, dict):
            role_mappings = RoleMappings(**role_mappings_data)
        elif isinstance(role_mappings_data, RoleMappings):
            role_mappings = role_mappings_data

    team_mappings_data = sso_settings_dict.pop("team_mappings", None)
    team_mappings = None
    if team_mappings_data:
        from litellm.types.proxy.management_endpoints.ui_sso import TeamMappings

        if isinstance(team_mappings_data, dict):
            team_mappings = TeamMappings(**team_mappings_data)
        elif isinstance(team_mappings_data, TeamMappings):
            team_mappings = team_mappings_data

    decrypted_sso_settings_dict = proxy_config._decrypt_and_set_db_env_variables(
        environment_variables=sso_settings_dict
    )

    # Build SSO config with database values or environment fallback

    sso_config = SSOConfig(
        google_client_id=decrypted_sso_settings_dict.get("google_client_id", None),
        google_client_secret=decrypted_sso_settings_dict.get("google_client_secret", None),
        microsoft_client_id=decrypted_sso_settings_dict.get("microsoft_client_id", None),
        microsoft_client_secret=decrypted_sso_settings_dict.get("microsoft_client_secret", None),
        microsoft_tenant=decrypted_sso_settings_dict.get("microsoft_tenant", None),
        generic_client_id=decrypted_sso_settings_dict.get("generic_client_id", None),
        generic_client_secret=decrypted_sso_settings_dict.get("generic_client_secret", None),
        generic_authorization_endpoint=decrypted_sso_settings_dict.get("generic_authorization_endpoint", None),
        generic_token_endpoint=decrypted_sso_settings_dict.get("generic_token_endpoint", None),
        generic_userinfo_endpoint=decrypted_sso_settings_dict.get("generic_userinfo_endpoint", None),
        proxy_base_url=decrypted_sso_settings_dict.get("proxy_base_url", None),
        user_email=decrypted_sso_settings_dict.get("user_email"),
        ui_access_mode=decrypted_sso_settings_dict.get("ui_access_mode"),
        role_mappings=role_mappings,
        team_mappings=team_mappings,
    )

    # Get the schema for UI display
    from pydantic import TypeAdapter

    schema = TypeAdapter(SSOConfig).json_schema(by_alias=True)

    # Convert to dict for response, masking OAuth client secrets so plaintext
    # is never sent to the UI.
    sso_dict = mask_sensitive_keys(sso_config.model_dump(), _SSO_SENSITIVE_FIELDS)

    # Add descriptions to the response
    result = {
        "values": sso_dict,
        "field_schema": {
            "description": schema.get("description", ""),
            "properties": {},
        },
    }

    # Add property descriptions
    for field_name, field_info in schema["properties"].items():
        result["field_schema"]["properties"][field_name] = {
            "description": field_info.get("description", ""),
            "type": field_info.get("type", "string"),
        }

    return result


@router.patch(
    "/update/sso_settings",
    tags=["Configurações de SSO"],
    dependencies=[Depends(user_api_key_auth)],
)
async def update_sso_settings(
    sso_config: SSOConfig,
    user_api_key_dict: UserAPIKeyAuth = Depends(user_api_key_auth),
):
    """
    Atualizar configuração de SSO salvando na tabela dedicada de SSO.
    """
    import json
    import os

    from litellm.proxy.proxy_server import (
        create_config_audit_log,
        prisma_client,
        proxy_config,
        store_model_in_db,
    )

    if prisma_client is None:
        raise HTTPException(
            status_code=500,
            detail={"error": "Database not connected. Please connect a database."},
        )

    if store_model_in_db is not True:
        raise HTTPException(
            status_code=500,
            detail={"error": "Set `'STORE_MODEL_IN_DB='True'` in your env to enable this feature."},
        )

    # Update environment variables
    env_var_mapping = {
        "google_client_id": "GOOGLE_CLIENT_ID",
        "google_client_secret": "GOOGLE_CLIENT_SECRET",
        "microsoft_client_id": "MICROSOFT_CLIENT_ID",
        "microsoft_client_secret": "MICROSOFT_CLIENT_SECRET",
        "microsoft_tenant": "MICROSOFT_TENANT",
        "generic_client_id": "GENERIC_CLIENT_ID",
        "generic_client_secret": "GENERIC_CLIENT_SECRET",
        "generic_authorization_endpoint": "GENERIC_AUTHORIZATION_ENDPOINT",
        "generic_token_endpoint": "GENERIC_TOKEN_ENDPOINT",
        "generic_userinfo_endpoint": "GENERIC_USERINFO_ENDPOINT",
        "proxy_base_url": "PROXY_BASE_URL",
    }

    # Read the existing SSO row first so the audit log captures a real
    # before/after diff. Stored values are encrypted; decrypt them so the
    # before-snapshot has the same shape as after_value, and rely on
    # create_config_audit_log's secret-name redaction to mask the
    # *_client_secret fields before the audit row is written.
    existing_sso_record = await SSOConfigRepository(prisma_client).table.find_unique(where={"id": "sso_config"})
    before_sso_data: Optional[Dict[str, Any]] = None
    if existing_sso_record and existing_sso_record.sso_settings:
        stored = existing_sso_record.sso_settings
        if isinstance(stored, str):
            stored = json.loads(stored)
        if isinstance(stored, dict):
            before_sso_data = proxy_config._decrypt_db_variables(stored)

    # Load existing config
    config = await proxy_config.get_config()

    # Update config with new environment variables
    if "environment_variables" not in config:
        config["environment_variables"] = {}

    # Update general_settings for user_email (admin email)
    if "general_settings" not in config:
        config["general_settings"] = {}

    # Update environment variables in config and in memory
    sso_data = sso_config.model_dump()
    for field_name, value in sso_data.items():
        if field_name in env_var_mapping:
            env_var_name = env_var_mapping[field_name]
            if value:
                os.environ[env_var_name] = value
            else:
                # Clear environment variable if value is null/empty
                os.environ.pop(env_var_name, None)

    encrypted_sso_data = proxy_config._encrypt_env_variables(environment_variables=sso_data)

    # Save to dedicated SSO table
    await SSOConfigRepository(prisma_client).table.upsert(
        where={"id": "sso_config"},
        data={
            "create": {
                "id": "sso_config",
                "sso_settings": json.dumps(encrypted_sso_data),
            },
            "update": {
                "sso_settings": json.dumps(encrypted_sso_data),
            },
        },
    )

    asyncio.create_task(
        create_config_audit_log(
            param_name="sso_config",
            action="updated",
            before_value=before_sso_data,
            after_value=sso_data,
            user_api_key_dict=user_api_key_dict,
            table_name=LitellmTableNames.SSO_CONFIG_TABLE_NAME,
        )
    )

    # Remove SSO-related env vars from config.environment_variables
    try:
        env_var_entry = await ConfigRepository(prisma_client).table.find_unique(
            where={"param_name": "environment_variables"}
        )

        # If no environment_variables entry exists, nothing to clean up
        if env_var_entry is not None:
            if env_var_entry.param_value is not None:
                if isinstance(env_var_entry.param_value, str):
                    environment_variables = json.loads(env_var_entry.param_value)
                else:
                    environment_variables = dict(env_var_entry.param_value)
            else:
                environment_variables = {}

            env_vars_to_remove = set(env_var_mapping.values())
            filtered_env_vars = {
                key: value for key, value in environment_variables.items() if key not in env_vars_to_remove
            }

            await ConfigRepository(prisma_client).table.update(
                where={"param_name": "environment_variables"},
                data={
                    "param_value": json.dumps(filtered_env_vars, default=str),
                },
            )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"error": f"Error updating environment_variables: {str(e)}"},
        )

    return {
        "message": "Configurações de SSO atualizadas com sucesso",
        "status": "success",
        "settings": sso_data,
    }


@router.get(
    "/get/ui_theme_settings",
    tags=["Configurações do Tema da Interface"],
    response_model=UIThemeSettingsResponse,
)
async def get_ui_theme_settings():
    """
    Obter configuração do tema da interface a partir de litellm_settings.
    Retorna configurações atuais do logotipo para personalização da interface.

    Observação: Este endpoint é público (sem autenticação necessária) então todos os usuários podem ver marcas personalizadas.
    Apenas o endpoint /update/ui_theme_settings requer autenticação para administradores modificarem as configurações.
    """
    from litellm.proxy.proxy_server import proxy_config

    # Load existing config
    config = await proxy_config.get_config()

    return await _get_settings_with_schema(
        settings_key="ui_theme_config",
        settings_class=UIThemeConfig,
        config=config,
    )


def _validate_public_image_url(value: Optional[str], field_name: str) -> None:
    """
    Reject anything that isn't a plain http(s) URL with a host. This value is
    later served via the unauthenticated /get_image endpoint, so local paths
    like "/etc/passwd" or "file://..." must not be accepted.
    """
    if value is None:
        return
    if not isinstance(value, str) or not value.strip():
        return
    parsed = urlparse(value.strip())
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        raise HTTPException(
            status_code=400,
            detail={
                "error": (
                    f"Inválido {field_name}: deve ser uma URL http(s) com um host. "
                    "Caminhos do sistema de arquivos locais e esquemas não-http não são permitidos."
                )
            },
        )


@router.patch(
    "/update/ui_theme_settings",
    tags=["Configurações do Tema da Interface"],
    dependencies=[Depends(user_api_key_auth)],
)
async def update_ui_theme_settings(
    theme_config: UIThemeConfig,
    user_api_key_dict: UserAPIKeyAuth = Depends(user_api_key_auth),
):
    """
    Atualizar configuração do tema da interface.
    Atualiza as configurações do logotipo para a interface administrativa.
    """
    import os

    from litellm.proxy.proxy_server import (
        create_config_audit_log,
        proxy_config,
        store_model_in_db,
    )

    _validate_public_image_url(theme_config.logo_url, "logo_url")
    _validate_public_image_url(theme_config.favicon_url, "favicon_url")

    if store_model_in_db is not True:
        raise HTTPException(
            status_code=500,
            detail={"error": "Set `'STORE_MODEL_IN_DB='True'` in your env to enable this feature."},
        )

    # Load existing config
    config = await proxy_config.get_config()
    before_theme = config.get("litellm_settings", {}).get("ui_theme_config")

    # Update config with UI theme settings
    if "general_settings" not in config:
        config["general_settings"] = {}

    if "environment_variables" not in config:
        config["environment_variables"] = {}

    # Convert theme config to dict
    theme_data = theme_config.model_dump(exclude_none=True)

    # Store UI theme config in litellm_settings (where it's retrieved from)
    if "litellm_settings" not in config:
        config["litellm_settings"] = {}
    config["litellm_settings"]["ui_theme_config"] = theme_data

    # Update UI_LOGO_PATH environment variable if logo_url is provided
    # If logo_url is empty string, None, or null, remove the environment variable to use default
    logo_url = theme_data.get("logo_url")
    verbose_proxy_logger.debug(f"Updating logo_url: {logo_url}")

    if (
        logo_url and isinstance(logo_url, str) and logo_url.strip()
    ):  # Check if logo_url exists and is not empty/whitespace
        config["environment_variables"]["UI_LOGO_PATH"] = logo_url
        os.environ["UI_LOGO_PATH"] = logo_url
        verbose_proxy_logger.debug(f"Set UI_LOGO_PATH to: {logo_url}")
    else:
        # Remove the environment variable to restore default logo
        if "UI_LOGO_PATH" in config.get("environment_variables", {}):
            del config["environment_variables"]["UI_LOGO_PATH"]
            verbose_proxy_logger.debug("Removed UI_LOGO_PATH from config")
        if "UI_LOGO_PATH" in os.environ:
            del os.environ["UI_LOGO_PATH"]
            verbose_proxy_logger.debug("Removed UI_LOGO_PATH from environment")

    # Update LITELLM_FAVICON_URL environment variable if favicon_url is provided
    favicon_url = theme_data.get("favicon_url")
    verbose_proxy_logger.debug(f"Updating favicon_url: {favicon_url}")

    if (
        favicon_url and isinstance(favicon_url, str) and favicon_url.strip()
    ):  # Check if favicon_url exists and is not empty/whitespace
        config["environment_variables"]["LITELLM_FAVICON_URL"] = favicon_url
        os.environ["LITELLM_FAVICON_URL"] = favicon_url
        verbose_proxy_logger.debug(f"Set LITELLM_FAVICON_URL to: {favicon_url}")
    else:
        # Remove the environment variable to restore default favicon
        if "LITELLM_FAVICON_URL" in config.get("environment_variables", {}):
            del config["environment_variables"]["LITELLM_FAVICON_URL"]
            verbose_proxy_logger.debug("Removed LITELLM_FAVICON_URL from config")
        if "LITELLM_FAVICON_URL" in os.environ:
            del os.environ["LITELLM_FAVICON_URL"]
            verbose_proxy_logger.debug("Removed LITELLM_FAVICON_URL from environment")

    # Handle environment variable encryption if needed
    stored_config = config.copy()
    if "environment_variables" in stored_config and len(stored_config["environment_variables"]) > 0:
        # Only encrypt if there are environment variables to encrypt
        stored_config["environment_variables"] = proxy_config._encrypt_env_variables(
            environment_variables=stored_config["environment_variables"]
        )

    # Save the updated config
    await proxy_config.save_config(new_config=stored_config)

    asyncio.create_task(
        create_config_audit_log(
            param_name="ui_theme_config",
            action="updated",
            before_value=before_theme,
            after_value=theme_data,
            user_api_key_dict=user_api_key_dict,
        )
    )

    return {
        "message": "Configurações do tema da interface atualizadas com sucesso.",
        "status": "success",
        "theme_config": theme_data,
    }


@router.get(
    "/get/mcp_semantic_filter_settings",
    tags=["Configurações"],
    dependencies=[Depends(user_api_key_auth)],
    response_model=MCPSemanticFilterSettingsResponse,
)
async def get_mcp_semantic_filter_settings(
    user_api_key_dict: UserAPIKeyAuth = Depends(user_api_key_auth),
):
    """
    Obter configuração do filtro semântico MCP.
    Retorna configurações atuais para filtragem de ferramentas semânticas.
    """
    from litellm.proxy.proxy_server import prisma_client, proxy_config

    if prisma_client is None:
        raise HTTPException(
            status_code=500,
            detail={"error": "Database not connected. Please connect a database."},
        )

    config = await proxy_config.get_config()

    return await _get_settings_with_schema(
        settings_key="mcp_semantic_tool_filter",
        settings_class=MCPSemanticFilterSettings,
        config=config,
    )


@router.patch(
    "/update/mcp_semantic_filter_settings",
    tags=["Configurações"],
    dependencies=[Depends(user_api_key_auth)],
)
async def update_mcp_semantic_filter_settings(
    settings: MCPSemanticFilterSettings,
    user_api_key_dict: UserAPIKeyAuth = Depends(user_api_key_auth),
):
    """
    Atualizar configurações do filtro semântico MCP no banco de dados.
    As configurações serão aplicadas por todos os pods dentro de aproximadamente 10 segundos via sondagem em segundo plano.
    """
    if user_api_key_dict.user_role != LitellmUserRoles.PROXY_ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Only proxy admins can update MCP semantic filter settings.",
        )

    result = await _update_litellm_setting(
        settings=settings,
        settings_key="mcp_semantic_tool_filter",
        success_message="Configurações do Filtro Semântico MCP atualizadas com sucesso. As mudanças serão aplicadas em todos os pods dentro de 10 segundos.",
        user_api_key_dict=user_api_key_dict,
    )
    try:
        from litellm.proxy.proxy_server import prisma_client, proxy_config

        if prisma_client is not None:
            await proxy_config._init_semantic_filter_settings_in_db(prisma_client=prisma_client)
    except Exception as e:
        verbose_proxy_logger.warning(f"Failed to reinitialize MCP semantic filter settings immediately: {e}")

    return result


UI_SETTINGS_CACHE_KEY = "ui_settings:settings_dict"
UI_SETTINGS_CACHE_TTL = 600  # 10 minutes


async def get_ui_settings_cached() -> Dict[str, Any]:
    """
    Retorna o dicionário de configurações da interface persistido, usando DualCache para leituras.

    Cache hit  → retorna dicionário em cache imediatamente.
    Cache miss → lê do BD, popula cache, retorna dicionário.
    """
    from litellm.proxy.proxy_server import prisma_client, user_api_key_cache

    # 1. Try cache
    cached = await user_api_key_cache.async_get_cache(key=UI_SETTINGS_CACHE_KEY)
    if cached is not None and isinstance(cached, dict):
        return cached

    # 2. Fallback to DB
    if prisma_client is None:
        return {}

    db_record = await UISettingsRepository(prisma_client).table.find_unique(where={"id": "ui_settings"})
    ui_settings: Dict[str, Any] = {}
    if db_record and db_record.ui_settings:
        raw = db_record.ui_settings
        ui_settings = json.loads(raw) if isinstance(raw, str) else dict(raw)

    # Sanitize
    ui_settings = {k: v for k, v in ui_settings.items() if k in ALLOWED_UI_SETTINGS_FIELDS}

    # 3. Populate cache with TTL
    await user_api_key_cache.async_set_cache(key=UI_SETTINGS_CACHE_KEY, value=ui_settings, ttl=UI_SETTINGS_CACHE_TTL)

    return ui_settings


@router.get(
    "/get/ui_settings",
    tags=["UI Settings"],
    response_model=UISettingsResponse,
)
async def get_ui_settings():
    """
    Obter bandeiras de configuração específicas da interface.
    Todos os usuários autenticados podem buscar essas configurações para comportamento do lado do cliente.
    """
    from litellm.proxy.proxy_server import prisma_client

    if prisma_client is None:
        raise HTTPException(
            status_code=500,
            detail={"error": "Database not connected. Please connect a database."},
        )

    ui_settings: Dict[str, Any] = {}

    db_record = await UISettingsRepository(prisma_client).table.find_unique(where={"id": "ui_settings"})

    if db_record and db_record.ui_settings:
        ui_settings_json = db_record.ui_settings
        if isinstance(ui_settings_json, str):
            ui_settings = json.loads(ui_settings_json)
        else:
            ui_settings = dict(ui_settings_json)

    # Sanitize any unexpected keys from persisted config before returning
    ui_settings = {k: v for k, v in ui_settings.items() if k in ALLOWED_UI_SETTINGS_FIELDS}

    # Sync runtime flags into general_settings so the proxy picks them up
    # at runtime (covers server restart scenarios).
    _flags_to_sync = {k: ui_settings[k] for k in _RUNTIME_GENERAL_SETTINGS_FLAGS if k in ui_settings}
    if _flags_to_sync:
        from litellm.proxy.proxy_server import general_settings

        general_settings.update(_flags_to_sync)

    # Refresh DualCache so other code paths (e.g. /user/filter/ui) see fresh values
    from litellm.proxy.proxy_server import user_api_key_cache

    await user_api_key_cache.async_set_cache(key=UI_SETTINGS_CACHE_KEY, value=ui_settings, ttl=UI_SETTINGS_CACHE_TTL)

    # Build config-like object for schema helper
    config: Dict[str, Any] = {"litellm_settings": {"ui_settings": ui_settings}}

    return await _get_settings_with_schema(
        settings_key="ui_settings",
        settings_class=_get_effective_ui_settings_class(),
        config=config,
    )


@router.patch(
    "/update/ui_settings",
    tags=["UI Settings"],
    dependencies=[Depends(user_api_key_auth)],
)
async def update_ui_settings(
    settings_body: Dict[str, Any] = Body(...),
    user_api_key_dict: UserAPIKeyAuth = Depends(user_api_key_auth),
):
    """
    Atualizar bandeiras de configuração específicas da interface.
    Apenas administradores do proxy têm permissão para modificar estas configurações.
    """
    from litellm.proxy.proxy_server import (
        create_config_audit_log,
        prisma_client,
        store_model_in_db,
    )

    if user_api_key_dict.user_role != LitellmUserRoles.PROXY_ADMIN:
        raise HTTPException(status_code=403, detail="Only proxy admins can update UI settings.")

    if prisma_client is None:
        raise HTTPException(
            status_code=500,
            detail={"error": "Database not connected. Please connect a database."},
        )

    if store_model_in_db is not True:
        raise HTTPException(
            status_code=500,
            detail={"error": "Set `'STORE_MODEL_IN_DB='True'` in your env to enable this feature."},
        )

    # Validate against the same effective class GET advertises, so
    # enterprise-registered fields are typed consistently on both sides.
    effective_cls = _get_effective_ui_settings_class()
    try:
        settings = effective_cls.model_validate(settings_body)
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=e.errors())

    # Only include fields the caller actually sent (not Pydantic defaults).
    settings_dict = settings.model_dump(exclude_unset=True)

    # Reject enterprise-only settings up front so the caller gets a clear
    # signal instead of a silent drop.
    blocked_enterprise_keys = sorted((settings_dict.keys() & _ENTERPRISE_ONLY_UI_SETTINGS) - ALLOWED_UI_SETTINGS_FIELDS)
    if blocked_enterprise_keys:
        raise HTTPException(
            status_code=403,
            detail={
                "error": (
                    f"Setting(s) {blocked_enterprise_keys} are a LiteLLM "
                    "Enterprise feature and are not available on this build."
                )
            },
        )

    # Enforce allowlist and drop anything unexpected
    incoming = {k: v for k, v in settings_dict.items() if k in ALLOWED_UI_SETTINGS_FIELDS}

    # Merge with existing persisted settings so a partial PATCH doesn't
    # overwrite fields the caller didn't send.
    existing: dict = {}
    db_existing = await UISettingsRepository(prisma_client).table.find_unique(where={"id": "ui_settings"})
    if db_existing and db_existing.ui_settings:
        raw = db_existing.ui_settings
        existing = json.loads(raw) if isinstance(raw, str) else dict(raw)

    ui_settings = {**existing, **incoming}

    await UISettingsRepository(prisma_client).table.upsert(
        where={"id": "ui_settings"},
        data={
            "create": {
                "id": "ui_settings",
                "ui_settings": json.dumps(ui_settings),
            },
            "update": {
                "ui_settings": json.dumps(ui_settings),
            },
        },
    )

    # Sync runtime flags to general_settings so the proxy picks them up
    # at runtime (general_settings is checked in pre-call utils).
    _flags_to_sync = {k: ui_settings[k] for k in _RUNTIME_GENERAL_SETTINGS_FLAGS if k in ui_settings}
    if _flags_to_sync:
        from litellm.proxy.proxy_server import general_settings

        general_settings.update(_flags_to_sync)

    # Invalidate + set DualCache so subsequent reads see the new values immediately
    from litellm.proxy.proxy_server import user_api_key_cache

    sanitized = {k: v for k, v in ui_settings.items() if k in ALLOWED_UI_SETTINGS_FIELDS}
    await user_api_key_cache.async_set_cache(key=UI_SETTINGS_CACHE_KEY, value=sanitized, ttl=UI_SETTINGS_CACHE_TTL)

    asyncio.create_task(
        create_config_audit_log(
            param_name="ui_settings",
            action="updated",
            before_value=existing,
            after_value=ui_settings,
            user_api_key_dict=user_api_key_dict,
            table_name=LitellmTableNames.UI_SETTINGS_TABLE_NAME,
        )
    )

    return {
        "message": "Configurações da interface atualizadas com sucesso",
        "status": "success",
        "settings": ui_settings,
    }


@router.post(
    "/upload/logo",
    tags=["Configurações do Tema da Interface"],
    dependencies=[Depends(user_api_key_auth)],
)
async def upload_logo(file: UploadFile = File(...)):
    """
    Carregar um logotipo personalizado para a interface administrativa.
    Aceita arquivos de imagem (PNG, JPG, JPEG, SVG) e os armazena para uso na interface.
    """
    import os
    from pathlib import Path

    # Validate file type
    allowed_extensions = {".png", ".jpg", ".jpeg", ".svg"}
    file_extension = Path(file.filename or "").suffix.lower()

    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo de arquivo inválido. Tipos permitidos: {', '.join(allowed_extensions)}",
        )

    # Validate file size (max 5MB)
    file_content = await file.read()
    if len(file_content) > 5 * 1024 * 1024:  # 5MB
        raise HTTPException(status_code=400, detail="Tamanho do arquivo muito grande. O tamanho máximo é 5MB.")

    # Create uploads directory if it doesn't exist
    current_dir = os.path.dirname(os.path.abspath(__file__))
    upload_dir = os.path.join(current_dir, "..", "uploads")
    os.makedirs(upload_dir, exist_ok=True)

    # Generate unique filename
    from litellm._uuid import uuid

    unique_filename = f"logo_{uuid.uuid4().hex}{file_extension}"
    file_path = os.path.join(upload_dir, unique_filename)

    # Save the file
    with open(file_path, "wb") as buffer:
        buffer.write(file_content)

    return {
        "message": "Logotipo carregado com sucesso",
        "status": "success",
        "file_path": file_path,
        "filename": unique_filename,
        "file_size": len(file_content),
    }
