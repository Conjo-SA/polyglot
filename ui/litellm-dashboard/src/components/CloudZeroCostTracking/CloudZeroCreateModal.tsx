import { Form, Modal, Input } from "antd";
import MessageManager from "@/components/molecules/message_manager";
import { useEffect } from "react";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { useCloudZeroCreate } from "@/app/(dashboard)/hooks/cloudzero/useCloudZeroCreate";

interface CloudZeroCreationModalProps {
  open: boolean;
  onOk: () => void;
  onCancel: () => void;
}

export default function CloudZeroCreationModal({ open, onOk, onCancel }: CloudZeroCreationModalProps) {
  const { accessToken } = useAuthorized();
  const [form] = Form.useForm();
  const createMutation = useCloudZeroCreate(accessToken || "");

  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      createMutation.mutate(
        {
          connection_id: values.connection_id,
          timezone: values.timezone || "UTC",
          ...(values.api_key && { api_key: values.api_key }),
        },
        {
          onSuccess: () => {
            MessageManager.success("Integração com CloudZero criada com sucesso");
            form.resetFields();
            onOk();
          },
          onError: (error: any) => {
            if (error?.errorFields) {
              return;
            }
            MessageManager.error(error?.message || "Failed to create CloudZero integration");
          },
        },
      );
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }
      MessageManager.error(error?.message || "Failed to create CloudZero integration");
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="Criar Integração com CloudZero"
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={createMutation.isPending}
      okText={createMutation.isPending ? "Criando..." : "Criar"}
      cancelText="Cancelar"
      okButtonProps={{
        disabled: createMutation.isPending,
      }}
      cancelButtonProps={{
        disabled: createMutation.isPending,
      }}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label="Chave da API do CloudZero"
          name="api_key"
          rules={[{ required: true, message: "Por favor, insira sua chave da API do CloudZero" }]}
        >
          <Input.Password placeholder="Insira sua chave da API do CloudZero" />
        </Form.Item>
        <Form.Item
          label="ID da Conexão"
          name="connection_id"
          rules={[{ required: true, message: "Por favor, insira o ID da conexão do CloudZero" }]}
        >
          <Input placeholder="Insira o ID da conexão do CloudZero" />
        </Form.Item>
        <Form.Item
          label="Fuso Horário"
          name="timezone"
          tooltip="Fuso horário para tratamento de datas (padrão UTC se não informado)"
        >
          <Input placeholder="UTC" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
