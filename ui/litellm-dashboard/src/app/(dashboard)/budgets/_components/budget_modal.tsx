import React from "react";
import { TextInput, Accordion, AccordionHeader, AccordionBody } from "@tremor/react";
import { Button as Button2, Modal, Form, InputNumber, Select } from "antd";
import { CurrencyMoneyInput } from "@/components/shared/CurrencyMoneyInput";
import { useCreateBudget } from "@/app/(dashboard)/hooks/budgets/useBudgets";
import NotificationsManager from "@/components/molecules/notifications_manager";

interface BudgetModalProps {
  isModalVisible: boolean;
  setIsModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
}
const BudgetModal: React.FC<BudgetModalProps> = ({ isModalVisible, setIsModalVisible }) => {
  const [form] = Form.useForm();
  const createBudget = useCreateBudget();

  const handleOk = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleCreate = async (formValues: Record<string, any>) => {
    try {
      NotificationsManager.info("Making API Call");
      await createBudget.mutateAsync(formValues);
      NotificationsManager.success("Budget Created");
      form.resetFields();
      setIsModalVisible(false);
    } catch (error) {
      console.error("Error creating the budget:", error);
      NotificationsManager.fromBackend(`Error creating the budget: ${error}`);
    }
  };

  return (
    <Modal
      title="Criar Orçamento"
      open={isModalVisible}
      width={800}
      footer={null}
      onOk={handleOk}
      onCancel={handleCancel}
    >
      <Form form={form} onFinish={handleCreate} labelCol={{ span: 8 }} wrapperCol={{ span: 16 }} labelAlign="left">
        <>
          <Form.Item
            label="ID do Orçamento"
            name="budget_id"
            rules={[
              {
                required: true,
                message: "Por favor, informe um nome amigável para o orçamento",
              },
            ]}
            help="Um nome amigável para o orçamento"
          >
            <TextInput placeholder="" />
          </Form.Item>
          <Form.Item label="Tokens máximos por minuto" name="tpm_limit" help="Padrão é o limite do modelo.">
            <InputNumber step={1} precision={2} width={200} />
          </Form.Item>
          <Form.Item label="Requisições máximas por minuto" name="rpm_limit" help="Padrão é o limite do modelo.">
            <InputNumber step={1} precision={2} width={200} />
          </Form.Item>

          <Accordion className="mt-20 mb-8">
            <AccordionHeader>
              <b>Configurações Opcionais</b>
            </AccordionHeader>
            <AccordionBody>
              <Form.Item label="Orçamento Máximo (USD)" name="max_budget">
                <CurrencyMoneyInput />
              </Form.Item>
              <Form.Item className="mt-8" label="Reiniciar Orçamento" name="budget_duration">
                <Select defaultValue={null} placeholder="n/a">
                  <Select.Option value="24h">diário</Select.Option>
                  <Select.Option value="7d">semanal</Select.Option>
                  <Select.Option value="30d">mensal</Select.Option>
                </Select>
              </Form.Item>
            </AccordionBody>
          </Accordion>
        </>

        <div style={{ textAlign: "right", marginTop: "10px" }}>
          <Button2 htmlType="submit">Criar Orçamento</Button2>
        </div>
      </Form>
    </Modal>
  );
};

export default BudgetModal;
