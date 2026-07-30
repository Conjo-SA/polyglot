import { InfoCircleOutlined } from "@ant-design/icons";
import { Accordion, AccordionBody, AccordionHeader, Button, TextInput, Title } from "@tremor/react";
import { Form, Input, Modal, Select as Select2, Tooltip } from "antd";
import React from "react";
import BudgetDurationDropdown from "@/components/common_components/budget_duration_dropdown";
import NumericalInput from "@/components/shared/numerical_input";

interface ModelInfo {
  model_name: string;
  litellm_params: {
    model: string;
  };
  model_info: {
    id: string;
  };
}

interface CreateTagModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: any) => void;
  availableModels: ModelInfo[];
}

const CreateTagModal: React.FC<CreateTagModalProps> = ({ visible, onCancel, onSubmit, availableModels }) => {
  const [form] = Form.useForm();

  const handleFinish = (values: any) => {
    onSubmit(values);
    form.resetFields();
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal title="Criar Nova Tag" open={visible} width={800} footer={null} onCancel={handleCancel}>
      <Form form={form} onFinish={handleFinish} labelCol={{ span: 8 }} wrapperCol={{ span: 16 }} labelAlign="left">
        <Form.Item label="Nome da Tag" name="tag_name" rules={[{ required: true, message: "Por favor, informe um nome para a tag" }]}>
          <TextInput />
        </Form.Item>

        <Form.Item label="Descrição" name="description">
          <Input.TextArea rows={4} />
        </Form.Item>

        <Form.Item
          label={
            <span>
              Modelos Permitidos
              <Tooltip title="Selecione quais modelos são permitidos para processar requisições desta tag">
                <InfoCircleOutlined style={{ marginLeft: "4px" }} />
              </Tooltip>
            </span>
          }
          name="allowed_llms"
        >
          <Select2 mode="multiple" placeholder="Selecionar Modelos">
            {availableModels.map((model) => (
              <Select2.Option key={model.model_info.id} value={model.model_info.id}>
                <div>
                  <span>{model.model_name}</span>
                  <span className="text-gray-400 ml-2">({model.model_info.id})</span>
                </div>
              </Select2.Option>
            ))}
          </Select2>
        </Form.Item>

        <Accordion className="mt-4 mb-4">
          <AccordionHeader>
            <Title className="m-0">Orçamento e Limites de Taxa (Opcional)</Title>
          </AccordionHeader>
          <AccordionBody>
            <Form.Item
              className="mt-4"
              label={
                <span>
                  Orçamento Máximo (USD){" "}
                  <Tooltip title="Valor máximo em USD que esta tag pode gastar. Quando atingido, as requisições com esta tag serão bloqueadas">
                    <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                  </Tooltip>
                </span>
              }
              name="max_budget"
            >
              <NumericalInput step={0.01} precision={2} width={200} />
            </Form.Item>
            <Form.Item
              className="mt-4"
              label={
                <span>
                  Reiniciar Orçamento{" "}
                  <Tooltip title="Frequência de reinicialização do orçamento. Por exemplo, definir 'diariamente' reinicia o orçamento a cada 24 horas">
                    <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                  </Tooltip>
                </span>
              }
              name="budget_duration"
            >
              <BudgetDurationDropdown onChange={(value) => form.setFieldValue("budget_duration", value)} />
            </Form.Item>

            <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200">
              <p className="text-sm text-gray-600">
                Limites TPM/RPM para tags não são suportados atualmente. Se você precisa desta funcionalidade, por favor{" "}
                <a
                  href="https://github.com/BerriAI/litellm/issues/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  crie uma issue no GitHub
                </a>
                .
              </p>
            </div>
          </AccordionBody>
        </Accordion>

        <div style={{ textAlign: "right", marginTop: "10px" }}>
          <Button type="submit">Criar Tag</Button>
        </div>
      </Form>
    </Modal>
  );
};

export default CreateTagModal;
