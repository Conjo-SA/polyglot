import { Alert, Button, Form, Input, Modal, Typography } from "antd";
import { useState } from "react";
import { modelPatchUpdateCall } from "./networking";
import NotificationsManager from "./molecules/notifications_manager";

const { Text } = Typography;

interface UpdateModelCredentialsModalProps {
  open: boolean;
  onCancel: () => void;
  accessToken: string;
  modelId: string;
  onUpdated: () => void;
}

export default function UpdateModelCredentialsModal({
  open,
  onCancel,
  accessToken,
  modelId,
  onUpdated,
}: UpdateModelCredentialsModalProps) {
  const [form] = Form.useForm();
  const [isSaving, setIsSaving] = useState(false);

  const close = () => {
    form.resetFields();
    onCancel();
  };

  const handleSubmit = async (values: { api_key?: string }) => {
    const apiKey = values.api_key?.trim();
    if (!apiKey) {
      NotificationsManager.fromBackend("Digite uma nova chave de API");
      return;
    }
    setIsSaving(true);
    try {
      await modelPatchUpdateCall(
        accessToken,
        { litellm_params: { api_key: apiKey }, model_info: { id: modelId } },
        modelId,
      );
      NotificationsManager.success("Chave de API atualizada");
      form.resetFields();
      onUpdated();
      onCancel();
    } catch (error) {
      console.error("Error updating API key:", error);
      NotificationsManager.fromBackend("Falha ao atualizar a chave de API");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal title="Atualizar Chave de API" open={open} onCancel={close} footer={null} width={520} destroyOnHidden={true}>
      <Text className="block mb-4 text-gray-500">
        Atualize a chave de API deste modelo. Apenas a nova chave é enviada; o resto da configuração de implantação permanece intacto.
      </Text>
      <Alert
        type="warning"
        showIcon
        className="mb-4"
        message="Apenas a chave de API é atualizada aqui. Modelos que autenticam com um token do Azure AD, credenciais da AWS ou um JSON de conta de serviço do Vertex ainda não são compatíveis; atualize esses dados nos Parâmetros do Polyglot do modelo por enquanto."
      />
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Form.Item label="Nova Chave de API" name="api_key" rules={[{ required: true, message: "Digite uma nova chave de API" }]}>
          <Input.Password placeholder="Digite a nova chave de API" autoComplete="new-password" />
        </Form.Item>
        <div className="flex justify-end items-center mt-4">
          <Button onClick={close} style={{ marginRight: 10 }}>
            Cancelar
          </Button>
          <Button type="primary" htmlType="submit" loading={isSaving}>
            Atualizar Chave de API
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
