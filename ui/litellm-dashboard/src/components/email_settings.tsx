import React from "react";
import { Card, Text, Grid, Button, TextInput, TableCell } from "@tremor/react";
import { Typography } from "antd";
import NotificationManager from "./molecules/notifications_manager";
import { serviceHealthCheck, setCallbacksCall } from "./networking";
import { EmailEventSettings } from "./email_events";

const { Title } = Typography;

interface EmailSettingsProps {
  accessToken: string | null;
  premiumUser: boolean;
  alerts: any[];
}

const EmailSettings: React.FC<EmailSettingsProps> = ({ accessToken, premiumUser, alerts }) => {
  const handleSaveEmailSettings = async () => {
    if (!accessToken) {
      return;
    }

    let updatedVariables: Record<string, string> = {};

    alerts
      .filter((alert) => alert.name === "email")
      .forEach((alert) => {
        Object.entries(alert.variables ?? {}).forEach(([key, value]) => {
          const inputElement = document.querySelector(`input[name="${key}"]`) as HTMLInputElement;
          if (inputElement && inputElement.value) {
            updatedVariables[key] = inputElement?.value;
          }
        });
      });

    //filter out null / undefined values for updatedVariables

    const payload = {
      general_settings: {
        alerting: ["email"],
      },
      environment_variables: updatedVariables,
    };
    try {
      await setCallbacksCall(accessToken, payload);
      NotificationManager.success("Configurações de e-mail atualizadas com sucesso");
    } catch (error) {
      NotificationManager.fromBackend(error);
    }
  };

  return (
    <>
      <div className="mt-6 mb-6">
        <EmailEventSettings accessToken={accessToken} />
      </div>
      <Card>
        <Title level={4}>Configurações do Servidor de E-mail</Title>
        <Text>
          <a href="https://docs.litellm.ai/docs/proxy/email" target="_blank" style={{ color: "blue" }}>
            {" "}
            Documentação Polyglot: alertas por e-mail
          </a>{" "}
          <br />
        </Text>

        <div className="flex w-full">
          {alerts
            .filter((alert) => alert.name === "email")
            .map((alert, index) => (
              <TableCell key={index}>
                <ul>
                  <Grid numItems={2}>
                    {Object.entries(alert.variables ?? {}).map(([key, value]) => (
                      <li key={key} className="mx-2 my-2">
                        {premiumUser != true && (key === "EMAIL_LOGO_URL" || key === "EMAIL_SUPPORT_CONTACT") ? (
                          <div>
                            <a href="https://forms.gle/W3U4PZpJGFHWtHyA9" target="_blank">
                              <Text className="mt-2"> ✨ {key}</Text>
                            </a>
                            <TextInput
                              name={key}
                              defaultValue={value as string}
                              type="password"
                              disabled={true}
                              style={{ width: "400px" }}
                            />
                          </div>
                        ) : (
                          <div>
                            <Text className="mt-2">{key}</Text>
                            <TextInput
                              name={key}
                              defaultValue={value as string}
                              type="password"
                              style={{ width: "400px" }}
                            />
                          </div>
                        )}

                        {/* Added descriptions for input fields */}
                        <p style={{ fontSize: "small", fontStyle: "italic" }}>
                          {key === "SMTP_HOST" && (
                            <div style={{ color: "gray" }}>
                              Insira o endereço do servidor SMTP, por exemplo `smtp.resend.com`
                              <span style={{ color: "red" }}> Required * </span>
                            </div>
                          )}

                          {key === "SMTP_PORT" && (
                            <div style={{ color: "gray" }}>
                              Insira o número da porta SMTP, por exemplo `587`
                              <span style={{ color: "red" }}> Required * </span>
                            </div>
                          )}

                          {key === "SMTP_USERNAME" && (
                            <div style={{ color: "gray" }}>
                              Insira o nome de usuário SMTP, por exemplo `usuário`
                              <span style={{ color: "red" }}> Required * </span>
                            </div>
                          )}

                          {key === "SMTP_PASSWORD" && <span style={{ color: "red" }}> Necessário * </span>}

                          {key === "SMTP_SENDER_EMAIL" && (
                            <div style={{ color: "gray" }}>
                              Insira o endereço de e-mail do remetente, por exemplo `remetente@berri.ai`
                              <span style={{ color: "red" }}> Required * </span>
                            </div>
                          )}

                          {key === "TEST_EMAIL_ADDRESS" && (
                            <div style={{ color: "gray" }}>
                              Endereço de e-mail para enviar o alerta de teste. exemplo: `info@berri.ai`
                              <span style={{ color: "red" }}> Required * </span>
                            </div>
                          )}
                          {key === "EMAIL_LOGO_URL" && (
                            <div style={{ color: "gray" }}>
                              (Opcional) Personalize o logotipo que aparece no e-mail, informe uma URL para seu logotipo
                            </div>
                          )}
                          {key === "EMAIL_SUPPORT_CONTACT" && (
                            <div style={{ color: "gray" }}>
                              (Optional) Customize the support email address that appears in the email. Default is
                              support@berri.ai
                            </div>
                          )}
                        </p>
                      </li>
                    ))}
                  </Grid>
                </ul>
              </TableCell>
            ))}
        </div>

        <Button className="mt-2" onClick={() => handleSaveEmailSettings()}>
          Salvar Alterações
        </Button>
        <Button
          onClick={async () => {
            if (!accessToken) return;
            try {
              await serviceHealthCheck(accessToken, "email");
              NotificationManager.success("Teste de e-mail acionado. Verifique sua caixa de entrada/registros configurados.");
            } catch (error) {
              NotificationManager.fromBackend(error);
            }
          }}
          className="mx-2"
        >
          Testar Alertas por E-mail
        </Button>
      </Card>
    </>
  );
};

export default EmailSettings;
