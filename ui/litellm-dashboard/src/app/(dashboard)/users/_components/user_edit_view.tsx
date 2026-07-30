import { InfoCircleOutlined } from "@ant-design/icons";
import { Button, SelectItem, TextInput, Textarea } from "@tremor/react";
import { Checkbox, Form, Select, Tooltip } from "antd";
import React, { useState } from "react";
import { all_admin_roles } from "@/utils/roles";
import BudgetDurationDropdown from "@/components/common_components/budget_duration_dropdown";
import { getModelDisplayName } from "@/components/key_team_helpers/fetch_available_models_team_key";
import NumericalInput from "@/components/shared/numerical_input";

interface UserEditViewProps {
  userData: any;
  onCancel: () => void;
  onSubmit: (values: any) => void;
  teams: any[] | null;
  accessToken: string | null;
  userID: string | null;
  userRole: string | null;
  userModels: string[];
  possibleUIRoles: Record<string, Record<string, string>> | null;
  isBulkEdit?: boolean;
}

export function UserEditView({
  userData,
  onCancel,
  onSubmit,
  teams,
  accessToken,
  userID,
  userRole,
  userModels,
  possibleUIRoles,
  isBulkEdit = false,
}: UserEditViewProps) {
  const [form] = Form.useForm();
  const [unlimitedBudget, setUnlimitedBudget] = useState(false);

  // Set initial form values
  React.useEffect(() => {
    const maxBudget = userData.user_info?.max_budget;
    const isUnlimited = maxBudget === null || maxBudget === undefined;
    setUnlimitedBudget(isUnlimited);

    form.setFieldsValue({
      user_id: userData.user_id,
      user_email: userData.user_info?.user_email,
      user_alias: userData.user_info?.user_alias,
      user_role: userData.user_info?.user_role,
      models: userData.user_info?.models || [],
      max_budget: isUnlimited ? "" : maxBudget,
      budget_duration: userData.user_info?.budget_duration,
      metadata: userData.user_info?.metadata ? JSON.stringify(userData.user_info.metadata, null, 2) : undefined,
    });
  }, [userData, form]);

  const handleUnlimitedBudgetChange = (e: any) => {
    const checked = e.target.checked;
    setUnlimitedBudget(checked);
    if (checked) {
      form.setFieldsValue({ max_budget: "" });
    }
  };

  const handleSubmit = (values: any) => {
    // Convert metadata back to an object if it exists and is a string
    if (values.metadata && typeof values.metadata === "string") {
      try {
        values.metadata = JSON.parse(values.metadata);
      } catch (error) {
        console.error("Error parsing metadata JSON:", error);
        return;
      }
    }

    if (unlimitedBudget || values.max_budget === "" || values.max_budget === undefined) {
      values.max_budget = null;
    }

    onSubmit(values);
  };

  return (
    <Form form={form} onFinish={handleSubmit} layout="vertical">
      {!isBulkEdit && (
        <Form.Item label="ID do Usuário" name="user_id">
          <TextInput disabled />
        </Form.Item>
      )}

      {!isBulkEdit && (
        <Form.Item label="E-mail" name="user_email">
          <TextInput />
        </Form.Item>
      )}

      <Form.Item label="Apelido do Usuário" name="user_alias">
        <TextInput />
      </Form.Item>

      <Form.Item
        label={
          <span>
            Função Global no Proxy{" "}
            <Tooltip title="Esta é a função que o usuário terá globalmente no proxy. Esta função é independente de quaisquer funções específicas de equipe/organização.">
              <InfoCircleOutlined />
            </Tooltip>
          </span>
        }
        name="user_role"
      >
        <Select>
          {possibleUIRoles &&
            Object.entries(possibleUIRoles).map(([role, { ui_label, description }]) => (
              <SelectItem key={role} value={role} title={ui_label}>
                <div className="flex">
                  {ui_label}{" "}
                  <p className="ml-2" style={{ color: "gray", fontSize: "12px" }}>
                    {description}
                  </p>
                </div>
              </SelectItem>
            ))}
        </Select>
      </Form.Item>

      <Form.Item
        label={
          <span>
            Modelos Pessoais{" "}
            <Tooltip title="Selecione quais modelos este usuário pode acessar fora do escopo da equipe. Escolha 'Todos os Modelos do Proxy' para conceder acesso a todos os modelos disponíveis no proxy.">
              <InfoCircleOutlined style={{ marginLeft: "4px" }} />
            </Tooltip>
          </span>
        }
        name="models"
      >
        <Select
          mode="multiple"
          placeholder="Selecionar modelos"
          style={{ width: "100%" }}
          disabled={!all_admin_roles.includes(userRole || "")}
        >
          <Select.Option key="all-proxy-models" value="all-proxy-models">
            Todos os Modelos do Proxy
          </Select.Option>
          <Select.Option key="no-default-models" value="no-default-models">
            Nenhum Modelo Padrão
          </Select.Option>
          {userModels.map((model) => (
            <Select.Option key={model} value={model}>
              {getModelDisplayName(model)}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        label={
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span>Orçamento Máximo (USD)</span>
            <Checkbox checked={unlimitedBudget} onChange={handleUnlimitedBudgetChange}>
              Orçamento Ilimitado
            </Checkbox>
          </div>
        }
        name="max_budget"
        rules={[
          {
            validator: (_, value) => {
              if (!unlimitedBudget && (value === "" || value === null || value === undefined)) {
                return Promise.reject(new Error("Por favor, informe um orçamento ou selecione Orçamento Ilimitado"));
              }
              return Promise.resolve();
            },
          },
        ]}
      >
        <NumericalInput step={0.01} precision={2} style={{ width: "100%" }} disabled={unlimitedBudget} />
      </Form.Item>

      <Form.Item label="Redefinir Orçamento" name="budget_duration">
        <BudgetDurationDropdown />
      </Form.Item>

      <Form.Item label="Metadados" name="metadata">
        <Textarea rows={4} placeholder="Informe os metadados no formato JSON" />
      </Form.Item>

      <div className="flex justify-end space-x-2">
        <Button variant="secondary" type="button" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Salvar Alterações</Button>
      </div>
    </Form>
  );
}
