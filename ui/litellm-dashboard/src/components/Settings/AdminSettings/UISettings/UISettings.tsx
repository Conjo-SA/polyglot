"use client";

import { useUISettings } from "@/app/(dashboard)/hooks/uiSettings/useUISettings";
import { useUpdateUISettings } from "@/app/(dashboard)/hooks/uiSettings/useUpdateUISettings";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import NotificationManager from "@/components/molecules/notifications_manager";
import PageVisibilitySettings from "./PageVisibilitySettings";
import { Alert, Card, Divider, Skeleton, Space, Switch, Typography } from "antd";

export default function UISettings() {
  const { accessToken } = useAuthorized();
  const { data, isLoading, isError, error } = useUISettings();
  const { mutate: updateSettings, isPending: isUpdating, error: updateError } = useUpdateUISettings(accessToken);

  const schema = data?.field_schema;
  const property = schema?.properties?.disable_model_add_for_internal_users;
  const disableTeamAdminDeleteProperty = schema?.properties?.disable_team_admin_delete_team_user;
  const requireAuthForPublicAIHubProperty = schema?.properties?.require_auth_for_public_ai_hub;
  const forwardClientHeadersProperty = schema?.properties?.forward_client_headers_to_llm_api;
  const forwardLLMProviderAuthHeadersProperty = schema?.properties?.forward_llm_provider_auth_headers;
  const enableProjectsUIProperty = schema?.properties?.enable_projects_ui;
  const enableChatUIProperty = schema?.properties?.enable_chat_ui;
  const enabledPagesProperty = schema?.properties?.enabled_ui_pages_internal_users;
  const disableAgentsProperty = schema?.properties?.disable_agents_for_internal_users;
  const allowAgentsTeamAdminsProperty = schema?.properties?.allow_agents_for_team_admins;
  const disableVectorStoresProperty = schema?.properties?.disable_vector_stores_for_internal_users;
  const allowVectorStoresTeamAdminsProperty = schema?.properties?.allow_vector_stores_for_team_admins;
  const scopeUserSearchProperty = schema?.properties?.scope_user_search_to_org;
  const disableCustomApiKeysProperty = schema?.properties?.disable_custom_api_keys;
  const values = data?.values ?? {};
  const isDisabledForInternalUsers = Boolean(values.disable_model_add_for_internal_users);
  const isDisabledTeamAdminDeleteTeamUser = Boolean(values.disable_team_admin_delete_team_user);
  const isAgentsDisabled = Boolean(values.disable_agents_for_internal_users);
  const isVectorStoresDisabled = Boolean(values.disable_vector_stores_for_internal_users);

  const handleToggle = (checked: boolean) => {
    updateSettings(
      { disable_model_add_for_internal_users: checked },
      {
        onSuccess: () => {
          NotificationManager.success("Configurações da interface atualizadas com sucesso");
        },
        onError: (error) => {
          NotificationManager.fromBackend(error);
        },
      },
    );
  };

  const handleToggleTeamAdminDelete = (checked: boolean) => {
    updateSettings(
      { disable_team_admin_delete_team_user: checked },
      {
        onSuccess: () => {
          NotificationManager.success("Configurações da interface atualizadas com sucesso");
        },
        onError: (error) => {
          NotificationManager.fromBackend(error);
        },
      },
    );
  };

  const handleUpdatePageVisibility = (settings: { enabled_ui_pages_internal_users: string[] | null }) => {
    updateSettings(settings, {
      onSuccess: () => {
        NotificationManager.success("Configurações de visibilidade de página atualizadas com sucesso");
      },
      onError: (error) => {
        NotificationManager.fromBackend(error);
      },
    });
  };

  const handleToggleForwardClientHeaders = (checked: boolean) => {
    updateSettings(
      { forward_client_headers_to_llm_api: checked },
      {
        onSuccess: () => {
          NotificationManager.success("Configurações da interface atualizadas com sucesso");
        },
        onError: (error) => {
          NotificationManager.fromBackend(error);
        },
      },
    );
  };

  const handleToggleForwardLLMProviderAuthHeaders = (checked: boolean) => {
    updateSettings(
      { forward_llm_provider_auth_headers: checked },
      {
        onSuccess: () => {
          NotificationManager.success("Configurações da interface atualizadas com sucesso");
        },
        onError: (error) => {
          NotificationManager.fromBackend(error);
        },
      },
    );
  };

  const handleToggleEnableProjectsUI = (checked: boolean) => {
    updateSettings(
      { enable_projects_ui: checked },
      {
        onSuccess: () => {
          NotificationManager.success("Configurações da interface atualizadas com sucesso. Atualizando página...");
          setTimeout(() => window.location.reload(), 1000);
        },
        onError: (error) => {
          NotificationManager.fromBackend(error);
        },
      },
    );
  };

  const handleToggleEnableChatUI = (checked: boolean) => {
    updateSettings(
      { enable_chat_ui: checked },
      {
        onSuccess: () => {
          NotificationManager.success("Configurações da interface atualizadas com sucesso. Atualizando página...");
          setTimeout(() => window.location.reload(), 1000);
        },
        onError: (error) => {
          NotificationManager.fromBackend(error);
        },
      },
    );
  };

  const handleToggleRequireAuthForPublicAIHub = (checked: boolean) => {
    updateSettings(
      { require_auth_for_public_ai_hub: checked },
      {
        onSuccess: () => {
          NotificationManager.success("Configurações da interface atualizadas com sucesso");
        },
        onError: (error) => {
          NotificationManager.fromBackend(error);
        },
      },
    );
  };

  const handleToggleDisableAgents = (checked: boolean) => {
    updateSettings(
      { disable_agents_for_internal_users: checked },
      {
        onSuccess: () => {
          NotificationManager.success("Configurações da interface atualizadas com sucesso");
        },
        onError: (error) => {
          NotificationManager.fromBackend(error);
        },
      },
    );
  };

  const handleToggleAllowAgentsTeamAdmins = (checked: boolean) => {
    updateSettings(
      { allow_agents_for_team_admins: checked },
      {
        onSuccess: () => {
          NotificationManager.success("Configurações da interface atualizadas com sucesso");
        },
        onError: (error) => {
          NotificationManager.fromBackend(error);
        },
      },
    );
  };

  const handleToggleDisableVectorStores = (checked: boolean) => {
    updateSettings(
      { disable_vector_stores_for_internal_users: checked },
      {
        onSuccess: () => {
          NotificationManager.success("Configurações da interface atualizadas com sucesso");
        },
        onError: (error) => {
          NotificationManager.fromBackend(error);
        },
      },
    );
  };

  const handleToggleAllowVectorStoresTeamAdmins = (checked: boolean) => {
    updateSettings(
      { allow_vector_stores_for_team_admins: checked },
      {
        onSuccess: () => {
          NotificationManager.success("Configurações da interface atualizadas com sucesso");
        },
        onError: (error) => {
          NotificationManager.fromBackend(error);
        },
      },
    );
  };

  const handleToggleScopeUserSearch = (checked: boolean) => {
    updateSettings(
      { scope_user_search_to_org: checked },
      {
        onSuccess: () => {
          NotificationManager.success("Configurações da interface atualizadas com sucesso");
        },
        onError: (error) => {
          NotificationManager.fromBackend(error);
        },
      },
    );
  };

  const handleToggleDisableCustomApiKeys = (checked: boolean) => {
    updateSettings(
      { disable_custom_api_keys: checked },
      {
        onSuccess: () => {
          NotificationManager.success("Configurações da interface atualizadas com sucesso");
        },
        onError: (error) => {
          NotificationManager.fromBackend(error);
        },
      },
    );
  };

  return (
    <Card title="Configurações da Interface">
      {isLoading ? (
        <Skeleton active />
      ) : isError ? (
        <Alert
          type="error"
          message="Não foi possível carregar as configurações da interface"
          description={error instanceof Error ? error.message : undefined}
        />
      ) : (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {schema?.description && (
            <Typography.Paragraph style={{ marginBottom: 0 }}>{schema.description}</Typography.Paragraph>
          )}

          {updateError && (
            <Alert
              type="error"
              message="Não foi possível atualizar as configurações da interface"
              description={updateError instanceof Error ? updateError.message : undefined}
            />
          )}

          <Space align="start" size="middle">
            <Switch
              checked={isDisabledForInternalUsers}
              disabled={isUpdating}
              loading={isUpdating}
              onChange={handleToggle}
              aria-label={property?.description ?? "Disable model add for internal users"}
            />
            <Space direction="vertical" size={4}>
              <Typography.Text strong>Desativar adição de modelos para usuários internos</Typography.Text>
              {property?.description && <Typography.Text type="secondary">{property.description}</Typography.Text>}
            </Space>
          </Space>

          <Space align="start" size="middle">
            <Switch
              checked={isDisabledTeamAdminDeleteTeamUser}
              disabled={isUpdating}
              loading={isUpdating}
              onChange={handleToggleTeamAdminDelete}
              aria-label={disableTeamAdminDeleteProperty?.description ?? "Disable team admin delete team user"}
            />
            <Space direction="vertical" size={4}>
              <Typography.Text strong>Desativar exclusão de usuários por administradores de equipe</Typography.Text>
              {disableTeamAdminDeleteProperty?.description && (
                <Typography.Text type="secondary">{disableTeamAdminDeleteProperty.description}</Typography.Text>
              )}
            </Space>
          </Space>

          <Space align="start" size="middle">
            <Switch
              checked={values.require_auth_for_public_ai_hub}
              disabled={isUpdating}
              loading={isUpdating}
              onChange={handleToggleRequireAuthForPublicAIHub}
              aria-label={requireAuthForPublicAIHubProperty?.description ?? "Require authentication for public AI Hub"}
            />
            <Space direction="vertical" size={4}>
              <Typography.Text strong>Exigir autenticação para o Hub de IA público</Typography.Text>
              {requireAuthForPublicAIHubProperty?.description && (
                <Typography.Text type="secondary">{requireAuthForPublicAIHubProperty.description}</Typography.Text>
              )}
            </Space>
          </Space>

          <Space align="start" size="middle">
            <Switch
              checked={Boolean(values.forward_client_headers_to_llm_api)}
              disabled={isUpdating}
              loading={isUpdating}
              onChange={handleToggleForwardClientHeaders}
              aria-label={forwardClientHeadersProperty?.description ?? "Forward client headers to LLM API"}
            />
            <Space direction="vertical" size={4}>
              <Typography.Text strong>Forward client headers to LLM API</Typography.Text>
              <Typography.Text type="secondary">
                {forwardClientHeadersProperty?.description ??
                  "Encaminha cabeçalhos do cliente (Authorization, anthropic-beta e cabeçalhos personalizados x-*) para o LLM upstream. Ative para Claude Code com assinatura Max (encaminha o token OAuth) ou para passar cabeçalhos personalizados/rastreamento ao provedor. Independente do interruptor BYOK — ative apenas o(s) necessário(s)."}
              </Typography.Text>
            </Space>
          </Space>

          <Space align="start" size="middle">
            <Switch
              checked={Boolean(values.forward_llm_provider_auth_headers)}
              disabled={isUpdating}
              loading={isUpdating}
              onChange={handleToggleForwardLLMProviderAuthHeaders}
              aria-label={forwardLLMProviderAuthHeadersProperty?.description ?? "Forward LLM provider auth headers"}
            />
            <Space direction="vertical" size={4}>
              <Typography.Text strong>Forward LLM provider auth headers</Typography.Text>
              <Typography.Text type="secondary">
                {forwardLLMProviderAuthHeadersProperty?.description ??
                  "Encaminha cabeçalhos de autenticação do provedor (x-api-key, x-goog-api-key, api-key, ocp-apim-subscription-key) para o LLM upstream, substituindo qualquer chave configurada para aquela solicitação. Ative para Claude Code BYOK (clientes trazem sua própria chave API). Independente do interruptor de cabeçalhos do cliente — ative apenas o(s) necessário(s)."}
              </Typography.Text>
            </Space>
          </Space>

          {enableProjectsUIProperty && (
            <Space align="start" size="middle">
              <Switch
                checked={Boolean(values.enable_projects_ui)}
                disabled={isUpdating}
                loading={isUpdating}
                onChange={handleToggleEnableProjectsUI}
                aria-label={enableProjectsUIProperty.description ?? "Enable Projects UI"}
              />
              <Space direction="vertical" size={4}>
                <Typography.Text strong>[BETA] Ativar Projetos (a página será atualizada)</Typography.Text>
                <Typography.Text type="secondary">
                  {enableProjectsUIProperty.description ??
                    "Se ativado, mostra o recurso Projetos na barra lateral da interface e o campo projeto na gestão de chaves."}
                </Typography.Text>
              </Space>
            </Space>
          )}

          <Space align="start" size="middle">
            <Switch
              checked={Boolean(values.enable_chat_ui)}
              disabled={isUpdating}
              loading={isUpdating}
              onChange={handleToggleEnableChatUI}
              aria-label={enableChatUIProperty?.description ?? "Enable Chat page"}
            />
            <Space direction="vertical" size={4}>
              <Typography.Text strong>[BETA] Ativar página de Chat (a página será atualizada)</Typography.Text>
              <Typography.Text type="secondary">
                {enableChatUIProperty?.description ??
                  "Se ativado, mostra a página de Chat na barra lateral da interface, permitindo que os usuários conversem com um LLM e conectem suas próprias credenciais de servidor MCP via OAuth."}
              </Typography.Text>
            </Space>
          </Space>

          <Divider />

          {/* Agents access control */}
          <Space align="start" size="middle">
            <Switch
              checked={isAgentsDisabled}
              disabled={isUpdating}
              loading={isUpdating}
              onChange={handleToggleDisableAgents}
              aria-label={disableAgentsProperty?.description ?? "Disable agents for internal users"}
            />
            <Space direction="vertical" size={4}>
              <Typography.Text strong>Desativar agentes para usuários internos</Typography.Text>
              {disableAgentsProperty?.description && (
                <Typography.Text type="secondary">{disableAgentsProperty.description}</Typography.Text>
              )}
            </Space>
          </Space>

          <Space align="start" size="middle" style={{ marginLeft: 32 }}>
            <Switch
              checked={Boolean(values.allow_agents_for_team_admins)}
              disabled={isUpdating || !isAgentsDisabled}
              loading={isUpdating}
              onChange={handleToggleAllowAgentsTeamAdmins}
              aria-label={allowAgentsTeamAdminsProperty?.description ?? "Allow agents for team admins"}
            />
            <Space direction="vertical" size={4}>
              <Typography.Text strong type={!isAgentsDisabled ? "secondary" : undefined}>
                Allow agents for team admins
              </Typography.Text>
              {allowAgentsTeamAdminsProperty?.description && (
                <Typography.Text type="secondary">{allowAgentsTeamAdminsProperty.description}</Typography.Text>
              )}
            </Space>
          </Space>

          <Divider />

          {/* Vector Stores access control */}
          <Space align="start" size="middle">
            <Switch
              checked={isVectorStoresDisabled}
              disabled={isUpdating}
              loading={isUpdating}
              onChange={handleToggleDisableVectorStores}
              aria-label={disableVectorStoresProperty?.description ?? "Disable vector stores for internal users"}
            />
            <Space direction="vertical" size={4}>
              <Typography.Text strong>Desativar armazenamento vetorial para usuários internos</Typography.Text>
              {disableVectorStoresProperty?.description && (
                <Typography.Text type="secondary">{disableVectorStoresProperty.description}</Typography.Text>
              )}
            </Space>
          </Space>

          <Space align="start" size="middle" style={{ marginLeft: 32 }}>
            <Switch
              checked={Boolean(values.allow_vector_stores_for_team_admins)}
              disabled={isUpdating || !isVectorStoresDisabled}
              loading={isUpdating}
              onChange={handleToggleAllowVectorStoresTeamAdmins}
              aria-label={allowVectorStoresTeamAdminsProperty?.description ?? "Allow vector stores for team admins"}
            />
            <Space direction="vertical" size={4}>
              <Typography.Text strong type={!isVectorStoresDisabled ? "secondary" : undefined}>
                Allow vector stores for team admins
              </Typography.Text>
              {allowVectorStoresTeamAdminsProperty?.description && (
                <Typography.Text type="secondary">{allowVectorStoresTeamAdminsProperty.description}</Typography.Text>
              )}
            </Space>
          </Space>

          <Divider />

          {/* Scope user search to organization */}
          <Space align="start" size="middle">
            <Switch
              checked={Boolean(values.scope_user_search_to_org)}
              disabled={isUpdating}
              loading={isUpdating}
              onChange={handleToggleScopeUserSearch}
              aria-label={scopeUserSearchProperty?.description ?? "Scope user search to organization"}
            />
            <Space direction="vertical" size={4}>
              <Typography.Text strong>Scope user search to organization</Typography.Text>
              <Typography.Text type="secondary">
                {scopeUserSearchProperty?.description ??
                  "Se ativado, o endpoint de busca de usuários restringe resultados por organização. Quando desativado, qualquer usuário autenticado pode buscar todos os usuários."}
              </Typography.Text>
            </Space>
          </Space>

          <Divider />

          {/* Disable custom Virtual key values */}
          <Space align="start" size="middle">
            <Switch
              checked={Boolean(values.disable_custom_api_keys)}
              disabled={isUpdating}
              loading={isUpdating}
              onChange={handleToggleDisableCustomApiKeys}
              aria-label={disableCustomApiKeysProperty?.description ?? "Disable custom Virtual key values"}
            />
            <Space direction="vertical" size={4}>
              <Typography.Text strong>Disable custom Virtual key values</Typography.Text>
              <Typography.Text type="secondary">
                {disableCustomApiKeysProperty?.description ??
                  "Se verdadeiro, os usuários não podem especificar valores de chave personalizados. Todas as chaves devem ser geradas automaticamente."}
              </Typography.Text>
            </Space>
          </Space>

          <Divider />

          {/* Visibilidade de Páginas para Usuários Internos */}
          <PageVisibilitySettings
            enabledPagesInternalUsers={values.enabled_ui_pages_internal_users}
            enabledPagesPropertyDescription={enabledPagesProperty?.description}
            isUpdating={isUpdating}
            onUpdate={handleUpdatePageVisibility}
          />
        </Space>
      )}
    </Card>
  );
}
