import React, { useEffect } from "react";
import { TextInput, Accordion, AccordionHeader, AccordionBody } from "@tremor/react";
import { Button as Button2, Modal, Form, InputNumber, Select } from "antd";
import { useUpdateBudget } from "@/app/(dashboard)/hooks/budgets/useBudgets";
import { budgetItem } from "@/app/(dashboard)/hooks/budgets/useBudgets";
import NotificationsManager from "@/components/molecules/notifications_manager";

interface EditBudgetModalProps {
  isModalVisible: boolean;
  setIsModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  existingBudget: budgetItem;
}
const EditBudgetModal: React.FC<EditBudgetModalProps> = ({ isModalVisible, setIsModalVisible, existingBudget }) => {
  const [form] = Form.useForm();
  const updateBudget = useUpdateBudget();

  useEffect(() => {
    form.setFieldsValue(existingBudget);
  }, [existingBudget, form]);

  const handleOk = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleUpdate = async (formValues: Record<string, any>) => {
    try {
      NotificationsManager.info("Making API Call");
      await updateBudget.mutateAsync(formValues);
      NotificationsManager.success("Budget Updated");
      form.resetFields();
      setIsModalVisible(false);
    } catch (error) {
      console.error("Error updating the budget:", error);
      NotificationsManager.fromBackend(`Error updating the budget: ${error}`);
    }
  };

  return (
    <Modal title="Editar Orçamento" open={isModalVisible} width={800} footer={null} onOk={handleOk} onCancel={handleCancel}>
      <Form
        form={form}
        onFinish={handleUpdate}
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        labelAlign="left"
        initialValues={existingBudget}
      >
        <>
          <Form.Item label="ID do Orçamento" name="budget_id" help="O ID do orçamento não pode ser alterado após a criação">
            <TextInput placeholder="" disabled={true} />
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
                <InputNumber step={0.01} precision={2} width={200} />
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
          <Button2 htmlType="submit">Salvar</Button2>
        </div>
      </Form>
    </Modal>
  );
};

export default EditBudgetModal;
