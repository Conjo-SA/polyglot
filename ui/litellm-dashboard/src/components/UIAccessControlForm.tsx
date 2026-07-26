import React, { useEffect, useState } from "react";
import { Form, Button as Button2, Select } from "antd";
import { Text, TextInput } from "@tremor/react";
import { getSSOSettings, updateSSOSettings } from "./networking";
import NotificationManager from "./molecules/notifications_manager";

interface UIAccessControlFormProps {
  accessToken: string | null;
  onSuccess: () => void;
}

// Separate UI Access Control Form Component
const UIAccessControlForm: React.FC<UIAccessControlFormProps> = ({ accessToken, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Load existing UI access control settings
  useEffect(() => {
    const loadUIAccessSettings = async () => {
      if (accessToken) {
        try {
          const ssoData = await getSSOSettings(accessToken);
          if (ssoData && ssoData.values) {
            // Handle nested ui_access_mode structure
            const uiAccessMode = ssoData.values.ui_access_mode;
            let formValues = {};

            if (uiAccessMode && typeof uiAccessMode === "object") {
              formValues = {
                ui_access_mode_type: uiAccessMode.type,
                restricted_sso_group: uiAccessMode.restricted_sso_group,
                sso_group_jwt_field: uiAccessMode.sso_group_jwt_field,
              };
            } else if (typeof uiAccessMode === "string") {
              // Handle legacy flat structure
              formValues = {
                ui_access_mode_type: uiAccessMode,
                restricted_sso_group: ssoData.values.restricted_sso_group,
                sso_group_jwt_field: ssoData.values.team_ids_jwt_field || ssoData.values.sso_group_jwt_field,
              };
            }

            form.setFieldsValue(formValues);
          }
        } catch (error) {
          console.error("Failed to load UI access settings:", error);
        }
      }
    };

    loadUIAccessSettings();
  }, [accessToken, form]);

  const handleUIAccessSubmit = async (formValues: Record<string, any>) => {
    if (!accessToken) {
      NotificationManager.fromBackend("No access token available");
      return;
    }

    setLoading(true);
    try {
      // Transform form data to match API expected structure
      let apiPayload;

      if (formValues.ui_access_mode_type === "all_authenticated_users") {
        // Set ui_access_mode to none when all_authenticated_users is selected
        apiPayload = {
          ui_access_mode: "none",
        };
      } else {
        apiPayload = {
          ui_access_mode: {
            type: formValues.ui_access_mode_type,
            restricted_sso_group: formValues.restricted_sso_group,
            sso_group_jwt_field: formValues.sso_group_jwt_field,
          },
        };
      }

      await updateSSOSettings(accessToken, apiPayload);
      onSuccess();
    } catch (error) {
      console.error("Failed to save UI access settings:", error);
      NotificationManager.fromBackend("Failed to save UI access settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "16px" }}>
      <div style={{ marginBottom: "16px" }}>
        <Text style={{ fontSize: "14px", color: "#6b7280" }}>
          Configure quem pode acessar a interface da UI e como as informações de grupo são extraídas dos tokens JWT.
        </Text>
      </div>

      <Form form={form} onFinish={handleUIAccessSubmit} layout="vertical">
        <Form.Item label="Modo de Acesso à Interface" name="ui_access_mode_type" tooltip="Controla quem pode acessar a interface da UI">
          <Select placeholder="Selecionar modo de acesso">
            <Select.Option value="all_authenticated_users">Todos os Usuários Autenticados</Select.Option>
            <Select.Option value="restricted_sso_group">Grupo SSO Restrito</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) =>
            prevValues.ui_access_mode_type !== currentValues.ui_access_mode_type
          }
        >
          {({ getFieldValue }) => {
            const uiAccessModeType = getFieldValue("ui_access_mode_type");
            return uiAccessModeType === "restricted_sso_group" ? (
              <Form.Item
                label="Restricted SSO Group"
                name="restricted_sso_group"
                rules={[{ required: true, message: "Por favor, informe o grupo SSO restrito" }]}
              >
                <TextInput placeholder="ui-access-group" />
              </Form.Item>
            ) : null;
          }}
        </Form.Item>

        <Form.Item
          label="Campo JWT do Grupo SSO"
          name="sso_group_jwt_field"
          tooltip="Nome do campo JWT que contém informações de equipe/grupo. Use notação de ponto para acessar campos aninhados."
        >
          <TextInput placeholder="groups" />
        </Form.Item>

        <div style={{ textAlign: "right", marginTop: "16px" }}>
          <Button2
            type="primary"
            htmlType="submit"
            loading={loading}
            style={{
              backgroundColor: "#6366f1",
              borderColor: "#6366f1",
            }}
          >
            Atualizar Controle de Acesso à Interface
          </Button2>
        </div>
      </Form>
    </div>
  );
};

export default UIAccessControlForm;
