import React, { useState, useEffect } from "react";
import { TextInput, Button as TremorButton } from "@tremor/react";
import { Modal, Form, Select, Tooltip, Input, Alert } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { CredentialItem, vectorStoreCreateCall } from "@/components/networking";
import {
  VectorStoreProviders,
  vectorStoreProviderLogoMap,
  vectorStoreProviderMap,
  getProviderSpecificFields,
  VectorStoreFieldConfig,
} from "@/components/vector_store_providers";
import { resolveLogoSrc } from "@/lib/assetPaths";
import { fetchAvailableModels, ModelGroup } from "@/components/llm_calls/fetch_models";
import NotificationsManager from "@/components/molecules/notifications_manager";

interface VectorStoreFormProps {
  isVisible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  accessToken: string | null;
  credentials: CredentialItem[];
}

const VectorStoreForm: React.FC<VectorStoreFormProps> = ({
  isVisible,
  onCancel,
  onSuccess,
  accessToken,
  credentials,
}) => {
  const [form] = Form.useForm();
  const [metadataJson, setMetadataJson] = useState("{}");
  const [selectedProvider, setSelectedProvider] = useState("bedrock");
  const [modelInfo, setModelInfo] = useState<ModelGroup[]>([]);
  const vertexEngineId = Form.useWatch("vertex_engine_id", form);

  useEffect(() => {
    if (!accessToken) return;

    const loadModels = async () => {
      try {
        const uniqueModels = await fetchAvailableModels(accessToken);
        if (uniqueModels.length > 0) {
          setModelInfo(uniqueModels);
        }
      } catch (error) {
        console.error("Error fetching model info:", error);
      }
    };

    loadModels();
  }, [accessToken]);

  const handleCreate = async (formValues: any) => {
    if (!accessToken) return;
    try {
      // Parse metadata JSON
      let metadata = {};
      try {
        metadata = metadataJson.trim() ? JSON.parse(metadataJson) : {};
      } catch (e) {
        NotificationsManager.fromBackend("JSON inválido no campo de metadata");
        return;
      }

      // Prepare the payload with provider-specific fields
      const payload: any = {
        vector_store_id: formValues.vector_store_id,
        custom_llm_provider: formValues.custom_llm_provider,
        vector_store_name: formValues.vector_store_name,
        vector_store_description: formValues.vector_store_description,
        vector_store_metadata: metadata,
        litellm_credential_name: formValues.litellm_credential_name,
      };

      // pass all provider fields as litellm params dict
      const providerFields = getProviderSpecificFields(formValues.custom_llm_provider);
      const litellmParams = providerFields.reduce(
        (acc, field) => {
          // Special handling for Milvus: rename embedding_model to litellm_embedding_model
          if (formValues.custom_llm_provider === "milvus" && field.name === "embedding_model") {
            acc["litellm_embedding_model"] = formValues[field.name];
          } else {
            acc[field.name] = formValues[field.name];
          }
          return acc;
        },
        {} as Record<string, any>,
      );

      payload["litellm_params"] = litellmParams;

      await vectorStoreCreateCall(accessToken, payload);
      NotificationsManager.success("Vector store criado com sucesso");
      form.resetFields();
      setMetadataJson("{}");
      onSuccess();
    } catch (error) {
      console.error("Error creating vector store:", error);
      NotificationsManager.fromBackend("Erro ao criar vector store: " + error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setMetadataJson("{}");
    setSelectedProvider("bedrock");
    onCancel();
  };

  return (
    <Modal title="Adicionar Novo Vector Store" open={isVisible} width={1000} footer={null} onCancel={handleCancel}>
      <Form form={form} onFinish={handleCreate} labelCol={{ span: 8 }} wrapperCol={{ span: 16 }} labelAlign="left">
        <Form.Item
          label={
            <span>
              Provider{" "}
              <Tooltip title="Select the provider for this vector store">
                <InfoCircleOutlined style={{ marginLeft: "4px" }} />
              </Tooltip>
            </span>
          }
          name="custom_llm_provider"
          rules={[{ required: true, message: "Please select a provider" }]}
          initialValue="bedrock"
        >
          <Select onChange={(value) => setSelectedProvider(value)}>
            {Object.entries(VectorStoreProviders).map(([providerEnum, providerDisplayName]) => {
              return (
                <Select.Option key={providerEnum} value={vectorStoreProviderMap[providerEnum]}>
                  <div className="flex items-center space-x-2">
                    <img
                      src={resolveLogoSrc(vectorStoreProviderLogoMap[providerDisplayName])}
                      alt={`logo ${providerEnum}`}
                      className="w-5 h-5"
                      onError={(e) => {
                        // Create a div with provider initial as fallback
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
                </Select.Option>
              );
            })}
          </Select>
        </Form.Item>

        {/* PG Vector Setup Instructions */}
        {selectedProvider === "pg_vector" && (
          <Alert
            message="Configuração do PG Vector Necessária"
            description={
              <div>
                <p>Polyglot fornece um servidor para se conectar ao PG Vector. Para usar este provedor:</p>
                <ol style={{ marginLeft: "16px", marginTop: "8px" }}>
                  <li>
                    Deploy do servidor litellm-pgvector a partir de:{" "}
                    <a href="https://github.com/BerriAI/litellm-pgvector" target="_blank" rel="noopener noreferrer">
                      https://github.com/BerriAI/litellm-pgvector
                    </a>
                  </li>
                  <li>Configure seu banco de dados PostgreSQL com a extensão pgvector</li>
                  <li>Inicie o servidor e anote a URL base da API e a chave da API</li>
                  <li>Digite esses detalhes nos campos abaixo</li>
                </ol>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: "16px" }}
          />
        )}

        {/* Vertex RAG Engine Setup Instructions */}
        {selectedProvider === "vertex_rag_engine" && (
          <Alert
            message="Configuração do Vertex AI RAG Engine"
            description={
              <div>
                <p>Para usar o Vertex AI RAG Engine:</p>
                <ol style={{ marginLeft: "16px", marginTop: "8px" }}>
                  <li>
                    Configure o corpus do Vertex AI RAG Engine seguindo o guia:{" "}
                    <a
                      href="https://cloud.google.com/vertex-ai/generative-ai/docs/rag-engine/rag-overview"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Visão Geral do Vertex AI RAG Engine
                    </a>
                  </li>
                  <li>Crie um corpus no seu projeto Google Cloud</li>
                  <li>Anote o ID do corpus do console Vertex AI</li>
                  <li>Digite o ID do corpus no campo Vector Store ID abaixo</li>
                </ol>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: "16px" }}
          />
        )}

        {/* Vertex AI Search Setup Instructions */}
        {selectedProvider === "vertex_ai/search_api" && (
          <Alert
            message="Configuração do Vertex AI Search"
            description={
              <div>
                <p>Para usar o Vertex AI Search (Discovery Engine):</p>
                <ol style={{ marginLeft: "16px", marginTop: "8px" }}>
                  <li>
                    Ative a API do Discovery Engine no seu projeto Google Cloud e crie uma loja de dados seguindo o
                    guia:{" "}
                    <a
                      href="https://cloud.google.com/generative-ai-app-builder/docs/create-data-store-es"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: "underline" }}
                    >
                      Criar uma loja de dados do Vertex AI Search
                    </a>
                  </li>
                  <li>Escolha um local suportado: global, us ou eu</li>
                  <li>
                    Para a maioria dos tipos de loja de dados (Cloud Storage, BigQuery, Media): copie o ID da loja de dados e digite-o no
                    campo Vector Store ID abaixo.
                  </li>
                  <li>
                    Para fontes baseadas em websites, saúde e conectores (Drive, Gmail, Slack, Jira, etc.): crie um
                    aplicativo de busca sobre a loja de dados, depois copie o <strong>ID do Engine</strong> e digite-o no
                    campo Engine ID. O Vector Store ID ainda é necessário como nome do lado do Polyglot para este registro, mas
                    ele não é usado na URL do GCP quando o Engine ID está configurado.
                  </li>
                </ol>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: "16px" }}
          />
        )}

        <Form.Item
          label={
            <span>
              ID do Vector Store{" "}
              <Tooltip title="Digite o ID do vector store fornecido pelo seu provedor de API">
                <InfoCircleOutlined style={{ marginLeft: "4px" }} />
              </Tooltip>
            </span>
          }
          name="vector_store_id"
          rules={[{ required: true, message: "Por favor, informe o ID do vector store fornecido pelo seu provedor de API" }]}
        >
          <TextInput
            placeholder={
              selectedProvider === "vertex_rag_engine"
                ? "6917529027641081856 (Obtenha o ID do corpus do console Vertex AI)"
                : selectedProvider === "vertex_ai/search_api"
                  ? vertexEngineId
                    ? "Qualquer identificador que você usará para referenciar isto no Polyglot"
                    : "my-datastore_1234567890 (Obtenha o ID da loja de dados do console Vertex AI Search)"
                  : "Informe o ID do vector store fornecido pelo seu provedor"
            }
          />
        </Form.Item>

        {/* Provider-specific fields */}
        {getProviderSpecificFields(selectedProvider).map((field: VectorStoreFieldConfig) => {
          if (field.type === "select") {
            const selectOptions =
              field.options ??
              modelInfo
                .filter((option: ModelGroup) => option.mode === "embedding" || option.mode === null)
                .map((option: ModelGroup) => ({
                  value: option.model_group,
                  label: option.model_group,
                }));

            return (
              <Form.Item
                key={field.name}
                label={
                  <span>
                    {field.label}{" "}
                    <Tooltip title={field.tooltip}>
                      <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                    </Tooltip>
                  </span>
                }
                name={field.name}
                initialValue={field.initialValue}
                rules={
                  field.required ? [{ required: true, message: `Please select the ${field.label.toLowerCase()}` }] : []
                }
              >
                <Select
                  placeholder={field.placeholder}
                  showSearch={true}
                  filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
                  options={selectOptions}
                  style={{ width: "100%" }}
                />
              </Form.Item>
            );
          }

          return (
            <Form.Item
              key={field.name}
              label={
                <span>
                  {field.label}{" "}
                  <Tooltip title={field.tooltip}>
                    <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                  </Tooltip>
                </span>
              }
              name={field.name}
              rules={
                field.required ? [{ required: true, message: `Please input the ${field.label.toLowerCase()}` }] : []
              }
            >
              <TextInput type={field.type || "text"} placeholder={field.placeholder} />
            </Form.Item>
          );
        })}

        <Form.Item
          label={
            <span>
              Nome do Vector Store{" "}
              <Tooltip title="Nome personalizado que você deseja atribuir ao vector store, este nome será exibido na interface do Polyglot">
                <InfoCircleOutlined style={{ marginLeft: "4px" }} />
              </Tooltip>
            </span>
          }
          name="vector_store_name"
        >
          <TextInput />
        </Form.Item>

        <Form.Item label="Descrição" name="vector_store_description">
          <Input.TextArea rows={4} />
        </Form.Item>

        <Form.Item
          label={
            <span>
              Credenciais Existentes{" "}
              <Tooltip title="Selecione opcionalmente as credenciais do provedor de API para este vector store, ex. Chave API do Bedrock">
                <InfoCircleOutlined style={{ marginLeft: "4px" }} />
              </Tooltip>
            </span>
          }
          name="litellm_credential_name"
        >
          <Select
            showSearch
            placeholder="Selecione ou pesquise pelas credenciais existentes"
            optionFilterProp="children"
            filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
            options={[
              { value: null, label: "Nenhuma" },
              ...credentials.map((credential) => ({
                value: credential.credential_name,
                label: credential.credential_name,
              })),
            ]}
            allowClear
          />
        </Form.Item>

        <Form.Item
          label={
            <span>
              Metadata{" "}
              <Tooltip title="Metadata JSON para o vector store (opcional)">
                <InfoCircleOutlined style={{ marginLeft: "4px" }} />
              </Tooltip>
            </span>
          }
        >
          <Input.TextArea
            rows={4}
            value={metadataJson}
            onChange={(e) => setMetadataJson(e.target.value)}
            placeholder='{"chave": "valor"}'
          />
        </Form.Item>

        <div className="flex justify-end space-x-3">
          <TremorButton onClick={handleCancel} variant="secondary">
            Cancelar
          </TremorButton>
          <TremorButton variant="primary" type="submit">
            Criar
          </TremorButton>
        </div>
      </Form>
    </Modal>
  );
};

export default VectorStoreForm;
