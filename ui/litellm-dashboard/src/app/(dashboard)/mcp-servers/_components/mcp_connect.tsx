/* eslint-disable react/no-unescaped-entities */

import React, { useState } from "react";
import { Card, Typography, Space, Alert, Button, Switch, Form, Collapse } from "antd";
import { TabPanel, TabPanels, TabGroup, TabList, Tab, Title as TremorTitle, Text as TremorText } from "@tremor/react";
import { CopyIcon, Code, Terminal, Globe, CheckIcon, ExternalLinkIcon, KeyIcon, ServerIcon, Zap } from "lucide-react";
import { getProxyBaseUrl } from "@/components/networking";
import { copyToClipboard as utilCopyToClipboard } from "@/utils/dataUtils";

const { Title, Text } = Typography;
const { Panel } = Collapse;

interface CodeBlockProps {
  code: string;
  title?: string;
  copyKey: string;
  className?: string;
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
  serverName?: string;
  accessGroups?: string[];
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  children,
  serverName,
  accessGroups = ["dev-group"],
}) => {
  const [useServerHeader, setUseServerHeader] = useState(false);

  const getHeadersConfig = () => {
    const headers: Record<string, any> = {
      "x-litellm-api-key": "Bearer YOUR_LITELLM_API_KEY",
    };
    if (useServerHeader && serverName) {
      const formattedServerName = serverName.replace(/\s+/g, "_");
      // Include both server name and access groups in the same header (comma-separated string)
      const serverAndGroups = [formattedServerName, ...accessGroups].join(",");
      headers["x-mcp-servers"] = serverAndGroups;
    }
    return headers;
  };

  return (
    <Card className="border border-gray-200">
      <div className="flex items-center gap-3 mb-3">
        <span className="p-2 rounded-lg bg-gray-50">{icon}</span>
        <div>
          <Title level={5} className="mb-0">
            {title}
          </Title>
          <Text className="text-gray-600">{description}</Text>
        </div>
      </div>
      {serverName && (title === "Implementation Example" || title === "Configuration") && (
        <Form.Item className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Switch size="small" checked={useServerHeader} onChange={setUseServerHeader} />
            <Text className="text-sm">
              Limite ferramentas para servidores MCP específicos ou grupos MCP passando o header <code>x-mcp-servers</code>
            </Text>
          </div>
          {useServerHeader && (
            <Alert
              className="mt-2"
              type="info"
              showIcon
              message="Duas Opções"
              description={
                <div>
                  <p>
                    <strong>Opção 1:</strong> Obter um servidor específico: <code>"{serverName.replace(/\s+/g, "_")}"</code>
                  </p>
                  <p>
                    <strong>Opção 2:</strong> Obter um grupo de MCPs: <code>"dev-group"</code>
                  </p>
                  <p className="mt-2 text-sm text-gray-600">
                    Você também pode combinar ambas: <code>"Server1,dev-group"</code>
                  </p>
                </div>
              }
            />
          )}
        </Form.Item>
      )}
      {React.Children.map(children, (child) => {
        if (
          React.isValidElement<CodeBlockProps>(child) &&
          child.props.hasOwnProperty("code") &&
          child.props.hasOwnProperty("copyKey")
        ) {
          const code = child.props.code;
          if (code && code.includes('"headers":')) {
            return React.cloneElement(child, {
              code: code.replace(/"headers":\s*{[^}]*}/, `"headers": ${JSON.stringify(getHeadersConfig(), null, 8)}`),
            });
          }
        }
        return child;
      })}
    </Card>
  );
};

interface MCPConnectProps {
  currentServerAccessGroups?: string[];
}

const MCPConnect: React.FC<MCPConnectProps> = ({ currentServerAccessGroups = [] }) => {
  const proxyBaseUrl = getProxyBaseUrl();
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [serverHeaders, setServerHeaders] = useState<Record<string, string[]>>({
    openai: [],
    litellm: [],
    cursor: [],
    http: [],
  });
  const [currentServer] = useState("Zapier_MCP"); // This should match the current server being viewed

  const copyToClipboard = async (text: string, key: string) => {
    const success = await utilCopyToClipboard(text);
    if (success) {
      setCopiedStates((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [key]: false }));
      }, 2000);
    }
  };

  const getHeadersConfig = (type: string) => {
    const headers: Record<string, any> = {
      "x-litellm-api-key": "Bearer YOUR_LITELLM_API_KEY",
    };

    if (serverHeaders[type]?.length > 0) {
      // Format server names (replace spaces with underscores)
      const formattedServers = serverHeaders[type].map((s) => s.replace(/\s+/g, "_"));

      // Use comma-separated string (can include both servers and access groups)
      headers["x-mcp-servers"] = formattedServers.join(",");
    }

    return headers;
  };

  const CodeBlock: React.FC<{
    code: string;
    copyKey: string;
    title?: string;
    className?: string;
  }> = ({ code, copyKey, title, className = "" }) => (
    <div className="relative group">
      {title && (
        <div className="flex items-center gap-2 mb-2">
          <Code size={16} className="text-blue-600" />
          <Text strong className="text-gray-700">
            {title}
          </Text>
        </div>
      )}
      <Card className={`bg-gray-50 border border-gray-200 relative ${className}`}>
        <Button
          type="text"
          size="small"
          icon={copiedStates[copyKey] ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
          onClick={() => copyToClipboard(code, copyKey)}
          className={`absolute top-2 right-2 z-10 transition-all duration-200 ${
            copiedStates[copyKey]
              ? "text-green-600 bg-green-50 border-green-200"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          }`}
        />
        <pre className="text-sm overflow-x-auto pr-10 text-gray-800 font-mono leading-relaxed">{code}</pre>
      </Card>
    </div>
  );

  const StepCard: React.FC<{
    step: number;
    title: string;
    children: React.ReactNode;
  }> = ({ step, title, children }) => (
    <div className="flex gap-4">
      <div className="shrink-0">
        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
          {step}
        </div>
      </div>
      <div className="flex-1">
        <Text strong className="text-gray-800 block mb-2">
          {title}
        </Text>
        {children}
      </div>
    </div>
  );

  const LiteLLMProxyTab = () => (
    <Space direction="vertical" size="large" className="w-full">
      <div className="bg-linear-to-r from-emerald-50 to-green-50 p-6 rounded-lg border border-emerald-100">
        <div className="flex items-center gap-3 mb-3">
          <Zap className="text-emerald-600" size={24} />
          <Title level={4} className="mb-0 text-emerald-900">
            Integração com API do Polyglot Proxy
          </Title>
        </div>
        <Text className="text-emerald-700">
          Conecte-se à API de Respostas do Polyglot Proxy para integração perfeita de ferramentas com múltiplos provedores de modelos
        </Text>
      </div>

      <Space direction="vertical" size="large" className="w-full">
        <FeatureCard
          icon={<KeyIcon className="text-emerald-600" size={16} />}
          title="Configuração da Chave Virtual"
          description="Configure sua chave virtual do Polyglot Proxy para autenticação"
        >
          <Space direction="vertical" size="middle" className="w-full">
            <div>
              <Text>Obtenha sua chave virtual no painel do Polyglot Proxy ou entre em contato com seu administrador</Text>
            </div>
            <CodeBlock title="Variável de Ambiente" code='export LITELLM_API_KEY="sk-..."' copyKey="litellm-env" />
          </Space>
        </FeatureCard>

        <FeatureCard
          icon={<ServerIcon className="text-emerald-600" size={16} />}
          title="Informações do Servidor MCP"
          description="Detalhes de conexão para seu servidor Polyglot MCP"
        >
          <CodeBlock title="URL do Servidor" code={`${proxyBaseUrl}/mcp`} copyKey="litellm-server-url" />
        </FeatureCard>

        <FeatureCard
          icon={<Code className="text-emerald-600" size={16} />}
          title="Exemplo de Implementação"
          description="Exemplo completo de cURL para usar a API de Respostas do Polyglot Proxy"
          serverName={currentServer}
          accessGroups={["dev-group"]}
        >
          <CodeBlock
            code={`curl --location '${proxyBaseUrl}/v1/responses' \\
--header 'Content-Type: application/json' \\
--header "Authorization: Bearer $LITELLM_VIRTUAL_KEY" \\
--data '{
    "model": "gpt-4",
    "tools": [
        {
            "type": "mcp",
            "server_label": "litellm",
            "server_url": "litellm_proxy",
            "require_approval": "never",
            "headers": {
                "x-litellm-api-key": "Bearer YOUR_LITELLM_VIRTUAL_KEY",
                "x-mcp-servers": "Zapier_MCP,dev-group"
            }
        }
    ],
    "input": "Executar ferramentas disponíveis",
    "tool_choice": "required"
}'`}
            copyKey="litellm-curl"
            className="text-xs"
          />
        </FeatureCard>
      </Space>
    </Space>
  );

  const OpenAITab = () => (
    <Space direction="vertical" size="large" className="w-full">
      <div className="bg-linear-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-100">
        <div className="flex items-center gap-3 mb-3">
          <Code className="text-blue-600" size={24} />
          <Title level={4} className="mb-0 text-blue-900">
            Integração com API de Respostas do OpenAI
          </Title>
        </div>
        <Text className="text-blue-700">
          Conecte a API de Respostas do OpenAI ao seu servidor Polyglot MCP para integração perfeita de ferramentas
        </Text>
      </div>

      <Space direction="vertical" size="large" className="w-full">
        <FeatureCard
          icon={<KeyIcon className="text-blue-600" size={16} />}
          title="Configuração da Chave da API"
          description="Configure sua chave da API do OpenAI para autenticação"
        >
          <Space direction="vertical" size="middle" className="w-full">
            <div>
              {/* eslint-disable-next-line react/no-unescaped-entities */}
              <Text>
                Obtenha sua chave da API no{" "}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                >
                  plataforma OpenAI <ExternalLinkIcon size={12} />
                </a>
              </Text>
            </div>
            <CodeBlock title="Variável de Ambiente" code='export OPENAI_API_KEY="sk-..."' copyKey="openai-env" />
          </Space>
        </FeatureCard>

        <FeatureCard
          icon={<ServerIcon className="text-blue-600" size={16} />}
          title="Informações do Servidor MCP"
          description="Detalhes de conexão para seu servidor Polyglot MCP"
        >
          <CodeBlock title="URL do Servidor" code={`${proxyBaseUrl}/mcp`} copyKey="openai-server-url" />
        </FeatureCard>

        <FeatureCard
          icon={<Code className="text-blue-600" size={16} />}
          title="Exemplo de Implementação"
          description="Exemplo completo de cURL para usar a API de Respostas"
          serverName="Zapier Gmail"
          accessGroups={["dev-group"]}
        >
          <CodeBlock
            code={`curl --location 'https://api.openai.com/v1/responses' \\
--header 'Content-Type: application/json' \\
--header "Authorization: Bearer $OPENAI_API_KEY" \\
--data '{
    "model": "gpt-4.1",
    "tools": [
        {
            "type": "mcp",
            "server_label": "litellm",
            "server_url": "${proxyBaseUrl}/mcp",
            "require_approval": "never",
            "headers": {
                "x-litellm-api-key": "Bearer YOUR_LITELLM_API_KEY",
                "x-mcp-servers": "Zapier_MCP,dev-group"
            }
        }
    ],
    "input": "Executar ferramentas disponíveis",
    "tool_choice": "required"
}'`}
            copyKey="openai-curl"
            className="text-xs"
          />
        </FeatureCard>
      </Space>
    </Space>
  );

  const CursorTab = () => (
    <Space direction="vertical" size="large" className="w-full">
      <div className="bg-linear-to-r from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-100">
        <div className="flex items-center gap-3 mb-3">
          <Terminal className="text-purple-600" size={24} />
          <Title level={4} className="mb-0 text-purple-900">
            Integração com IDE Cursor
          </Title>
        </div>
        <Text className="text-purple-700">
          Use ferramentas diretamente do IDE Cursor com Polyglot MCP. Permita que seu assistente inteligente realize tarefas do mundo real
          sem sair do seu ambiente de codificação.
        </Text>
      </div>

      <Card className="border border-gray-200">
        <Title level={5} className="mb-4 text-gray-800">
          Instruções de Configuração
        </Title>
        <Space direction="vertical" size="large" className="w-full">
          <StepCard step={1} title="Open Cursor Settings">
            <Text className="text-gray-600">
              Use o atalho de teclado <code className="bg-gray-100 px-2 py-1 rounded-sm">⇧+⌘+J</code> (Mac) ou{" "}
              <code className="bg-gray-100 px-2 py-1 rounded-sm">Ctrl+Shift+J</code> (Windows/Linux)
            </Text>
          </StepCard>

          <StepCard step={2} title="Navigate to MCP Tools">
            <Text className="text-gray-600">Acesse a aba "Ferramentas MCP" e clique em "Novo Servidor MCP"</Text>
          </StepCard>

          <StepCard step={3} title="Add Configuration">
            <Text className="text-gray-600 mb-3">
              Copie a configuração JSON abaixo e cole no Cursor, depois salve com{" "}
              <code className="bg-gray-100 px-2 py-1 rounded-sm">Cmd+S</code> ou{" "}
              <code className="bg-gray-100 px-2 py-1 rounded-sm">Ctrl+S</code>
            </Text>
            <FeatureCard
              icon={<Code className="text-purple-600" size={16} />}
              title="Configuração"
              description="Configuração do Cursor MCP"
              serverName="Zapier Gmail"
              accessGroups={["dev-group"]}
            >
              <CodeBlock
                code={`{
  "mcpServers": {
    "Zapier_MCP": {
      "url": "${proxyBaseUrl}/mcp",
      "headers": {
        "x-litellm-api-key": "Bearer YOUR_LITELLM_API_KEY",
        "x-mcp-servers": "Zapier_MCP,dev-group"
      }
    }
  }
}`}
                copyKey="cursor-config"
                className="text-xs"
              />
            </FeatureCard>
          </StepCard>
        </Space>
      </Card>
    </Space>
  );

  const StreamableHTTPTab = () => (
    <Space direction="vertical" size="large" className="w-full">
      <div className="bg-linear-to-r from-green-50 to-teal-50 p-6 rounded-lg border border-green-100">
        <div className="flex items-center gap-3 mb-3">
          <Globe className="text-green-600" size={24} />
          <Title level={4} className="mb-0 text-green-900">
            Transporte HTTP Streamable
          </Title>
        </div>
        <Text className="text-green-700">
          Conecte-se ao Polyglot MCP usando transporte HTTP. Compatível com qualquer cliente MCP que suporte streaming HTTP.
        </Text>
      </div>

      <FeatureCard
        icon={<Globe className="text-green-600" size={16} />}
        title="Conexão Universal MCP"
        description="Use esta URL com qualquer cliente MCP que suporte transporte HTTP"
      >
        <Space direction="vertical" size="middle" className="w-full">
          <div>
            <Text>
              Cada cliente MCP suporta diferentes transportes. Consulte a documentação do seu cliente para determinar o
              método de transporte apropriado.
            </Text>
          </div>
          <CodeBlock title="URL do Servidor" code={`${proxyBaseUrl}/mcp`} copyKey="http-server-url" />
          <CodeBlock
            title="Configuração de Headers"
            code={JSON.stringify(
              {
                "x-litellm-api-key": "Bearer YOUR_LITELLM_API_KEY",
              },
              null,
              2,
            )}
            copyKey="http-headers"
          />
          <div className="mt-4">
            <Button
              type="link"
              className="p-0 h-auto text-blue-600 hover:text-blue-700"
              href="https://modelcontextprotocol.io/docs/concepts/transports"
              icon={<ExternalLinkIcon size={14} />}
            >
              Saiba mais sobre transportes MCP
            </Button>
          </div>
        </Space>
      </FeatureCard>
    </Space>
  );

  return (
    <div>
      <Space direction="vertical" size="large" className="w-full">
        <div>
          <TremorTitle className="text-3xl font-bold text-gray-900 mb-3">Conecte-se ao seu cliente MCP</TremorTitle>
          <TremorText className="text-lg text-gray-600">
            Use ferramentas diretamente de qualquer cliente MCP com Polyglot MCP. Permita que seu assistente inteligente realize tarefas do mundo real
            através de uma conexão simples e segura.
          </TremorText>
        </div>

        <TabGroup className="w-full">
          <TabList className="flex justify-start mt-8 mb-6">
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <Tab className="px-6 py-3 rounded-md transition-all duration-200">
                <span className="flex items-center gap-2 font-medium">
                  <Code size={18} />
                  API do OpenAI
                </span>
              </Tab>
              <Tab className="px-6 py-3 rounded-md transition-all duration-200">
                <span className="flex items-center gap-2 font-medium">
                  <Zap size={18} />
                  Polyglot Proxy
                </span>
              </Tab>
              <Tab className="px-6 py-3 rounded-md transition-all duration-200">
                <span className="flex items-center gap-2 font-medium">
                  <Terminal size={18} />
                  Cursor
                </span>
              </Tab>
              <Tab className="px-6 py-3 rounded-md transition-all duration-200">
                <span className="flex items-center gap-2 font-medium">
                  <Globe size={18} />
                  HTTP Streamable
                </span>
              </Tab>
            </div>
          </TabList>
          <TabPanels>
            <TabPanel className="mt-6">
              <OpenAITab />
            </TabPanel>
            <TabPanel className="mt-6">
              <LiteLLMProxyTab />
            </TabPanel>
            <TabPanel className="mt-6">
              <CursorTab />
            </TabPanel>
            <TabPanel className="mt-6">
              <StreamableHTTPTab />
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </Space>
    </div>
  );
};

export default MCPConnect;
