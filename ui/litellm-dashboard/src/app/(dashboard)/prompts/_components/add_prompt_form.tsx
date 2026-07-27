import React, { useState } from "react";
import { Modal, Form, Select, Upload, Button, Divider } from "antd";
import { TextInput } from "@tremor/react";
import { UploadOutlined } from "@ant-design/icons";
import type { UploadFile, UploadProps } from "antd";
import { convertPromptFileToJson, createPromptCall } from "@/components/networking";
import NotificationsManager from "@/components/molecules/notifications_manager";

const { Option } = Select;

interface AddPromptFormProps {
  visible: boolean;
  onClose: () => void;
  accessToken: string | null;
  onSuccess: () => void;
}

interface PromptFormData {
  prompt_id: string;
  prompt_integration: string;
  prompt_file?: File;
}

const AddPromptForm: React.FC<AddPromptFormProps> = ({ visible, onClose, accessToken, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [promptIntegration, setPromptIntegration] = useState<string>("dotprompt");

  const handleCancel = () => {
    form.resetFields();
    setFileList([]);
    setPromptIntegration("dotprompt");
    onClose();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (!accessToken) {
        NotificationsManager.fromBackend("Token de acesso é obrigatório");
        return;
      }

      if (promptIntegration === "dotprompt" && fileList.length === 0) {
        NotificationsManager.fromBackend("Por favor, faça upload de um arquivo .prompt");
        return;
      }

      setLoading(true);

      let promptData: any = {};

      if (promptIntegration === "dotprompt" && fileList.length > 0) {
        // Convert the uploaded file to JSON
        const file = fileList[0].originFileObj as File;

        try {
          const conversionResult = await convertPromptFileToJson(accessToken, file);

          // Prepare prompt data for creation
          promptData = {
            prompt_id: values.prompt_id,
            litellm_params: {
              prompt_integration: "dotprompt",
              prompt_id: conversionResult.prompt_id,
              prompt_data: conversionResult.json_data,
            },
            prompt_info: {
              prompt_type: "db",
            },
          };
        } catch (conversionError) {
          console.error("Error converting prompt file:", conversionError);
          NotificationsManager.fromBackend("Falha ao converter arquivo de prompt para JSON");
          setLoading(false);
          return;
        }
      }

      // Create the prompt
      try {
        await createPromptCall(accessToken, promptData);
        NotificationsManager.success("Prompt created successfully!");
        handleCancel();
        onSuccess();
      } catch (createError) {
        console.error("Error creating prompt:", createError);
        NotificationsManager.fromBackend("Falha ao criar prompt");
      }
    } catch (error) {
      console.error("Form validation error:", error);
    } finally {
      setLoading(false);
    }
  };

  const uploadProps: UploadProps = {
    beforeUpload: (file) => {
      if (!file.name.endsWith(".prompt")) {
        NotificationsManager.fromBackend("Por favor, faça upload de um arquivo .prompt");
        return false;
      }
      return false; // Prevent automatic upload
    },
    fileList,
    onChange: ({ fileList: newFileList }) => {
      setFileList(newFileList.slice(-1)); // Keep only the last file
    },
    onRemove: () => {
      setFileList([]);
    },
  };

  return (
    <Modal
      title="Adicionar Novo Prompt"
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button key="submit" loading={loading} onClick={handleSubmit}>
          Criar Prompt
        </Button>,
      ]}
      width={600}
    >
      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item
          label="ID do Prompt"
          name="prompt_id"
          rules={[
            { required: true, message: "Por favor, insira um ID de prompt" },
            {
              pattern: /^[a-zA-Z0-9_-]+$/,
              message: "O ID do prompt pode conter apenas letras, números, sublinhados e hífens",
            },
          ]}
        >
          <TextInput placeholder="Insira um ID único de prompt (ex: meu_prompt_id)" />
        </Form.Item>

        <Form.Item label="Integração de Prompt" name="prompt_integration" initialValue="dotprompt">
          <Select value={promptIntegration} onChange={setPromptIntegration}>
            <Option value="dotprompt">dotprompt</Option>
          </Select>
        </Form.Item>

        {promptIntegration === "dotprompt" && (
          <>
            <Divider />
            <Form.Item label="Arquivo de Prompt" extra="Faça upload de um arquivo .prompt que siga a especificação do Dotprompt">
              <Upload {...uploadProps}>
                <Button icon={<UploadOutlined />}>Selecionar Arquivo .prompt</Button>
              </Upload>
              {fileList.length > 0 && <div className="mt-2 text-sm text-gray-600">Selected: {fileList[0].name}</div>}
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  );
};

export default AddPromptForm;
