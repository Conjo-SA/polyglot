import React, { useState, useEffect } from "react";
import { Card, Text, Button } from "@tremor/react";
import { Typography, Divider, Spin, Checkbox } from "antd";
import NotificationsManager from "../molecules/notifications_manager";
import { getEmailEventSettings, updateEmailEventSettings, resetEmailEventSettings } from "../networking";
import { EmailEvent } from "../../types";
import { EmailEventSetting } from "./types";

const { Title } = Typography;

interface EmailEventSettingsProps {
  accessToken: string | null;
}

const EmailEventSettings: React.FC<EmailEventSettingsProps> = ({ accessToken }) => {
  const [loading, setLoading] = useState(true);
  const [eventSettings, setEventSettings] = useState<EmailEventSetting[]>([]);

  // Fetch email event settings on component mount
  useEffect(() => {
    fetchEventSettings();
  }, [accessToken]);

  const fetchEventSettings = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const response = await getEmailEventSettings(accessToken);
      setEventSettings(response.settings);
    } catch (error) {
      console.error("Failed to fetch email event settings:", error);
      NotificationsManager.fromBackend(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (event: EmailEvent, checked: boolean) => {
    const updatedSettings = eventSettings.map((setting) =>
      setting.event === event ? { ...setting, enabled: checked } : setting,
    );
    setEventSettings(updatedSettings);
  };

  const handleSaveSettings = async () => {
    if (!accessToken) return;

    try {
      await updateEmailEventSettings(accessToken, { settings: eventSettings });
      NotificationsManager.success("Definições de eventos de email atualizadas com sucesso");
    } catch (error) {
      console.error("Failed to update email event settings:", error);
      NotificationsManager.fromBackend(error);
    }
  };

  const handleResetSettings = async () => {
    if (!accessToken) return;

    try {
      await resetEmailEventSettings(accessToken);
      NotificationsManager.success("Definições de eventos de email restauradas aos padrões");
      // Refresh settings after reset
      fetchEventSettings();
    } catch (error) {
      console.error("Failed to reset email event settings:", error);
      NotificationsManager.fromBackend(error);
    }
  };

  // Helper function to get a description for each event type
  const getEventDescription = (event: EmailEvent): string => {
    // Convert event name to a sentence with more context
    if (event.includes("Virtual Key Created")) {
      return "Um email será enviado ao usuário quando uma nova chave virtual for criada com seu ID de usuário";
    } else if (event.includes("New User Invitation")) {
      return "Um email será enviado ao endereço de email do usuário quando um novo usuário for criado";
    } else {
      // Handle any other event type from the API
      const words = event
        .split(/(?=[A-Z])/)
        .join(" ")
        .toLowerCase();
      return `Receba uma notificação por email quando ${words}`;
    }
  };

  return (
    <Card>
      <Title level={4}>Notificações por Email</Title>
      <Text>Selecione quais eventos devem acionar notificações por email.</Text>
      <Divider />

      {loading ? (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <Spin size="large" />
        </div>
      ) : (
        <div className="space-y-4">
          {eventSettings.map((setting) => (
            <div key={setting.event} className="flex items-center">
              <Checkbox
                checked={setting.enabled}
                onChange={(e) => handleCheckboxChange(setting.event, e.target.checked)}
              />
              <div className="ml-3">
                <Text>{setting.event}</Text>
                <div className="text-sm text-gray-500 block">{getEventDescription(setting.event)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex space-x-4">
        <Button onClick={handleSaveSettings} disabled={loading}>
          Salvar Alterações
        </Button>
        <Button onClick={handleResetSettings} variant="secondary" disabled={loading}>
          Restaurar Padrões
        </Button>
      </div>
    </Card>
  );
};

export default EmailEventSettings;
