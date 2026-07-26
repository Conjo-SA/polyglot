import React, { useState, useEffect } from "react";
import { Card, Title, Text, Grid, Button as TremorButton, Callout, TextInput, Divider } from "@tremor/react";
import { Form } from "antd";
import { keyCreateCall } from "./networking";
import { CopyToClipboard } from "react-copy-to-clipboard";
import {
  LinkOutlined,
  KeyOutlined,
  CopyOutlined,
  ExclamationCircleOutlined,
  PlusCircleOutlined,
} from "@ant-design/icons";
import { parseErrorMessage } from "./shared/errorUtils";
import NotificationsManager from "./molecules/notifications_manager";

interface SCIMConfigProps {
  accessToken: string | null;
  userID: string | null;
  proxySettings: any;
}

const SCIMConfig: React.FC<SCIMConfigProps> = ({ accessToken, userID, proxySettings }) => {
  const [form] = Form.useForm();
  const [isCreatingToken, setIsCreatingToken] = useState(false);
  const [tokenData, setTokenData] = useState<any>(null);
  const [baseUrl, setBaseUrl] = useState("<your_proxy_base_url>");

  useEffect(() => {
    let url = "<your_proxy_base_url>";

    if (proxySettings && proxySettings.PROXY_BASE_URL && proxySettings.PROXY_BASE_URL !== undefined) {
      url = proxySettings.PROXY_BASE_URL;
    } else if (typeof window !== "undefined") {
      // Use the current origin as the base URL if no proxy URL is set
      url = window.location.origin;
    }

    setBaseUrl(url);
  }, [proxySettings]);

  const scimBaseUrl = `${baseUrl}/scim/v2`;

  const handleCreateSCIMToken = async (values: any) => {
    if (!accessToken || !userID) {
      NotificationsManager.fromBackend("You need to be logged in to create a SCIM token");
      return;
    }

    try {
      setIsCreatingToken(true);

      const formData = {
        key_alias: values.key_alias || "SCIM Access Token",
        team_id: null,
        models: [],
        allowed_routes: ["/scim/*"],
      };

      const response = await keyCreateCall(accessToken, userID, formData);
      setTokenData(response);
      NotificationsManager.success("SCIM token created successfully");
    } catch (error: any) {
      console.error("Error creating SCIM token:", error);
      NotificationsManager.fromBackend("Failed to create SCIM token: " + parseErrorMessage(error));
    } finally {
      setIsCreatingToken(false);
    }
  };

  return (
    <Grid numItems={1}>
      <Card>
        <div className="flex items-center mb-4">
          <Title>Configuração SCIM</Title>
        </div>
        <Text className="text-gray-600">
          Sistema para Gerenciamento de Identidade entre Domínios (SCIM) permite que você provisione e gerencie
          automaticamente usuários e grupos no Polyglot.
        </Text>

        <Divider />

        <div className="space-y-8">
          {/* Step 1: SCIM URL */}
          <div>
            <div className="flex items-center mb-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 mr-2">
                1
              </div>
              <Title className="text-lg flex items-center">
                <LinkOutlined className="h-5 w-5 mr-2" />
                SCIM Tenant URL
              </Title>
            </div>
            <Text className="text-gray-600 mb-3">
              Use esta URL nas configurações de integração SCIM do seu provedor de identidade.
            </Text>
            <div className="flex items-center">
              <TextInput value={scimBaseUrl} disabled={true} className="grow" />
              <CopyToClipboard
                text={scimBaseUrl}
                onCopy={() => NotificationsManager.success("URL copied to clipboard")}
              >
                <TremorButton variant="primary" className="ml-2 flex items-center">
                  <CopyOutlined className="h-4 w-4 mr-1" />
                  Copy
                </TremorButton>
              </CopyToClipboard>
            </div>
          </div>

          {/* Step 2: SCIM Token */}
          <div>
            <div className="flex items-center mb-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 mr-2">
                2
              </div>
              <Title className="text-lg flex items-center">
                <KeyOutlined className="h-5 w-5 mr-2" />
                Authentication Token
              </Title>
            </div>

            <Callout title="Utilizando SCIM" color="blue" className="mb-4">
              Você precisa de um token SCIM para se autenticar com a API SCIM. Crie um abaixo e use-o na configuração do seu
              provedor SCIM.
            </Callout>

            {!tokenData ? (
              <div className="bg-gray-50 p-4 rounded-lg">
                <Form form={form} onFinish={handleCreateSCIMToken} layout="vertical">
                  <Form.Item
                    name="key_alias"
                    label="Nome do Token"
                    rules={[{ required: true, message: "Por favor, informe um nome para seu token" }]}
                  >
                    <TextInput placeholder="Token de Acesso SCIM" />
                  </Form.Item>
                  <Form.Item>
                    <TremorButton
                      variant="primary"
                      type="submit"
                      loading={isCreatingToken}
                      className="flex items-center"
                    >
                      <KeyOutlined className="h-4 w-4 mr-1" />
                      Criar Token SCIM
                    </TremorButton>
                  </Form.Item>
                </Form>
              </div>
            ) : (
              <Card className="border border-yellow-300 bg-yellow-50">
                <div className="flex items-center mb-2 text-yellow-800">
                  <ExclamationCircleOutlined className="h-5 w-5 mr-2" />
                  <Title className="text-lg text-yellow-800">Your SCIM Token</Title>
                </div>
                <Text className="text-yellow-800 mb-4 font-medium">
                  Certifique-se de copiar este token agora. Você não conseguirá vê-lo novamente.
                </Text>
                <div className="flex items-center">
                  <TextInput value={tokenData.key} className="grow mr-2 bg-white" type="password" disabled={true} />
                  <CopyToClipboard
                    text={tokenData.key}
                    onCopy={() => NotificationsManager.success("Token copied to clipboard")}
                  >
                    <TremorButton variant="primary" className="flex items-center">
                      <CopyOutlined className="h-4 w-4 mr-1" />
                      Copy
                    </TremorButton>
                  </CopyToClipboard>
                </div>
                <TremorButton className="mt-4 flex items-center" variant="secondary" onClick={() => setTokenData(null)}>
                  <PlusCircleOutlined className="h-4 w-4 mr-1" />
                  Criar Outro Token
                </TremorButton>
              </Card>
            )}
          </div>
        </div>
      </Card>
    </Grid>
  );
};

export default SCIMConfig;
