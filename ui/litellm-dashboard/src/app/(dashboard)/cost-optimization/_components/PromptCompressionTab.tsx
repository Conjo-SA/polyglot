"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button, Form, Input, Switch } from "antd";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createGuardrailCall, getGuardrailsList } from "@/components/networking";
import NotificationsManager from "@/components/molecules/notifications_manager";
import {
  buildCompressionGuardrailPayload,
  compressionGuardrailsOf,
  GuardrailListItem,
  GuardrailListResponse,
} from "./helpers";

interface PromptCompressionTabProps {
  accessToken: string | null;
}

interface CompressionFormValues {
  name: string;
  apiBase: string;
  defaultOn: boolean;
}

const PromptCompressionTab: React.FC<PromptCompressionTabProps> = ({ accessToken }) => {
  const [form] = Form.useForm<CompressionFormValues>();
  const [guardrails, setGuardrails] = useState<GuardrailListItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const loadGuardrails = useCallback(() => {
    if (!accessToken) {
      return;
    }
    getGuardrailsList(accessToken)
      .then((response) => setGuardrails(compressionGuardrailsOf(response as GuardrailListResponse)))
      .catch((error) => {
        console.error("Failed to load compression guardrails:", error);
        NotificationsManager.fromBackend("Failed to load compression guardrails");
      })
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  useEffect(() => {
    loadGuardrails();
  }, [loadGuardrails]);

  const handleAdd = async (values: CompressionFormValues) => {
    if (!accessToken) {
      return;
    }
    setIsSaving(true);
    try {
      await createGuardrailCall(
        accessToken,
        buildCompressionGuardrailPayload({
          name: values.name,
          apiBase: values.apiBase,
          defaultOn: values.defaultOn ?? true,
        }),
      );
      NotificationsManager.success("Compression guardrail created");
      form.resetFields();
      await loadGuardrails();
    } catch (error) {
      console.error("Failed to create compression guardrail:", error);
      NotificationsManager.fromBackend("Failed to create compression guardrail");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Compressão de prompt Headroom</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Headroom é um guardrail nativo do Polyglot que comprime seus prompts antes que eles cheguem ao modelo, então você paga
           _por menos tokens de entrada. Os tokens removidos são precificados e mostrados na aba Uso como economia por compressão.{" "}
            <a
              href="https://docs.litellm.ai/docs/proxy/headroom"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              Documentação da configuração do Headroom
            </a>
          </p>
          {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
          {!isLoading && guardrails.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum guardrail de compressão de prompt configurado ainda. Adicione um abaixo para começar a economizar nos tokens de entrada
            </p>
          )}
          {!isLoading && guardrails.length > 0 && (
            <ul className="divide-y divide-gray-200">
              {guardrails.map((guardrail) => (
                <li key={guardrail.guardrail_id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{guardrail.guardrail_name}</p>
                    <p className="text-xs text-muted-foreground">{guardrail.litellm_params?.api_base ?? ""}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      guardrail.litellm_params?.default_on
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {guardrail.litellm_params?.default_on ? "Sempre ativado" : "Ativar opcionalmente"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Adicionar guardrail de compressão Headroom</CardTitle>
        </CardHeader>
        <CardContent>
          <Form
            form={form}
            layout="vertical"
            requiredMark={false}
            onFinish={handleAdd}
            initialValues={{ defaultOn: true }}
          >
            <Form.Item name="name" label="Nome" rules={[{ required: true, message: "Nome é obrigatório" }]}>
              <Input placeholder="compressao-headroom" />
            </Form.Item>
            <Form.Item
              name="apiBase"
              label="Headroom API base"
              tooltip="Base URL of your Headroom compression service (Polyglot calls its /v1/compress endpoint)"
              extra="The URL where your Headroom compression service is hosted"
              rules={[{ required: true, message: "API base is required" }]}
            >
              <Input placeholder="https://your-headroom-endpoint" />
            </Form.Item>
            <Form.Item name="defaultOn" label="Aplicar a todas as requisições" valuePropName="checked">
              <Switch />
            </Form.Item>
            <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
              <p className="text-sm text-yellow-800">
                Aplicar compressão a todas as requisições está disponível para todos os usuários. Habilitá-la seletivamente por chave ou equipe
                é um recurso Enterprise do Polyglot. Obtenha uma chave de teste{" "}
                <a
                  href="https://www.litellm.ai/#pricing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  aqui
                </a>
              </p>
            </div>
            <div className="flex justify-end">
              <Button type="primary" htmlType="submit" loading={isSaving}>
                Adicionar guardrail
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PromptCompressionTab;
