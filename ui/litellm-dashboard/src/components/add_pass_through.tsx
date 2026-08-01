/**
 * Modal to add fallbacks to the proxy router config
 */

import React, { useState } from "react";
import { Button, TextInput, Switch } from "@tremor/react";
import { Card, Title, Subtitle } from "@tremor/react";
import { createPassThroughEndpoint } from "./networking";
import { Modal, Form, Select as Select2, Tooltip, Alert } from "antd";
import NumericalInput from "./shared/numerical_input";
import { InfoCircleOutlined, ApiOutlined } from "@ant-design/icons";
import KeyValueInput from "./key_value_input";
import QueryParamInput from "./query_param_input";
import { passThroughItem } from "./PassThroughSettings/PassThroughSettings";
import RoutePreview from "./route_preview";
import NotificationsManager from "./molecules/notifications_manager";
import PassThroughSecuritySection from "./common_components/PassThroughSecuritySection";
import PassThroughGuardrailsSection from "./common_components/PassThroughGuardrailsSection";
const { Option } = Select2;

const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"];

interface AddFallbacksProps {
  //   models: string[] | undefined;
  accessToken: string;
  passThroughItems: passThroughItem[];
  setPassThroughItems: React.Dispatch<React.SetStateAction<passThroughItem[]>>;
  premiumUser?: boolean;
}

const AddPassThroughEndpoint: React.FC<AddFallbacksProps> = ({
  accessToken,
  setPassThroughItems,
  passThroughItems,
  premiumUser = false,
}) => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("");
  const [pathValue, setPathValue] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [includeSubpath, setIncludeSubpath] = useState(true);
  const [authEnabled, setAuthEnabled] = useState(false);
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);
  const [guardrails, setGuardrails] = useState<
    Record<string, { request_fields?: string[]; response_fields?: string[] } | null>
  >({});
  const handleCancel = () => {
    form.resetFields();
    setPathValue("");
    setTargetValue("");
    setIncludeSubpath(true);
    setSelectedMethods([]);
    setGuardrails({});
    setIsModalVisible(false);
  };

  const handlePathChange = (value: string) => {
    // Auto-add leading slash if missing
    let formattedPath = value;
    if (value && !value.startsWith("/")) {
      formattedPath = "/" + value;
    }
    setPathValue(formattedPath);
    form.setFieldsValue({ path: formattedPath });
  };

  const addPassThrough = async (formValues: Record<string, any>) => {
    setIsLoading(true);
    try {
      // Remove auth field if not premium user
      if (!premiumUser && "auth" in formValues) {
        delete formValues.auth;
      }

      // Add guardrails to formValues (only if not empty)
      if (guardrails && Object.keys(guardrails).length > 0) {
        formValues.guardrails = guardrails;
      }

      // Add methods to formValues (only if specific methods are selected)
      if (selectedMethods && selectedMethods.length > 0) {
        formValues.methods = selectedMethods;
      }

      const response = await createPassThroughEndpoint(accessToken, formValues);

      // Use the created endpoint from the API response (includes the generated ID)
      const createdEndpoint = response.endpoints[0];

      const updatedPassThroughSettings = [...passThroughItems, createdEndpoint];
      setPassThroughItems(updatedPassThroughSettings);

      NotificationsManager.success("Endpoint pass-through criado com sucesso");
      form.resetFields();
      setPathValue("");
      setTargetValue("");
      setIncludeSubpath(true);
      setSelectedMethods([]);
      setGuardrails({});
      setIsModalVisible(false);
    } catch (error) {
      NotificationsManager.fromBackend("Erro ao criar endpoint pass-through: " + error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    NotificationsManager.success("Copiado para a área de transferência!");
  };

  return (
    <div>
      <Button className="mx-auto mb-4 mt-4" onClick={() => setIsModalVisible(true)}>
        + Adicionar Endpoint Pass-Through
      </Button>
      <Modal
        title={
          <div className="flex items-center space-x-3 pb-4 border-b border-gray-100">
            <ApiOutlined className="text-xl text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900">Adicionar Endpoint Pass-Through</h2>
          </div>
        }
        open={isModalVisible}
        width={1000}
        onCancel={handleCancel}
        footer={null}
        className="top-8"
        styles={{
          body: { padding: "24px" },
          header: { padding: "24px 24px 0 24px", border: "none" },
        }}
      >
        <div className="mt-6">
          <Alert
            message="O que é um Endpoint Pass-Through?"
            description="Encaminhe requisições do seu proxy Polyglot para qualquer API externa. Ideal para modelos personalizados, APIs de geração de imagens ou qualquer serviço que você queira acessar via Polyglot."
            type="info"
            showIcon
            className="mb-6"
          />

          <Form
            form={form}
            onFinish={addPassThrough}
            layout="vertical"
            className="space-y-6"
            initialValues={{
              include_subpath: true,
              path: pathValue,
              target: targetValue,
            }}
          >
            {/* Route Configuration Section */}
            <Card className="p-5">
              <Title className="text-lg font-semibold text-gray-900 mb-2">Configuração da Rota</Title>
              <Subtitle className="text-gray-600 mb-5">
                Configure como as requisições ao seu domínio serão encaminhadas para a API de destino
              </Subtitle>

              <div className="space-y-5">
                <Form.Item
                  label={<span className="text-sm font-medium text-gray-700">Prefixo do Caminho</span>}
                  name="path"
                  rules={[{ required: true, message: "Caminho é obrigatório", pattern: /^\// }]}
                  extra={
                    <div className="text-xs text-gray-500 mt-1">Exemplo: /bria, /adobe-photoshop, /elasticsearch</div>
                  }
                  className="mb-4"
                >
                  <div className="flex items-center">
                    <TextInput
                      placeholder="bria"
                      value={pathValue}
                      onChange={(e) => handlePathChange(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </Form.Item>

                <Form.Item
                  label={<span className="text-sm font-medium text-gray-700">URL de Destino</span>}
                  name="target"
                  rules={[
                    { required: true, message: "URL de destino é obrigatória" },
                    { type: "url", message: "Digite uma URL válida" },
                  ]}
                  extra={<div className="text-xs text-gray-500 mt-1">Exemplo: https://engine.prod.bria-api.com</div>}
                  className="mb-4"
                >
                  <TextInput
                    placeholder="https://engine.prod.bria-api.com"
                    value={targetValue}
                    onChange={(e) => {
                      setTargetValue(e.target.value);
                      form.setFieldsValue({ target: e.target.value });
                    }}
                  />
                </Form.Item>

                <Form.Item
                  label={
                    <span className="text-sm font-medium text-gray-700 flex items-center">
                      Métodos HTTP (Opcional)
                      <Tooltip title="Selecione métodos HTTP específicos. Deixe vazio para suportar todos os métodos (GET, POST, PUT, DELETE, PATCH). Útil quando o mesmo caminho precisa de destinos diferentes para métodos diferentes.">
                        <InfoCircleOutlined className="ml-2 text-blue-400 hover:text-blue-600 cursor-help" />
                      </Tooltip>
                    </span>
                  }
                  name="methods"
                  extra={
                    <div className="text-xs text-gray-500 mt-1">
                      {selectedMethods.length === 0
                        ? "Todos os métodos HTTP suportados (padrão)"
                        : `Apenas requisições ${selectedMethods.join(", ")} serão roteadas para este endpoint`}
                    </div>
                  }
                  className="mb-4"
                >
                  <Select2
                    mode="multiple"
                    placeholder="Selecione métodos (deixe vazio para todos)"
                    value={selectedMethods}
                    onChange={setSelectedMethods}
                    allowClear
                    style={{ width: "100%" }}
                  >
                    {HTTP_METHODS.map((method) => (
                      <Option key={method} value={method}>
                        {method}
                      </Option>
                    ))}
                  </Select2>
                </Form.Item>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-sm font-medium text-gray-700">Incluir Subcaminhos</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Encaminhe todos os subcaminhos para a API de destino (recomendado para APIs REST)
                    </div>
                  </div>
                  <Form.Item name="include_subpath" valuePropName="checked" className="mb-0">
                    <Switch checked={includeSubpath} onChange={setIncludeSubpath} />
                  </Form.Item>
                </div>
              </div>
            </Card>

            {/* Route Preview Section */}
            <RoutePreview pathValue={pathValue} targetValue={targetValue} includeSubpath={includeSubpath} />

            {/* Headers Section */}
            <Card className="p-6">
              <Title className="text-lg font-semibold text-gray-900 mb-2">Cabeçalhos</Title>
              <Subtitle className="text-gray-600 mb-6">
                Adicione cabeçalhos que serão enviados em cada requisição para a API de destino
              </Subtitle>

              <Form.Item
                label={
                  <span className="text-sm font-medium text-gray-700 flex items-center">
                    Cabeçalhos de Autenticação
                    <Tooltip title="Autenticação e outros cabeçalhos a serem encaminhados com as requisições">
                      <InfoCircleOutlined className="ml-2 text-blue-400 hover:text-blue-600 cursor-help" />
                    </Tooltip>
                  </span>
                }
                name="headers"
                rules={[{ required: true, message: "Configure os cabeçalhos" }]}
                extra={
                  <div className="text-xs text-gray-500 mt-2">
                    <div className="font-medium mb-1">Adicione tokens de autenticação e outros cabeçalhos obrigatórios</div>
                    <div>Exemplos comuns: auth_token, Authorization, x-api-key</div>
                  </div>
                }
              >
                <KeyValueInput />
              </Form.Item>
            </Card>

            {/* Default Query Parameters Section */}
            <Card className="p-6">
              <Title className="text-lg font-semibold text-gray-900 mb-2">Parâmetros de Query Padrão</Title>
              <Subtitle className="text-gray-600 mb-6">
                Adicione parâmetros de query que serão enviados automaticamente em cada requisição para a API de destino
              </Subtitle>

              <Form.Item
                label={
                  <span className="text-sm font-medium text-gray-700 flex items-center">
                    Parâmetros de Query Padrão (Opcional)
                    <Tooltip title="Parâmetros de query que serão adicionados a todas as requisições. Clientes podem sobrescrevê-los fornecendo seus próprios valores.">
                      <InfoCircleOutlined className="ml-2 text-blue-400 hover:text-blue-600 cursor-help" />
                    </Tooltip>
                  </span>
                }
                name="default_query_params"
                extra={
                  <div className="text-xs text-gray-500 mt-2">
                    <div className="font-medium mb-1">Parâmetros são enviados com todas as requisições GET, POST, PUT, PATCH</div>
                    <div>Parâmetros do cliente sobrescrevem os padrões. Exemplos: version=v1, format=json, key=default</div>
                  </div>
                }
              >
                <QueryParamInput />
              </Form.Item>
            </Card>

            {/* Security Section */}
            <PassThroughSecuritySection
              premiumUser={premiumUser}
              authEnabled={authEnabled}
              onAuthChange={(checked) => {
                setAuthEnabled(checked);
                form.setFieldsValue({ auth: checked });
              }}
            />

            {/* Guardrails Section */}
            <PassThroughGuardrailsSection accessToken={accessToken} value={guardrails} onChange={setGuardrails} />

            {/* Performance Section */}
            <Card className="p-6">
              <Title className="text-lg font-semibold text-gray-900 mb-2">Performance</Title>
              <Subtitle className="text-gray-600 mb-6">Configure o timeout de requisições upstream para este endpoint</Subtitle>

              <Form.Item
                label={
                  <span className="text-sm font-medium text-gray-700 flex items-center">
                    Timeout da Requisição (segundos)
                    <Tooltip title="Tempo máximo para aguardar a resposta da API upstream. Deixe vazio para usar general_settings.pass_through_request_timeout (padrão 600s).">
                      <InfoCircleOutlined className="ml-2 text-gray-400 hover:text-gray-600" />
                    </Tooltip>
                  </span>
                }
                name="timeout"
                extra={
                  <div className="text-xs text-gray-500 mt-2">
                    Use um valor maior para APIs upstream lentas (ex.: 1200 para chamadas longas de LLM)
                  </div>
                }
              >
                <NumericalInput min={1} step={1} precision={0} placeholder="600" size="large" />
              </Form.Item>
            </Card>

            {/* Billing Section */}
            <Card className="p-6">
              <Title className="text-lg font-semibold text-gray-900 mb-2">Faturamento</Title>
              <Subtitle className="text-gray-600 mb-6">Rastreamento opcional de custos para este endpoint</Subtitle>

              <Form.Item
                label={
                  <span className="text-sm font-medium text-gray-700 flex items-center">
                    Custo por Requisição (BRL)
                    <Tooltip title="Opcional: rastreie custos das requisições para este endpoint">
                      <InfoCircleOutlined className="ml-2 text-gray-400 hover:text-gray-600" />
                    </Tooltip>
                  </span>
                }
                name="cost_per_request"
                extra={
                  <div className="text-xs text-gray-500 mt-2">
                    Custo cobrado por cada requisição através deste endpoint
                  </div>
                }
              >
                <NumericalInput min={0} step={0.001} precision={4} placeholder="2.0000" size="large" />
              </Form.Item>
            </Card>

            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-100">
              <Button variant="secondary" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                loading={isLoading}
                onClick={() => {
                  form.submit();
                }}
              >
                {isLoading ? "Criando..." : "Adicionar Endpoint Pass-Through"}
              </Button>
            </div>
          </Form>
        </div>
      </Modal>
    </div>
  );
};

export default AddPassThroughEndpoint;
