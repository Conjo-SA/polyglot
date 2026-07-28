"use client";

import { useHashicorpVaultConfig } from "@/app/(dashboard)/hooks/configOverrides/useHashicorpVaultConfig";
import { useUpdateHashicorpVaultConfig } from "@/app/(dashboard)/hooks/configOverrides/useUpdateHashicorpVaultConfig";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import NotificationManager from "@/components/molecules/notifications_manager";
import { Button, Divider, Form, Input, Modal, Space, Typography } from "antd";
import React, { useEffect } from "react";
import { SENSITIVE_FIELDS, FIELD_LABELS } from "./constants";

interface FieldGroup {
  title: string;
  subtitle?: string;
  fields: string[];
}

const FIELD_GROUPS: FieldGroup[] = [
  {
    title: "Conexão",
    fields: ["vault_addr", "vault_namespace", "vault_mount_name", "vault_path_prefix"],
  },
  {
    title: "Autenticação por Token",
    subtitle: "Use um token do Vault para autenticar. Apenas um método de autenticação é necessário.",
    fields: ["vault_token"],
  },
  {
    title: "Autenticação por AppRole",
    subtitle: "Use credenciais do AppRole para autenticar. Apenas um método de autenticação é necessário.",
    fields: ["approle_role_id", "approle_secret_id", "approle_mount_path"],
  },
  {
    title: "TLS",
    subtitle: "Certificado cliente opcional para mTLS.",
    fields: ["client_cert", "client_key", "vault_cert_role"],
  },
];

interface EditHashicorpVaultModalProps {
  isVisible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const EditHashicorpVaultModal: React.FC<EditHashicorpVaultModalProps> = ({ isVisible, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const { accessToken } = useAuthorized();
  const { data } = useHashicorpVaultConfig();
  const { mutate, isPending } = useUpdateHashicorpVaultConfig(accessToken);

  const schema = data?.field_schema;
  const properties = schema?.properties ?? {};
  const rawValues = data?.values ?? {};

  useEffect(() => {
    if (isVisible && data) {
      form.resetFields();
      // Only set non-sensitive fields — sensitive ones show as placeholders
      const formValues: Record<string, any> = {};
      for (const [key, value] of Object.entries(rawValues)) {
        if (!SENSITIVE_FIELDS.has(key)) {
          formValues[key] = value;
        }
      }
      form.setFieldsValue(formValues);
    }
  }, [isVisible, data, form]);

  const handleSubmit = (formValues: Record<string, any>) => {
    const config: Record<string, any> = {};
    for (const [key, value] of Object.entries(formValues)) {
      if (value !== undefined && value !== null && value !== "") {
        // Non-empty value → update
        config[key] = value;
      } else if (!SENSITIVE_FIELDS.has(key)) {
        // Non-sensitive field cleared → send "" to clear it on the backend
        config[key] = "";
      }
      // Sensitive field left blank → omit from payload (keep existing)
    }

    mutate(config, {
      onSuccess: () => {
        NotificationManager.success("Configuração do Hashicorp Vault atualizada com sucesso");
        onSuccess();
      },
      onError: (err) => {
        NotificationManager.fromBackend(err);
      },
    });
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  const renderField = (fieldName: string) => {
    const fieldSchema = properties[fieldName];
    if (!fieldSchema) return null;

    const rules =
      fieldName === "vault_addr"
        ? [{ pattern: /^https?:\/\/.+/, message: "Deve começar com http:// ou https://" }]
        : undefined;

    const isSensitive = SENSITIVE_FIELDS.has(fieldName);
    const existingValue = rawValues[fieldName];
    const hasExistingValue = isSensitive && existingValue != null && existingValue !== "";
    const placeholder = hasExistingValue ? `Deixe em branco para manter o existente (${existingValue})` : fieldSchema?.description;

    return (
      <Form.Item key={fieldName} name={fieldName} label={FIELD_LABELS[fieldName] ?? fieldName} rules={rules}>
        {isSensitive ? <Input.Password placeholder={placeholder} /> : <Input placeholder={fieldSchema?.description} />}
      </Form.Item>
    );
  };

  return (
    <Modal
      title="Editar Configuração do Hashicorp Vault"
      open={isVisible}
      width={700}
      footer={
        <Space>
          <Button onClick={handleCancel} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="primary" loading={isPending} onClick={() => form.submit()}>
            {isPending ? "Salvando..." : "Salvar"}
          </Button>
        </Space>
      }
      onCancel={handleCancel}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        {FIELD_GROUPS.map((group, index) => (
          <div key={group.title}>
            {index > 0 && <Divider />}
            <Typography.Title level={5} style={{ marginBottom: 4 }}>
              {group.title}
            </Typography.Title>
            {group.subtitle && (
              <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
                {group.subtitle}
              </Typography.Paragraph>
            )}
            {group.fields.map(renderField)}
          </div>
        ))}
      </Form>
    </Modal>
  );
};

export default EditHashicorpVaultModal;
