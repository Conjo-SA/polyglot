import React, { useState, useEffect } from "react";
import { Card, Title, Text, TextInput, Button } from "@tremor/react";
import { useTheme } from "@/contexts/ThemeContext";
import { getProxyBaseUrl, getGlobalLitellmHeaderName } from "@/components/networking";
import NotificationsManager from "@/components/molecules/notifications_manager";

interface UIThemeSettingsProps {
  userID: string | null;
  userRole: string | null;
  accessToken: string | null;
}

const UIThemeSettings: React.FC<UIThemeSettingsProps> = ({ userID, userRole, accessToken }) => {
  const { logoUrl, setLogoUrl, faviconUrl, setFaviconUrl } = useTheme();
  const [logoUrlInput, setLogoUrlInput] = useState<string>("");
  const [faviconUrlInput, setFaviconUrlInput] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (accessToken) {
      fetchThemeSettings();
    }
  }, [accessToken]);

  const fetchThemeSettings = async () => {
    try {
      const proxyBaseUrl = getProxyBaseUrl();
      const url = proxyBaseUrl ? `${proxyBaseUrl}/get/ui_theme_settings` : "/get/ui_theme_settings";
      const response = await fetch(url, {
        method: "GET",
        headers: {
          [getGlobalLitellmHeaderName()]: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        setLogoUrlInput(data.values?.logo_url || "");
        setFaviconUrlInput(data.values?.favicon_url || "");
        setLogoUrl(data.values?.logo_url || null);
        setFaviconUrl(data.values?.favicon_url || null);
      }
    } catch (error) {
      console.error("Error fetching theme settings:", error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const proxyBaseUrl = getProxyBaseUrl();
      const url = proxyBaseUrl ? `${proxyBaseUrl}/update/ui_theme_settings` : "/update/ui_theme_settings";
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          [getGlobalLitellmHeaderName()]: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          logo_url: logoUrlInput || null,
          favicon_url: faviconUrlInput || null,
        }),
      });
      if (response.ok) {
        NotificationsManager.success("Configurações do tema atualizadas com sucesso!");
        setLogoUrl(logoUrlInput || null);
        setFaviconUrl(faviconUrlInput || null);
      } else {
        throw new Error("Failed to update settings");
      }
    } catch (error) {
      console.error("Error updating theme settings:", error);
      NotificationsManager.fromBackend("Falha ao atualizar as configurações do tema");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLogoUrlInput("");
    setFaviconUrlInput("");
    setLogoUrl(null);
    setFaviconUrl(null);
    setLoading(true);
    try {
      const proxyBaseUrl = getProxyBaseUrl();
      const url = proxyBaseUrl ? `${proxyBaseUrl}/update/ui_theme_settings` : "/update/ui_theme_settings";
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          [getGlobalLitellmHeaderName()]: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ logo_url: null, favicon_url: null }),
      });
      if (response.ok) {
        NotificationsManager.success("Configurações do tema restauradas aos padrões!");
      } else {
        throw new Error("Failed to reset");
      }
    } catch (error) {
      console.error("Error resetting theme settings:", error);
      NotificationsManager.fromBackend("Falha ao restaurar as configurações do tema");
    } finally {
      setLoading(false);
    }
  };

  if (!accessToken) {
    return null;
  }

  return (
    <div className="w-full mx-auto max-w-4xl px-6 py-8">
      <div className="mb-8">
        <Title className="text-2xl font-bold mb-2">Personalização do Tema da Interface</Title>
        <Text className="text-gray-600">Personalize o painel administrativo do Polyglot com um logotipo e favicon personalizados.</Text>
      </div>
      <Card className="shadow-xs p-6">
        <div className="space-y-6">
          <div>
            <Text className="text-sm font-medium text-gray-700 mb-2 block">URL do Logotipo Personalizado</Text>
            <TextInput
              placeholder="https://example.com/logo.png"
              value={logoUrlInput}
              onValueChange={(v) => {
                setLogoUrlInput(v);
                setLogoUrl(v || null);
              }}
              className="w-full"
            />
            <Text className="text-xs text-gray-500 mt-1">
              Insira uma URL para seu logotipo personalizado ou deixe vazio para o padrão
            </Text>
          </div>
          <div>
            <Text className="text-sm font-medium text-gray-700 mb-2 block">URL do Favicon Personalizado</Text>
            <TextInput
              placeholder="https://example.com/favicon.ico"
              value={faviconUrlInput}
              onValueChange={(v) => {
                setFaviconUrlInput(v);
                setFaviconUrl(v || null);
              }}
              className="w-full"
            />
            <Text className="text-xs text-gray-500 mt-1">
              Insira uma URL para seu favicon personalizado (.ico, .png ou .svg) ou deixe vazio para o padrão
            </Text>
          </div>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} loading={loading} disabled={loading} color="indigo">
              Salvar Alterações
            </Button>
            <Button onClick={handleReset} loading={loading} disabled={loading} variant="secondary" color="gray">
              Restaurar Padrões
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UIThemeSettings;
