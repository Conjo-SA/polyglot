"use client";

import { useMCPSemanticFilterSettings } from "@/app/(dashboard)/hooks/mcpSemanticFilterSettings/useMCPSemanticFilterSettings";
import { useUpdateMCPSemanticFilterSettings } from "@/app/(dashboard)/hooks/mcpSemanticFilterSettings/useUpdateMCPSemanticFilterSettings";
import NotificationManager from "@/components/molecules/notifications_manager";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  InputNumber,
  Row,
  Select,
  Skeleton,
  Slider,
  Space,
  Switch,
  Typography,
  Tooltip,
} from "antd";
import { QuestionCircleOutlined, CheckCircleOutlined, SaveOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { fetchAvailableModels, ModelGroup } from "@/components/llm_calls/fetch_models";
import MCPSemanticFilterTestPanel from "./MCPSemanticFilterTestPanel";
import { getCurlCommand, runSemanticFilterTest, TestResult } from "./semanticFilterTestUtils";

interface MCPSemanticFilterSettingsProps {
  accessToken: string | null;
}

export default function MCPSemanticFilterSettings({ accessToken }: MCPSemanticFilterSettingsProps) {
  const { data, isLoading, isError, error } = useMCPSemanticFilterSettings();
  const {
    mutate: updateSettings,
    isPending: isUpdating,
    error: updateError,
  } = useUpdateMCPSemanticFilterSettings(accessToken || "");
  const [form] = Form.useForm();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [embeddingModels, setEmbeddingModels] = useState<ModelGroup[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);

  // Test section state
  const [testQuery, setTestQuery] = useState("");
  const [testModel, setTestModel] = useState<string>("gpt-4o");
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const schema = data?.field_schema;
  const values = data?.values ?? {};

  useEffect(() => {
    const loadEmbeddingModels = async () => {
      if (!accessToken) return;
      try {
        setLoadingModels(true);
        const models = await fetchAvailableModels(accessToken);
        const embeddingOnly = models.filter((model) => model.mode === "embedding");
        setEmbeddingModels(embeddingOnly);
      } catch (error) {
        console.error("Error fetching embedding models:", error);
      } finally {
        setLoadingModels(false);
      }
    };

    loadEmbeddingModels();
  }, [accessToken]);

  useEffect(() => {
    if (values) {
      form.setFieldsValue({
        enabled: values.enabled ?? false,
        embedding_model: values.embedding_model ?? "text-embedding-3-small",
        top_k: values.top_k ?? 10,
        similarity_threshold: values.similarity_threshold ?? 0.3,
      });
      setIsDirty(false);
    }
  }, [values, form]);

  const handleSave = async () => {
    try {
      const formValues = await form.validateFields();
      updateSettings(formValues, {
        onSuccess: () => {
          setIsDirty(false);
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
          NotificationManager.success(
            "Configurações atualizadas com sucesso. As mudanças serão aplicadas em todos os pods dentro de 10 segundos.",
          );
        },
        onError: (error) => {
          NotificationManager.fromBackend(error);
        },
      });
    } catch (error) {
      console.error("Form validation failed:", error);
    }
  };

  const handleTest = async () => {
    if (!accessToken) {
      return;
    }

    await runSemanticFilterTest({
      accessToken,
      testModel,
      testQuery,
      setIsTesting,
      setTestResult,
      setTestError,
    });
  };

  if (!accessToken) {
    return <div className="p-6 text-center text-gray-500">Por favor, faça login para configurar as definições do filtro semântico.</div>;
  }

  return (
    <div style={{ width: "100%" }}>
      {isLoading ? (
        <Skeleton active />
      ) : isError ? (
        <Alert
          type="error"
          message="Não foi possível carregar as configurações do Filtro Semântico MCP"
          description={error instanceof Error ? error.message : undefined}
          style={{ marginBottom: 24 }}
        />
      ) : (
        <>
          <Alert
            type="info"
            message="Filtragem Semântica de Ferramentas"
            description="Filtra ferramentas MCP de forma semântica com base na relevância da consulta. Isso reduz o tamanho da janela de contexto e melhora a precisão da seleção de ferramentas. Clique em 'Salvar Configurações' para aplicar as alterações em todos os pods (efeito dentro de 10 segundos)."
            showIcon
            style={{ marginBottom: 24 }}
          />

          {saveSuccess && (
            <Alert
              type="success"
              message="Configurações salvas com sucesso"
              icon={<CheckCircleOutlined />}
              showIcon
              closable
              style={{ marginBottom: 16 }}
            />
          )}

          {updateError && (
            <Alert
              type="error"
              message="Não foi possível atualizar as configurações"
              description={updateError instanceof Error ? updateError.message : undefined}
              style={{ marginBottom: 16 }}
            />
          )}

          <Row gutter={24}>
            {/* Left Column - Settings */}
            <Col xs={24} lg={12}>
              <Form
                form={form}
                layout="vertical"
                disabled={isUpdating}
                onValuesChange={() => {
                  setIsDirty(true);
                }}
              >
                <Card style={{ marginBottom: 16 }}>
                  <Form.Item
                    name="enabled"
                    label={
                      <Space>
                        <Typography.Text strong>Habilitar Filtragem Semântica</Typography.Text>
                        <Tooltip title="Quando habilitado, apenas as ferramentas MCP mais relevantes serão incluídas nas requisições com base em similaridade semântica">
                          <QuestionCircleOutlined style={{ color: "#8c8c8c" }} />
                        </Tooltip>
                      </Space>
                    }
                    valuePropName="checked"
                  >
                    <Switch disabled={isUpdating} />
                  </Form.Item>

                  <Typography.Text type="secondary" style={{ display: "block", marginTop: -16, marginBottom: 16 }}>
                    {schema?.properties?.enabled?.description}
                  </Typography.Text>
                </Card>

                <Card title="Configuration" style={{ marginBottom: 16 }}>
                  <Form.Item
                    name="embedding_model"
                    label={
                      <Space>
                        <Typography.Text strong>Embedding Model</Typography.Text>
                        <Tooltip title="O modelo usado para gerar embeddings para correspondência semântica">
                          <QuestionCircleOutlined style={{ color: "#8c8c8c" }} />
                        </Tooltip>
                      </Space>
                    }
                  >
                    <Select
                      options={embeddingModels.map((model) => ({
                        label: model.model_group,
                        value: model.model_group,
                      }))}
                      placeholder={loadingModels ? "Carregando modelos..." : "Selecionar modelo de embedding"}
                      showSearch
                      disabled={isUpdating || loadingModels}
                      loading={loadingModels}
                      notFoundContent={loadingModels ? "Carregando..." : "Nenhum modelo de embedding disponível"}
                    />
                  </Form.Item>

                  <Form.Item
                    name="top_k"
                    label={
                      <Space>
                        <Typography.Text strong>Top K Results</Typography.Text>
                        <Tooltip title="Número máximo de ferramentas a serem retornadas após o filtro">
                          <QuestionCircleOutlined style={{ color: "#8c8c8c" }} />
                        </Tooltip>
                      </Space>
                    }
                  >
                    <InputNumber min={1} max={100} style={{ width: "100%" }} disabled={isUpdating} />
                  </Form.Item>

                  <Form.Item
                    name="similarity_threshold"
                    label={
                      <Space>
                        <Typography.Text strong>Similarity Threshold</Typography.Text>
                        <Tooltip title="Pontuação mínima de similaridade (0-1) para que uma ferramenta seja incluída">
                          <QuestionCircleOutlined style={{ color: "#8c8c8c" }} />
                        </Tooltip>
                      </Space>
                    }
                  >
                    <Slider
                      min={0}
                      max={1}
                      step={0.05}
                      marks={{
                        0: "0.0",
                        0.3: "0.3",
                        0.5: "0.5",
                        0.7: "0.7",
                        1: "1.0",
                      }}
                      disabled={isUpdating}
                    />
                  </Form.Item>
                </Card>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleSave}
                    loading={isUpdating}
                    disabled={!isDirty}
                  >
                    Salvar Configurações
                  </Button>
                </div>
              </Form>
            </Col>

            {/* Right Column - Test Configuration */}
            <Col xs={24} lg={12}>
              <MCPSemanticFilterTestPanel
                accessToken={accessToken}
                testQuery={testQuery}
                setTestQuery={setTestQuery}
                testModel={testModel}
                setTestModel={setTestModel}
                isTesting={isTesting}
                onTest={handleTest}
                filterEnabled={!!values.enabled}
                testResult={testResult}
                testError={testError}
                curlCommand={getCurlCommand(testModel, testQuery)}
              />
            </Col>
          </Row>
        </>
      )}
    </div>
  );
}
