import { isAdminRole } from "@/utils/roles";
import { InfoCircleOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Button, TextInput } from "@tremor/react";
import { Form, Input, Modal, Select, Tooltip, Typography } from "antd";
import React, { useState } from "react";
import { resolveLogoSrc } from "@/lib/assetPaths";
import NotificationsManager from "@/components/molecules/notifications_manager";
import { createSearchTool, fetchAvailableSearchProviders } from "@/components/networking";
import SearchConnectionTest from "./SearchConnectionTest";
import { AvailableSearchProvider, SearchTool } from "./types";

const { TextArea } = Input;

// Search provider logos folder path (matches existing provider logo pattern)
const searchProviderLogosFolder = "/ui/assets/logos/";

// Helper function to get logo path for a search provider
const getSearchProviderLogo = (providerName: string): string => {
  return `${searchProviderLogosFolder}${providerName}.png`;
};

// Component to display search provider logo and name
interface SearchProviderLabelProps {
  providerName: string;
  displayName: string;
}

const SearchProviderLabel: React.FC<SearchProviderLabelProps> = ({ providerName, displayName }) => (
  <div style={{ display: "flex", alignItems: "center" }}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src={resolveLogoSrc(getSearchProviderLogo(providerName))}
      alt=""
      style={{
        width: "20px",
        height: "20px",
        marginRight: "8px",
        objectFit: "contain",
      }}
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
    <span>{displayName}</span>
  </div>
);

interface CreateSearchToolProps {
  userRole: string;
  accessToken: string | null;
  onCreateSuccess: (newSearchTool: SearchTool) => void;
  isModalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
}

const CreateSearchTool: React.FC<CreateSearchToolProps> = ({
  userRole,
  accessToken,
  onCreateSuccess,
  isModalVisible,
  setModalVisible,
}) => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [isTestModalVisible, setIsTestModalVisible] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestId, setConnectionTestId] = useState<string>("");

  // Fetch available search providers
  const { data: providersResponse, isLoading: isLoadingProviders } = useQuery({
    queryKey: ["searchProviders"],
    queryFn: () => {
      if (!accessToken) throw new Error("Access Token required");
      return fetchAvailableSearchProviders(accessToken);
    },
    enabled: !!accessToken && isModalVisible,
  }) as { data: { providers: AvailableSearchProvider[] }; isLoading: boolean };

  const availableProviders = providersResponse?.providers || [];

  const handleCreate = async (formValues: Record<string, any>) => {
    setIsLoading(true);
    try {
      // Prepare the payload
      const payload = {
        search_tool_name: formValues.search_tool_name,
        litellm_params: {
          search_provider: formValues.search_provider,
          api_key: formValues.api_key,
          api_base: formValues.api_base,
          timeout: formValues.timeout ? parseFloat(formValues.timeout) : undefined,
          max_retries: formValues.max_retries ? parseInt(formValues.max_retries) : undefined,
        },
        search_tool_info: formValues.description
          ? {
              description: formValues.description,
            }
          : undefined,
      };

      if (accessToken != null) {
        const response = await createSearchTool(accessToken, payload);

        NotificationsManager.success("Ferramenta de busca criada com sucesso");
        form.resetFields();
        setFormValues({});
        setModalVisible(false);
        onCreateSuccess(response);
      }
    } catch (error) {
      NotificationsManager.error("Erro ao criar a ferramenta de busca: " + error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setFormValues({});
    setModalVisible(false);
  };

  const handleTestConnection = async () => {
    try {
      // Validate required fields for testing
      await form.validateFields(["search_provider", "api_key"]);

      setIsTestingConnection(true);
      // Generate a new test ID (using timestamp for uniqueness)
      setConnectionTestId(`test-${Date.now()}`);
      // Show the modal with the fresh test
      setIsTestModalVisible(true);
    } catch (error) {
      NotificationsManager.error("Please fill in Search Provider and API Key before testing");
    }
  };

  // Clear formValues when modal closes to reset
  React.useEffect(() => {
    if (!isModalVisible) {
      setFormValues({});
    }
  }, [isModalVisible]);

  if (!isAdminRole(userRole)) {
    return null;
  }

  return (
    <Modal
      title={
        <div className="flex items-center space-x-3 pb-4 border-b border-gray-100">
          <span className="text-2xl">🔍</span>
          <h2 className="text-xl font-semibold text-gray-900">Adicionar Nova Ferramenta de Busca</h2>
        </div>
      }
      open={isModalVisible}
      width={800}
      onCancel={handleCancel}
      footer={null}
      className="top-8"
      styles={{
        body: { padding: "24px" },
        header: { padding: "24px 24px 0 24px", border: "none" },
      }}
    >
      <div className="mt-6">
        <Form
          form={form}
          onFinish={handleCreate}
          onValuesChange={(_, allValues) => setFormValues(allValues)}
          layout="vertical"
          className="space-y-6"
        >
          <div className="grid grid-cols-1 gap-6">
            <Form.Item
              label={
                <span className="text-sm font-medium text-gray-700 flex items-center">
                  Nome da Ferramenta de Busca
                  <Tooltip title="Um nome único para identificar esta configuração de ferramenta de busca (ex: 'busca-perplexity', 'busca-tavily-noticias').">
                    <InfoCircleOutlined className="ml-2 text-blue-400 hover:text-blue-600 cursor-help" />
                  </Tooltip>
                </span>
              }
              name="search_tool_name"
              rules={[
                { required: true, message: "Por favor, informe um nome para a ferramenta de busca" },
                {
                  pattern: /^[a-zA-Z0-9_-]+$/,
                  message: "O nome só pode conter letras, números, hífens e underscores",
                },
              ]}
            >
              <TextInput
                placeholder="e.g., perplexity-search, my-tavily-tool"
                className="rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </Form.Item>

            <Form.Item
              label={
                <span className="text-sm font-medium text-gray-700 flex items-center">
                  Provedor de Busca
                  <Tooltip title="Selecione o provedor de busca que você deseja usar. Cada provedor possui diferentes capacidades e preços.">
                    <InfoCircleOutlined className="ml-2 text-blue-400 hover:text-blue-600 cursor-help" />
                  </Tooltip>
                </span>
              }
              name="search_provider"
              rules={[{ required: true, message: "Por favor, selecione um provedor de busca" }]}
            >
              <Select
                placeholder="Select a search provider"
                className="rounded-lg"
                size="large"
                loading={isLoadingProviders}
                showSearch
                optionFilterProp="children"
                optionLabelProp="label"
              >
                {availableProviders.map((provider) => (
                  <Select.Option
                    key={provider.provider_name}
                    value={provider.provider_name}
                    label={
                      <SearchProviderLabel
                        providerName={provider.provider_name}
                        displayName={provider.ui_friendly_name}
                      />
                    }
                  >
                    <SearchProviderLabel
                      providerName={provider.provider_name}
                      displayName={provider.ui_friendly_name}
                    />
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label={
                <span className="text-sm font-medium text-gray-700 flex items-center">
                  Chave de API
                  <Tooltip title="A chave de API para autenticação com o provedor de busca. Esta será armazenada com segurança.">
                    <InfoCircleOutlined className="ml-2 text-blue-400 hover:text-blue-600 cursor-help" />
                  </Tooltip>
                </span>
              }
              name="api_key"
              rules={[{ required: false, message: "Por favor, informe uma chave de API" }]}
            >
              <TextInput
                type="password"
                placeholder="Enter your API key"
                className="rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </Form.Item>

            <Form.Item
              label={<span className="text-sm font-medium text-gray-700">Descrição (Opcional)</span>}
              name="description"
            >
              <TextArea
                rows={3}
                placeholder="Brief description of this search tool's purpose"
                className="rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </Form.Item>
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-gray-100">
            <Tooltip title="Obtenha ajuda no nosso github">
              <Typography.Link href="https://github.com/BerriAI/litellm/issues" target="_blank">
                Precisa de Ajuda?
              </Typography.Link>
            </Tooltip>
            <div className="space-x-2">
              <Button onClick={handleTestConnection} loading={isTestingConnection}>
                Testar Conexão
              </Button>
              <Button loading={isLoading} type="submit">
                Adicionar Ferramenta de Busca
              </Button>
            </div>
          </div>
        </Form>
      </div>

      {/* Test Connection Results Modal */}
      <Modal
        title="Resultados do Teste de Conexão"
        open={isTestModalVisible}
        onCancel={() => {
          setIsTestModalVisible(false);
          setIsTestingConnection(false);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setIsTestModalVisible(false);
              setIsTestingConnection(false);
            }}
          >
            Fechar
          </Button>,
        ]}
        width={700}
      >
        {/* Only render the SearchConnectionTest when modal is visible and we have a test ID */}
        {isTestModalVisible && accessToken && (
          <SearchConnectionTest
            key={connectionTestId}
            litellmParams={{
              search_provider: formValues.search_provider,
              api_key: formValues.api_key,
              api_base: formValues.api_base,
            }}
            accessToken={accessToken}
            onTestComplete={() => setIsTestingConnection(false)}
          />
        )}
      </Modal>
    </Modal>
  );
};

export default CreateSearchTool;
