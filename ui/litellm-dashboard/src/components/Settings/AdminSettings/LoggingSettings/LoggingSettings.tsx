"use client";

import {
  ConfigType,
  GeneralSettingsFieldName,
  useDeleteProxyConfigField,
  useProxyConfig,
} from "@/app/(dashboard)/hooks/proxyConfig/useProxyConfig";
import {
  StoreRequestInSpendLogsParams,
  useStoreRequestInSpendLogs,
} from "@/app/(dashboard)/hooks/storeRequestInSpendLogs/useStoreRequestInSpendLogs";
import NotificationsManager from "@/components/molecules/notifications_manager";
import { parseErrorMessage } from "@/components/shared/errorUtils";
import { ClockCircleOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, Skeleton, Space, Switch, Typography } from "antd";
import React, { useMemo } from "react";

const LoggingSettings: React.FC = () => {
  const [form] = Form.useForm();
  const { mutate, isPending } = useStoreRequestInSpendLogs();
  const { mutate: deleteField, isPending: isDeletingField } = useDeleteProxyConfigField();
  const { data: proxyConfigData, isLoading: isLoadingConfig } = useProxyConfig(ConfigType.GENERAL_SETTINGS);

  const initialValues = useMemo(() => {
    if (!proxyConfigData) {
      return {
        store_prompts_in_spend_logs: false,
        maximum_spend_logs_retention_period: undefined,
      };
    }

    const storePromptsField = proxyConfigData.find((field) => field.field_name === "store_prompts_in_spend_logs");
    const retentionPeriodField = proxyConfigData.find(
      (field) => field.field_name === "maximum_spend_logs_retention_period",
    );

    return {
      store_prompts_in_spend_logs: storePromptsField?.field_value ?? false,
      maximum_spend_logs_retention_period: retentionPeriodField?.field_value ?? undefined,
    };
  }, [proxyConfigData]);

  const handleFormSubmit = (formValues: StoreRequestInSpendLogsParams) => {
    const retentionPeriodValue = formValues.maximum_spend_logs_retention_period;
    const hasRetentionPeriod = typeof retentionPeriodValue === "string" && retentionPeriodValue.trim() !== "";

    const updateParams: StoreRequestInSpendLogsParams = {
      store_prompts_in_spend_logs: formValues.store_prompts_in_spend_logs,
      ...(hasRetentionPeriod && { maximum_spend_logs_retention_period: retentionPeriodValue }),
    };

    const submitUpdate = () =>
      mutate(updateParams, {
        onSuccess: () => NotificationsManager.success("Spend logs settings updated successfully"),
        onError: (error) =>
          NotificationsManager.fromBackend("Failed to save spend logs settings: " + parseErrorMessage(error)),
      });

    if (hasRetentionPeriod) {
      submitUpdate();
      return;
    }

    deleteField(
      {
        config_type: ConfigType.GENERAL_SETTINGS,
        field_name: GeneralSettingsFieldName.MAXIMUM_SPEND_LOGS_RETENTION_PERIOD,
      },
      {
        onError: (deleteError) => console.warn("Failed to delete retention period field (may not exist):", deleteError),
        onSettled: submitUpdate,
      },
    );
  };

  return (
    <Card title="Configurações de Registro">
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Typography.Paragraph style={{ marginBottom: 0 }} type="secondary">
          Configurações globais que controlam como os dados de requisições e respostas são gravados nos registros de gastos.
        </Typography.Paragraph>

        {isLoadingConfig ? (
          <Skeleton active paragraph={{ rows: 4 }} />
        ) : (
          <Form form={form} layout="vertical" onFinish={handleFormSubmit} initialValues={initialValues}>
            <Form.Item
              label="Armazenar Prompt nos Registros de Gastos"
              name="store_prompts_in_spend_logs"
              tooltip={
                proxyConfigData?.find((f) => f.field_name === "store_prompts_in_spend_logs")?.field_description ||
                "Quando ativado, os prompts serão armazenados nos registros de gastos para fins de rastreamento e análise."
              }
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              label="Período Máximo de Retenção dos Registros de Gastos (Opcional)"
              name="maximum_spend_logs_retention_period"
              tooltip={
                proxyConfigData?.find((f) => f.field_name === "maximum_spend_logs_retention_period")
                  ?.field_description ||
                "Defina o período máximo de retenção para os registros de gastos (ex., '7d' para 7 dias, '30d' para 30 dias). Deixe vazio para não aplicar limite."
              }
            >
              <Input placeholder="ex., 7d, 30d" prefix={<ClockCircleOutlined />} />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={isPending || isDeletingField}>
                {isPending || isDeletingField ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </Form.Item>
          </Form>
        )}
      </Space>
    </Card>
  );
};

export default LoggingSettings;
