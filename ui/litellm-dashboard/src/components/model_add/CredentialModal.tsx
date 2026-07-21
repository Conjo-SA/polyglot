import { TextInput } from "@tremor/react";
import { Select as AntdSelect, Button, Form, Modal, Tooltip, Typography } from "antd";
import type { UploadProps } from "antd/es/upload";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import ProviderSpecificFields from "../add_model/provider_specific_fields";
import { CredentialItem } from "../networking";
import { Providers, providerLogoMap } from "../provider_info_helpers";
import { resolveLogoSrc } from "@/lib/assetPaths";
import { resetCredentialFormOnProviderChange } from "./credential_form_helpers";

const { Link } = Typography;

interface CredentialModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (values: any) => void;
  uploadProps: UploadProps;
  mode: "add" | "edit";
  existingCredential?: CredentialItem | null;
}

export default function CredentialModal({
  open,
  onCancel,
  onSubmit,
  uploadProps,
  mode,
  existingCredential = null,
}: CredentialModalProps) {
  const { t } = useTranslation();
  const isEdit = mode === "edit";
  const [form] = Form.useForm();
  const [selectedProvider, setSelectedProvider] = useState<Providers>(
    (existingCredential?.credential_info.custom_llm_provider as Providers) ?? Providers.OpenAI,
  );

  const initialValues = existingCredential
    ? {
        credential_name: existingCredential.credential_name,
        custom_llm_provider: existingCredential.credential_info.custom_llm_provider,
        ...Object.fromEntries(
          Object.entries(existingCredential.credential_values || {}).map(([key, value]) => [key, value ?? null]),
        ),
      }
    : undefined;

  const handleSubmit = (values: any) => {
    const filteredValues = Object.entries(values).reduce((acc, [key, value]) => {
      if (value !== "" && value !== undefined && value !== null) {
        acc[key] = value;
      }
      return acc;
    }, {} as any);
    onSubmit(filteredValues);
    form.resetFields();
  };

  const closeAndReset = () => {
    onCancel();
    form.resetFields();
  };

  return (
    <Modal
      title={isEdit ? t("credentialModal.editTitle") : t("credentialModal.addTitle")}
      open={open}
      onCancel={closeAndReset}
      footer={null}
      width={600}
      destroyOnHidden={isEdit}
    >
      <Form form={form} onFinish={handleSubmit} layout="vertical" initialValues={initialValues}>
        <Form.Item
          label={t("credentialModal.credentialNameLabel")}
          name="credential_name"
          rules={[{ required: true, message: t("credentialModal.credentialNameRequired") }]}
        >
          <TextInput placeholder={t("credentialModal.credentialNamePlaceholder")} disabled={isEdit} />
        </Form.Item>

        <Form.Item
          rules={[{ required: true, message: t("credentialModal.requiredField") }]}
          label={t("credentialModal.provider")}
          name="custom_llm_provider"
          tooltip={t("credentialModal.providerTooltip")}
        >
          <AntdSelect
            showSearch
            onChange={(value) => {
              resetCredentialFormOnProviderChange(form, value as Providers, setSelectedProvider);
            }}
          >
            {Object.entries(Providers).map(([providerEnum, providerDisplayName]) => (
              <AntdSelect.Option key={providerEnum} value={providerEnum}>
                <div className="flex items-center space-x-2">
                  <img
                    src={resolveLogoSrc(providerLogoMap[providerDisplayName])}
                    alt={`${providerEnum} logo`}
                    className="w-5 h-5"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      const parent = target.parentElement;
                      if (parent) {
                        const fallbackDiv = document.createElement("div");
                        fallbackDiv.className =
                          "w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-xs";
                        fallbackDiv.textContent = providerDisplayName.charAt(0);
                        parent.replaceChild(fallbackDiv, target);
                      }
                    }}
                  />
                  <span>{providerDisplayName}</span>
                </div>
              </AntdSelect.Option>
            ))}
          </AntdSelect>
        </Form.Item>

        <ProviderSpecificFields selectedProvider={selectedProvider} uploadProps={uploadProps} />

        <div className="flex justify-between items-center">
          <Tooltip title={t("credentialModal.needHelpTooltip")}>
            <Link href="https://github.com/BerriAI/litellm/issues">{t("credentialModal.needHelp")}</Link>
          </Tooltip>

          <div>
            <Button onClick={closeAndReset} style={{ marginRight: 10 }}>
              {t("credentialModal.cancel")}
            </Button>
            <Button htmlType="submit">{isEdit ? t("credentialModal.updateCredential") : t("credentialModal.addCredential")}</Button>
          </div>
        </div>
      </Form>
    </Modal>
  );
}
