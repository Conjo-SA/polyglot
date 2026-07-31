import { useTeams } from "@/app/(dashboard)/hooks/teams/useTeams";
import { organizationKeys, useOrganization } from "@/app/(dashboard)/hooks/organizations/useOrganizations";
import { useQueryClient } from "@tanstack/react-query";
import { MoneyCell } from "@/components/shared/table_cells";
import { formatNumberWithCommas, copyToClipboard as utilCopyToClipboard } from "@/utils/dataUtils";
import { createTeamAliasMap } from "@/utils/teamUtils";
import { ArrowLeftIcon } from "@heroicons/react/outline";
import { Badge, Card, Grid, NumberInput, Text, TextInput, Title, Button as TremorButton } from "@tremor/react";
import { Button, Form, Input, Select, Tabs, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { CheckIcon, CopyIcon } from "lucide-react";
import React, { useMemo, useState } from "react";
import MemberTable from "../common_components/MemberTable";
import UserSearchModal from "../common_components/user_search_modal";
import MCPServerSelector from "../mcp_server_management/MCPServerSelector";
import { ModelSelect } from "../ModelSelect/ModelSelect";
import NotificationsManager from "../molecules/notifications_manager";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  Member,
  Organization,
  organizationMemberAddCall,
  organizationMemberDeleteCall,
  organizationMemberUpdateCall,
  organizationUpdateCall,
} from "../networking";
import ObjectPermissionsView from "../object_permissions_view";
import { CurrencyMoneyInput } from "../shared/CurrencyMoneyInput";
import MemberModal from "../team/EditMembership";
import VectorStoreSelector from "../vector_store_management/VectorStoreSelector";

interface OrganizationInfoProps {
  organizationId: string;
  onClose: () => void;
  accessToken: string | null;
  is_org_admin: boolean;
  is_proxy_admin: boolean;
  userModels: string[];
  editOrg: boolean;
}

const OrganizationInfoView: React.FC<OrganizationInfoProps> = ({
  organizationId,
  onClose,
  accessToken,
  is_org_admin,
  is_proxy_admin,
  userModels,
  editOrg,
}) => {
  const { currency, symbol } = useCurrency();
  const queryClient = useQueryClient();
  const { data: orgData, isLoading: loading } = useOrganization(organizationId);
  const [form] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);
  const [isAddMemberModalVisible, setIsAddMemberModalVisible] = useState(false);
  const [isEditMemberModalVisible, setIsEditMemberModalVisible] = useState(false);
  const [selectedEditMember, setSelectedEditMember] = useState<Member | null>(null);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [isOrgSaving, setIsOrgSaving] = useState(false);
  const canEditOrg = is_org_admin || is_proxy_admin;
  const { data: teams } = useTeams();

  const teamAliasMap = useMemo(() => createTeamAliasMap(teams), [teams]);

  const handleMemberAdd = async (values: any) => {
    try {
      if (accessToken == null) {
        return;
      }

      const member: Member = {
        user_email: values.user_email,
        user_id: values.user_id,
        role: values.role,
      };
      const response = await organizationMemberAddCall(accessToken, organizationId, member);

      NotificationsManager.success("Membro da organização adicionado com sucesso");
      setIsAddMemberModalVisible(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
    } catch (error) {
      NotificationsManager.fromBackend("Falha ao adicionar membro da organização");
      console.error("Error adding organization member:", error);
    }
  };

  const handleMemberUpdate = async (values: any) => {
    try {
      if (!accessToken) return;

      const member: Member = {
        user_email: values.user_email,
        user_id: values.user_id,
        role: values.role,
      };

      const response = await organizationMemberUpdateCall(accessToken, organizationId, member);
      NotificationsManager.success("Membro da organização atualizado com sucesso");
      setIsEditMemberModalVisible(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
    } catch (error) {
      NotificationsManager.fromBackend("Falha ao atualizar membro da organização");
      console.error("Error updating organization member:", error);
    }
  };

  const handleMemberDelete = async (values: any) => {
    try {
      if (!accessToken) return;

      await organizationMemberDeleteCall(accessToken, organizationId, values.user_id);
      NotificationsManager.success("Membro da organização excluído com sucesso");
      setIsEditMemberModalVisible(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
    } catch (error) {
      NotificationsManager.fromBackend("Falha ao excluir membro da organização");
      console.error("Error deleting organization member:", error);
    }
  };

  const handleOrgUpdate = async (values: any) => {
    try {
      if (!accessToken) return;
      setIsOrgSaving(true);

      const updateData: any = {
        organization_id: organizationId,
        organization_alias: values.organization_alias,
        models: values.models,
        litellm_budget_table: {
          tpm_limit: values.tpm_limit,
          rpm_limit: values.rpm_limit,
          max_budget: values.max_budget,
          budget_duration: values.budget_duration,
        },
        metadata: values.metadata ? JSON.parse(values.metadata) : null,
      };

      // Handle object_permission updates
      if (values.vector_stores !== undefined || values.mcp_servers_and_groups !== undefined) {
        updateData.object_permission = {
          ...orgData?.object_permission,
          vector_stores: values.vector_stores || [],
        };

        if (values.mcp_servers_and_groups !== undefined) {
          const { servers, accessGroups } = values.mcp_servers_and_groups || {
            servers: [],
            accessGroups: [],
          };
          if (servers && servers.length > 0) {
            updateData.object_permission.mcp_servers = servers;
          }
          if (accessGroups && accessGroups.length > 0) {
            updateData.object_permission.mcp_access_groups = accessGroups;
          }
        }
      }

      const response = await organizationUpdateCall(accessToken, updateData);

      NotificationsManager.success("Configurações da organização atualizadas com sucesso");
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
    } catch (error) {
      NotificationsManager.fromBackend("Falha ao atualizar configurações da organização");
      console.error("Error updating organization:", error);
    } finally {
      setIsOrgSaving(false);
    }
  };

  if (loading) {
    return <div className="p-4">Carregando...</div>;
  }

  if (!orgData) {
    return <div className="p-4">Organização não encontrada</div>;
  }

  const copyToClipboard = async (text: string | null | undefined, key: string) => {
    const success = await utilCopyToClipboard(text);
    if (success) {
      setCopiedStates((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [key]: false }));
      }, 2000);
    }
  };

  const orgExtraColumns: ColumnsType<Member> = [
    {
      title: "Gasto (USD)",
      key: "spend",
      render: (_: unknown, record: Member) => {
        const orgMember =
          record.user_id != null ? (orgData.members || []).find((m) => m.user_id === record.user_id) : undefined;
        return <MoneyCell value={orgMember?.spend} decimals={4} />;
      },
    },
    {
      title: "Criado Em",
      key: "created_at",
      render: (_: unknown, record: Member) => {
        const orgMember =
          record.user_id != null ? (orgData.members || []).find((m) => m.user_id === record.user_id) : undefined;
        return (
          <Typography.Text>
            {orgMember?.created_at ? new Date(orgMember.created_at).toLocaleString() : "-"}
          </Typography.Text>
        );
      },
    },
  ];

  return (
    <div className="w-full h-screen p-4 bg-white">
      <div className="flex justify-between items-center mb-6">
        <div>
          <TremorButton icon={ArrowLeftIcon} onClick={onClose} variant="light" className="mb-4">
            Voltar para Organizações
          </TremorButton>
          <Title>{orgData.organization_alias}</Title>
          <div className="flex items-center cursor-pointer">
            <Text className="text-gray-500 font-mono">{orgData.organization_id}</Text>
            <Button
              type="text"
              size="small"
              icon={copiedStates["org-id"] ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
              onClick={() => copyToClipboard(orgData.organization_id, "org-id")}
              className={`left-2 z-10 transition-all duration-200 ${
                copiedStates["org-id"]
                  ? "text-green-600 bg-green-50 border-green-200"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
            />
          </div>
        </div>
      </div>

      <Tabs
        defaultActiveKey={editOrg ? "settings" : "overview"}
        className="mb-4"
        items={[
          {
            key: "overview",
            label: "Visão Geral",
            children: (
              <Grid numItems={1} numItemsSm={2} numItemsLg={3} className="gap-6">
                <Card>
                  <Text>Detalhes da Organização</Text>
                  <div className="mt-2">
                    <Text>Criado: {new Date(orgData.created_at).toLocaleDateString()}</Text>
                    <Text>Atualizado: {new Date(orgData.updated_at).toLocaleDateString()}</Text>
                    <Text>Criado Por: {orgData.created_by}</Text>
                  </div>
                </Card>

                <Card>
                  <Text>Status do Orçamento</Text>
                  <div className="mt-2">
                    <Title><MoneyCell value={orgData.spend} decimals={4} /></Title>
                    <Text>
                      of{" "}
                      {orgData.litellm_budget_table.max_budget === null
                        ? "Ilimitado"
                        : <MoneyCell value={orgData.litellm_budget_table.max_budget} decimals={4} />}
                    </Text>
                    {orgData.litellm_budget_table.budget_duration && (
                      <Text className="text-gray-500">Reiniciar: {orgData.litellm_budget_table.budget_duration}</Text>
                    )}
                  </div>
                </Card>

                <Card>
                  <Text>Limites de Taxa</Text>
                  <div className="mt-2">
                    <Text>TPM: {orgData.litellm_budget_table.tpm_limit || "Ilimitado"}</Text>
                    <Text>RPM: {orgData.litellm_budget_table.rpm_limit || "Ilimitado"}</Text>
                    {orgData.litellm_budget_table.max_parallel_requests && (
                      <Text>Máx. Solicitações Paralelas: {orgData.litellm_budget_table.max_parallel_requests}</Text>
                    )}
                  </div>
                </Card>

                <Card>
                  <Text>Modelos</Text>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {orgData.models.length === 0 ? (
                      <Badge color="red">Todos os modelos proxy</Badge>
                    ) : (
                      orgData.models.map((model, index) => (
                        <Badge key={index} color="red">
                          {model}
                        </Badge>
                      ))
                    )}
                  </div>
                </Card>
                <Card>
                  <Text>Equipes</Text>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {orgData.teams?.map((team, index) => (
                      <Badge key={index} color="red">
                        {teamAliasMap[team.team_id] || team.team_id}
                      </Badge>
                    ))}
                  </div>
                </Card>

                <ObjectPermissionsView
                  objectPermission={orgData.object_permission}
                  variant="card"
                  accessToken={accessToken}
                />
              </Grid>
            ),
          },
          {
            key: "members",
            label: "Membros",
            children: (
              <div className="space-y-4">
                <MemberTable
                  members={(orgData.members || []).map((m) => ({
                    role: m.user_role || "",
                    user_id: m.user_id,
                    user_email: m.user_email,
                  }))}
                  canEdit={canEditOrg}
                  onEdit={(member) => {
                    setSelectedEditMember(member);
                    setIsEditMemberModalVisible(true);
                  }}
                  onDelete={(member) => handleMemberDelete(member)}
                  onAddMember={() => setIsAddMemberModalVisible(true)}
                  roleColumnTitle="Papel na Organização"
                  extraColumns={orgExtraColumns}
                  emptyText="Nenhum membro encontrado"
                />
              </div>
            ),
          },
          {
            key: "settings",
            label: "Configurações",
            children: (
              <Card className="overflow-y-auto max-h-[65vh]">
                <div className="flex justify-between items-center mb-4">
                  <Title>Configurações da Organização</Title>
                  {canEditOrg && !isEditing && (
                    <TremorButton onClick={() => setIsEditing(true)}>Editar Configurações</TremorButton>
                  )}
                </div>

                {isEditing ? (
                  <Form
                    form={form}
                    onFinish={handleOrgUpdate}
                    initialValues={{
                      organization_alias: orgData.organization_alias,
                      models: orgData.models,
                      tpm_limit: orgData.litellm_budget_table.tpm_limit,
                      rpm_limit: orgData.litellm_budget_table.rpm_limit,
                      max_budget: orgData.litellm_budget_table.max_budget,
                      budget_duration: orgData.litellm_budget_table.budget_duration,
                      metadata: orgData.metadata ? JSON.stringify(orgData.metadata, null, 2) : "",
                      vector_stores: orgData.object_permission?.vector_stores || [],
                      mcp_servers_and_groups: {
                        servers: orgData.object_permission?.mcp_servers || [],
                        accessGroups: orgData.object_permission?.mcp_access_groups || [],
                      },
                    }}
                    layout="vertical"
                  >
                    <Form.Item
                      label="Nome da Organização"
                      name="organization_alias"
                      rules={[
                        {
                          required: true,
                          message: "Por favor, informe o nome da organização",
                        },
                      ]}
                    >
                      <TextInput />
                    </Form.Item>

                    <Form.Item label="Modelos" name="models">
                      <ModelSelect
                        value={form.getFieldValue("models")}
                        onChange={(values) => form.setFieldValue("models", values)}
                        context="organization"
                        options={{
                          includeSpecialOptions: true,
                          showAllProxyModelsOverride: true,
                        }}
                      />
                    </Form.Item>

                    <Form.Item label={`Orçamento Máximo (${symbol})`} name="max_budget">
                      <CurrencyMoneyInput />
                    </Form.Item>

                    <Form.Item label="Reiniciar Orçamento" name="budget_duration">
                      <Select placeholder="n/a">
                        <Select.Option value="24h">diário</Select.Option>
                        <Select.Option value="7d">semanal</Select.Option>
                        <Select.Option value="30d">mensal</Select.Option>
                      </Select>
                    </Form.Item>

                    <Form.Item label="Limite de Tokens por Minuto (TPM)" name="tpm_limit">
                      <NumberInput step={1} style={{ width: "100%" }} />
                    </Form.Item>

                    <Form.Item label="Limite de Requisições por Minuto (RPM)" name="rpm_limit">
                      <NumberInput step={1} style={{ width: "100%" }} />
                    </Form.Item>

                    <Form.Item label="Armazenamentos Vetoriais" name="vector_stores">
                      <VectorStoreSelector
                        onChange={(values) => form.setFieldValue("vector_stores", values)}
                        value={form.getFieldValue("vector_stores")}
                        accessToken={accessToken || ""}
                        placeholder="Selecionar armazenamentos vetoriais"
                      />
                    </Form.Item>

                    <Form.Item label="Servidores MCP e Grupos de Acesso" name="mcp_servers_and_groups">
                      <MCPServerSelector
                        onChange={(values) => form.setFieldValue("mcp_servers_and_groups", values)}
                        value={form.getFieldValue("mcp_servers_and_groups")}
                        accessToken={accessToken || ""}
                        placeholder="Selecionar servidores MCP e grupos de acesso"
                      />
                    </Form.Item>

                    <Form.Item label="Metadados" name="metadata">
                      <Input.TextArea rows={4} />
                    </Form.Item>

                    <div className="sticky z-10 bg-white p-4 border-t border-gray-200 -bottom-6 -inset-x-6">
                      <div className="flex justify-end items-center gap-2">
                        <TremorButton variant="secondary" onClick={() => setIsEditing(false)} disabled={isOrgSaving}>
                          Cancelar
                        </TremorButton>
                        <TremorButton type="submit" loading={isOrgSaving}>
                          Salvar Alterações
                        </TremorButton>
                      </div>
                    </div>
                  </Form>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Text className="font-medium">Nome da Organização</Text>
                      <div>{orgData.organization_alias}</div>
                    </div>
                    <div>
                      <Text className="font-medium">ID da Organização</Text>
                      <div className="font-mono">{orgData.organization_id}</div>
                    </div>
                    <div>
                      <Text className="font-medium">Criado Em</Text>
                      <div>{new Date(orgData.created_at).toLocaleString()}</div>
                    </div>
                    <div>
                      <Text className="font-medium">Modelos</Text>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {orgData.models.map((model, index) => (
                          <Badge key={index} color="red">
                            {model}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Text className="font-medium">Limites de Taxa</Text>
                      <div>TPM: {orgData.litellm_budget_table.tpm_limit || "Ilimitado"}</div>
                      <div>RPM: {orgData.litellm_budget_table.rpm_limit || "Ilimitado"}</div>
                    </div>
                    <div>
                      <Text className="font-medium">Orçamento</Text>
                      <div>
                        Máx:{" "}
                        {orgData.litellm_budget_table.max_budget !== null
                          ? <MoneyCell value={orgData.litellm_budget_table.max_budget} decimals={4} />
                          : "Sem limite"}
                      </div>
                      <div>Reiniciar: {orgData.litellm_budget_table.budget_duration || "Nunca"}</div>
                    </div>

                    <ObjectPermissionsView
                      objectPermission={orgData.object_permission}
                      variant="inline"
                      className="pt-4 border-t border-gray-200"
                      accessToken={accessToken}
                    />
                  </div>
                )}
              </Card>
            ),
          },
        ]}
      />
      <UserSearchModal
        isVisible={isAddMemberModalVisible}
        onCancel={() => setIsAddMemberModalVisible(false)}
        onSubmit={handleMemberAdd}
        accessToken={accessToken}
        title="Adicionar Membro à Organização"
        roles={[
          {
            label: "org_admin",
            value: "org_admin",
            description: "Pode adicionar e remover membros e alterar seus papéis.",
          },
          {
            label: "internal_user",
            value: "internal_user",
            description: "Pode visualizar/criar chaves para si mesmo dentro da organização.",
          },
          {
            label: "internal_user_viewer",
            value: "internal_user_viewer",
            description: "Só pode visualizar suas chaves dentro da organização.",
          },
        ]}
        defaultRole="internal_user"
      />
      <MemberModal
        visible={isEditMemberModalVisible}
        onCancel={() => setIsEditMemberModalVisible(false)}
        onSubmit={handleMemberUpdate}
        initialData={selectedEditMember}
        mode="edit"
        config={{
          title: "Editar Membro",
          showEmail: true,
          showUserId: true,
          roleOptions: [
            { label: "Administrador da Organização", value: "org_admin" },
            { label: "Usuário Interno", value: "internal_user" },
            { label: "Visualizador de Usuário Interno", value: "internal_user_viewer" },
          ],
        }}
      />
    </div>
  );
};

export default OrganizationInfoView;
