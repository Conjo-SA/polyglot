"use client";

import { TextInput } from "@tremor/react";
import { Checkbox, Form, Input, Select } from "antd";
import React from "react";
import { ssoProviderLogoMap, ssoProviderDisplayNames } from "../constants";

export interface BaseSSOSettingsFormProps {
  form: any; // Replace with proper Form type if available
  onFormSubmit: (formValues: Record<string, any>) => Promise<void>;
}

// Define the SSO provider configuration type
export interface SSOProviderConfig {
  envVarMap: Record<string, string>;
  fields: Array<{
    label: string;
    name: string;
    placeholder?: string;
  }>;
}

// Define configurations for each SSO provider
export const ssoProviderConfigs: Record<string, SSOProviderConfig> = {
  google: {
    envVarMap: {
      google_client_id: "GOOGLE_CLIENT_ID",
      google_client_secret: "GOOGLE_CLIENT_SECRET",
    },
    fields: [
      { label: "ID do Cliente do Google", name: "google_client_id" },
      { label: "Segredo do Cliente do Google", name: "google_client_secret" },
    ],
  },
  microsoft: {
    envVarMap: {
      microsoft_client_id: "MICROSOFT_CLIENT_ID",
      microsoft_client_secret: "MICROSOFT_CLIENT_SECRET",
      microsoft_tenant: "MICROSOFT_TENANT",
    },
    fields: [
      { label: "ID do Cliente do Microsoft", name: "microsoft_client_id" },
      { label: "Segredo do Cliente do Microsoft", name: "microsoft_client_secret" },
      { label: "Locatário do Microsoft", name: "microsoft_tenant" },
    ],
  },
  okta: {
    envVarMap: {
      generic_client_id: "GENERIC_CLIENT_ID",
      generic_client_secret: "GENERIC_CLIENT_SECRET",
      generic_authorization_endpoint: "GENERIC_AUTHORIZATION_ENDPOINT",
      generic_token_endpoint: "GENERIC_TOKEN_ENDPOINT",
      generic_userinfo_endpoint: "GENERIC_USERINFO_ENDPOINT",
    },
    fields: [
      { label: "ID do Cliente Genérico", name: "generic_client_id" },
      { label: "Segredo do Cliente Genérico", name: "generic_client_secret" },
      {
        label: "Endpoint de Autorização",
        name: "generic_authorization_endpoint",
        placeholder: "https://seu-domínio/authorize",
      },
      { label: "Endpoint de Token", name: "generic_token_endpoint", placeholder: "https://seu-domínio/token" },
      {
        label: "Endpoint de Informações do Usuário",
        name: "generic_userinfo_endpoint",
        placeholder: "https://seu-domínio/userinfo",
      },
    ],
  },
  generic: {
    envVarMap: {
      generic_client_id: "GENERIC_CLIENT_ID",
      generic_client_secret: "GENERIC_CLIENT_SECRET",
      generic_authorization_endpoint: "GENERIC_AUTHORIZATION_ENDPOINT",
      generic_token_endpoint: "GENERIC_TOKEN_ENDPOINT",
      generic_userinfo_endpoint: "GENERIC_USERINFO_ENDPOINT",
    },
    fields: [
      { label: "ID do Cliente Genérico", name: "generic_client_id" },
      { label: "Segredo do Cliente Genérico", name: "generic_client_secret" },
      { label: "Endpoint de Autorização", name: "generic_authorization_endpoint" },
      { label: "Endpoint de Token", name: "generic_token_endpoint" },
      { label: "Endpoint de Informações do Usuário", name: "generic_userinfo_endpoint" },
    ],
  },
};

// Helper function to render provider fields
export const renderProviderFields = (provider: string) => {
  const config = ssoProviderConfigs[provider];
  if (!config) return null;

  return config.fields.map((field) => (
    <Form.Item
      key={field.name}
      label={field.label}
      name={field.name}
      rules={[{ required: true, message: `Por favor, informe o ${field.label.toLowerCase()}` }]}
    >
      {field.name.includes("client") ? <Input.Password /> : <TextInput placeholder={field.placeholder} />}
    </Form.Item>
  ));
};

const BaseSSOSettingsForm: React.FC<BaseSSOSettingsFormProps> = ({ form, onFormSubmit }) => {
  return (
    <div>
      <Form form={form} onFinish={onFormSubmit} labelCol={{ span: 8 }} wrapperCol={{ span: 16 }} labelAlign="left">
        <Form.Item
          label="SSO Provider"
          name="sso_provider"
          rules={[{ required: true, message: "Please select an SSO provider" }]}
        >
          <Select>
            {Object.entries(ssoProviderLogoMap).map(([value, logo]) => (
              <Select.Option key={value} value={value}>
                <div style={{ display: "flex", alignItems: "center", padding: "4px 0" }}>
                  {logo && (
                    <img
                      src={logo}
                      alt={value}
                      style={{ height: 24, width: 24, marginRight: 12, objectFit: "contain" }}
                    />
                  )}
                  <span>
                    {ssoProviderDisplayNames[value] || value.charAt(0).toUpperCase() + value.slice(1) + " SSO"}
                  </span>
                </div>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) => prevValues.sso_provider !== currentValues.sso_provider}
        >
          {({ getFieldValue }) => {
            const provider = getFieldValue("sso_provider");
            return provider ? renderProviderFields(provider) : null;
          }}
        </Form.Item>

        <Form.Item
          label="Proxy Admin Email"
          name="user_email"
          rules={[{ required: true, message: "Por favor, informe o email do administrador do proxy" }]}
        >
          <TextInput />
        </Form.Item>
        <Form.Item
          label="URL Base do Proxy"
          name="proxy_base_url"
          normalize={(value) => value?.trim()}
          rules={[
            { required: true, message: "Por favor, informe a URL base do proxy" },
            {
              pattern: /^https?:\/\/.+/,
              message: "A URL deve começar com http:// ou https://",
            },
            {
              validator: (_, value) => {
                // Only check for trailing slash if the URL starts with http:// or https://
                if (value && /^https?:\/\/.+/.test(value) && value.endsWith("/")) {
                  return Promise.reject("A URL não deve terminar com barra final");
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <TextInput placeholder="https://example.com" />
        </Form.Item>

        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) => prevValues.sso_provider !== currentValues.sso_provider}
        >
          {({ getFieldValue }) => {
            const provider = getFieldValue("sso_provider");
            return provider === "okta" || provider === "generic" ? (
              <Form.Item label="Utilizar Mapeamento de Papéis" name="use_role_mappings" valuePropName="checked">
                <Checkbox />
              </Form.Item>
            ) : null;
          }}
        </Form.Item>

        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) =>
            prevValues.use_role_mappings !== currentValues.use_role_mappings ||
            prevValues.sso_provider !== currentValues.sso_provider
          }
        >
          {({ getFieldValue }) => {
            const useRoleMappings = getFieldValue("use_role_mappings");
            const provider = getFieldValue("sso_provider");
            const supportsRoleMappings = provider === "okta" || provider === "generic";
            return useRoleMappings && supportsRoleMappings ? (
              <Form.Item
                label="Claim do Grupo"
                name="group_claim"
                rules={[{ required: true, message: "Por favor, informe o claim do grupo" }]}
              >
                <TextInput />
              </Form.Item>
            ) : null;
          }}
        </Form.Item>

        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) =>
            prevValues.use_role_mappings !== currentValues.use_role_mappings ||
            prevValues.sso_provider !== currentValues.sso_provider
          }
        >
          {({ getFieldValue }) => {
            const useRoleMappings = getFieldValue("use_role_mappings");
            const provider = getFieldValue("sso_provider");
            const supportsRoleMappings = provider === "okta" || provider === "generic";
            return useRoleMappings && supportsRoleMappings ? (
              <>
                <Form.Item label="Função Padrão" name="default_role" initialValue="Usuário Interno">
                  <Select>
                    <Select.Option value="internal_user_viewer">Visualizador Interno</Select.Option>
                    <Select.Option value="internal_user">Usuário Interno</Select.Option>
                    <Select.Option value="proxy_admin_viewer">Administrador Visualizador</Select.Option>
                    <Select.Option value="proxy_admin">Administrador do Proxy</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item label="Equipes do Administrador do Proxy" name="proxy_admin_teams">
                  <TextInput />
                </Form.Item>

                <Form.Item label="Equipes do Visualizador Administrativo" name="admin_viewer_teams">
                  <TextInput />
                </Form.Item>

                <Form.Item label="Equipes do Usuário Interno" name="internal_user_teams">
                  <TextInput />
                </Form.Item>

                <Form.Item label="Equipes do Visualizador Interno" name="internal_viewer_teams">
                  <TextInput />
                </Form.Item>
              </>
            ) : null;
          }}
        </Form.Item>

        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) => prevValues.sso_provider !== currentValues.sso_provider}
        >
          {({ getFieldValue }) => {
            const provider = getFieldValue("sso_provider");
            return provider === "okta" || provider === "generic" ? (
              <Form.Item label="Utilizar Mapeamento de Times" name="use_team_mappings" valuePropName="checked">
                <Checkbox />
              </Form.Item>
            ) : null;
          }}
        </Form.Item>

        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) =>
            prevValues.use_team_mappings !== currentValues.use_team_mappings ||
            prevValues.sso_provider !== currentValues.sso_provider
          }
        >
          {({ getFieldValue }) => {
            const useTeamMappings = getFieldValue("use_team_mappings");
            const provider = getFieldValue("sso_provider");
            const supportsTeamMappings = provider === "okta" || provider === "generic";
            return useTeamMappings && supportsTeamMappings ? (
              <Form.Item
                label="Campo JWT dos IDs dos Times"
                name="team_ids_jwt_field"
                rules={[{ required: true, message: "Por favor, informe o campo JWT dos IDs dos times" }]}
              >
                <TextInput />
              </Form.Item>
            ) : null;
          }}
        </Form.Item>
      </Form>
    </div>
  );
};

export default BaseSSOSettingsForm;
