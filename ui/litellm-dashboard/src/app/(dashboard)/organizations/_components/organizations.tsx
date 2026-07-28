import { organizationKeys, useOrganizations } from "@/app/(dashboard)/hooks/organizations/useOrganizations";
import { useUserModels } from "@/app/(dashboard)/hooks/models/useModels";
import OrganizationFilters, { FilterState } from "@/app/(dashboard)/organizations/OrganizationFilters";
import { InfoCircleOutlined } from "@ant-design/icons";
import { ChevronDownIcon, ChevronRightIcon, RefreshIcon } from "@heroicons/react/outline";
import {
  Badge,
  Button,
  Card,
  Col,
  Grid,
  Icon,
  Tab,
  TabGroup,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TabList,
  TabPanel,
  TabPanels,
  Text,
  TextInput,
} from "@tremor/react";
import { Form, Input, Modal, Select as Select2, Tooltip } from "antd";
import { useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { DateCell, IdCell, MoneyCell } from "@/components/shared/table_cells";
import DeleteResourceModal from "@/components/common_components/DeleteResourceModal";
import TableIconActionButton from "@/components/common_components/IconActionButton/TableIconActionButtons/TableIconActionButton";
import { getModelDisplayName } from "@/components/key_team_helpers/fetch_available_models_team_key";
import MCPServerSelector from "@/components/mcp_server_management/MCPServerSelector";
import { ModelSelect } from "@/components/ModelSelect/ModelSelect";
import NotificationsManager from "@/components/molecules/notifications_manager";
import {
  Organization,
  organizationCreateCall,
  organizationDeleteCall,
  organizationListCall,
} from "@/components/networking";
import OrganizationInfoView from "@/components/organization/organization_view";
import CurrencyMoneyInput from "@/components/shared/CurrencyMoneyInput";
import VectorStoreSelector from "@/components/vector_store_management/VectorStoreSelector";

interface OrganizationsTableProps {
  userRole: string;
  accessToken: string | null;
  lastRefreshed?: string;
  handleRefreshClick?: () => void;
  premiumUser: boolean;
}

export const fetchOrganizations = async (
  accessToken: string,
  setOrganizations: (organizations: Organization[]) => void,
  org_id: string | null = null,
  org_alias: string | null = null,
) => {
  const organizations = await organizationListCall(accessToken, org_id, org_alias);
  setOrganizations(organizations);
};

const OrganizationsTable: React.FC<OrganizationsTableProps> = ({
  userRole,
  accessToken,
  lastRefreshed,
  handleRefreshClick,
  premiumUser,
}) => {
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [editOrg, setEditOrg] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOrgModalVisible, setIsOrgModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [expandedAccordions, setExpandedAccordions] = useState<Record<string, boolean>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    org_id: "",
    org_alias: "",
    sort_by: "created_at",
    sort_order: "desc",
  });

  const queryClient = useQueryClient();
  const { data: organizations = [] } = useOrganizations({ org_id: filters.org_id, org_alias: filters.org_alias });
  const { data: userModels = [] } = useUserModels();

  const refetchOrganizations = () => queryClient.invalidateQueries({ queryKey: organizationKeys.lists() });

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((previousFilters) => ({ ...previousFilters, [key]: value }));
  };

  const handleFilterReset = () => {
    setFilters({
      org_id: "",
      org_alias: "",
      sort_by: "created_at",
      sort_order: "desc",
    });
  };

  const handleDelete = (orgId: string | null) => {
    if (!orgId) return;

    setOrgToDelete(orgId);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!orgToDelete || !accessToken) return;

    try {
      setIsDeleting(true);
      await organizationDeleteCall(accessToken, orgToDelete);
      NotificationsManager.success("Organization deleted successfully");

      setIsDeleteModalOpen(false);
      setOrgToDelete(null);
      await refetchOrganizations();
    } catch (error) {
      console.error("Error deleting organization:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setOrgToDelete(null);
  };

  const handleCreate = async (values: any) => {
    try {
      if (!accessToken) return;

      // Transform allowed_vector_store_ids and allowed_mcp_servers_and_groups into object_permission
      if (
        (values.allowed_vector_store_ids && values.allowed_vector_store_ids.length > 0) ||
        (values.allowed_mcp_servers_and_groups &&
          (values.allowed_mcp_servers_and_groups.servers?.length > 0 ||
            values.allowed_mcp_servers_and_groups.accessGroups?.length > 0))
      ) {
        values.object_permission = {};
        if (values.allowed_vector_store_ids && values.allowed_vector_store_ids.length > 0) {
          values.object_permission.vector_stores = values.allowed_vector_store_ids;
          delete values.allowed_vector_store_ids;
        }
        if (values.allowed_mcp_servers_and_groups) {
          if (values.allowed_mcp_servers_and_groups.servers?.length > 0) {
            values.object_permission.mcp_servers = values.allowed_mcp_servers_and_groups.servers;
          }
          if (values.allowed_mcp_servers_and_groups.accessGroups?.length > 0) {
            values.object_permission.mcp_access_groups = values.allowed_mcp_servers_and_groups.accessGroups;
          }
          delete values.allowed_mcp_servers_and_groups;
        }
      }

      await organizationCreateCall(accessToken, values);
      NotificationsManager.success("Organization created successfully");
      setIsOrgModalVisible(false);
      form.resetFields();
      await refetchOrganizations();
    } catch (error) {
      console.error("Error creating organization:", error);
    }
  };

  const handleCancel = () => {
    setIsOrgModalVisible(false);
    form.resetFields();
  };

  if (!premiumUser) {
    return (
      <div>
        <Text>
          Este é um recurso Enterprise do Polyglot e requer uma chave válida para ser usado. Obtenha uma chave de teste{" "}
          <a href="https://www.litellm.ai/#pricing" target="_blank" rel="noopener noreferrer">
            aqui
          </a>
          .
        </Text>
      </div>
    );
  }

  return (
    <div className="mx-4 h-[75vh]">
      <Grid numItems={1} className="gap-2 p-8 w-full mt-2">
        <Col numColSpan={1} className="flex flex-col gap-2">
          {(userRole === "Admin" || userRole === "Org Admin") && (
            <Button className="w-fit" onClick={() => setIsOrgModalVisible(true)}>
              + Criar Nova Organização
            </Button>
          )}
          {selectedOrgId ? (
            <OrganizationInfoView
              organizationId={selectedOrgId}
              onClose={() => {
                setSelectedOrgId(null);
                setEditOrg(false);
              }}
              accessToken={accessToken}
              is_org_admin={true} // You'll need to implement proper org admin check
              is_proxy_admin={userRole === "Admin"}
              userModels={userModels}
              editOrg={editOrg}
            />
          ) : (
            <TabGroup className="gap-2 h-[75vh] w-full">
              <TabList className="flex justify-between mt-2 w-full items-center">
                <div className="flex">
                  <Tab>Your Organizations</Tab>
                </div>
                <div className="flex items-center space-x-2">
                  {lastRefreshed && <Text>Last Refreshed: {lastRefreshed}</Text>}
                  <Icon
                    icon={RefreshIcon}
                    variant="shadow"
                    size="xs"
                    className="self-center"
                    onClick={handleRefreshClick}
                  />
                </div>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <Text>Clique em "ID da Organização" para ver os detalhes da organização.</Text>
                  <Grid numItems={1} className="gap-2 pt-2 pb-2 h-[75vh] w-full mt-2">
                    <Col numColSpan={1}>
                      <Card className="w-full mx-auto flex-auto overflow-hidden overflow-y-auto max-h-[50vh]">
                        <div className="border-b px-6 py-4">
                          <div className="flex flex-col space-y-4">
                            <OrganizationFilters
                              filters={filters}
                              showFilters={showFilters}
                              onToggleFilters={setShowFilters}
                              onChange={handleFilterChange}
                              onReset={handleFilterReset}
                            />
                          </div>
                        </div>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableHeaderCell>ID da Organização</TableHeaderCell>
                              <TableHeaderCell>Nome da Organização</TableHeaderCell>
                              <TableHeaderCell>Criado</TableHeaderCell>
                              <TableHeaderCell>Gasto (USD)</TableHeaderCell>
                              <TableHeaderCell>Orçamento (USD)</TableHeaderCell>
                              <TableHeaderCell>Modelos</TableHeaderCell>
                              <TableHeaderCell>Limites TPM / RPM</TableHeaderCell>
                              <TableHeaderCell>Informações</TableHeaderCell>
                              <TableHeaderCell>Ações</TableHeaderCell>
                            </TableRow>
                          </TableHead>

                          <TableBody>
                            {organizations && organizations.length > 0
                              ? organizations
                                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                  .map((org: Organization) => (
                                    <TableRow key={org.organization_id}>
                                      <TableCell>
                                        <IdCell value={org.organization_id} onClick={setSelectedOrgId} />
                                      </TableCell>
                                      <TableCell>{org.organization_alias}</TableCell>
                                      <TableCell>
                                        <DateCell value={org.created_at} precision="date" />
                                      </TableCell>
                                      <TableCell>
                                        <MoneyCell value={org.spend} decimals={4} />
                                      </TableCell>
                                      <TableCell>
                                        <MoneyCell
                                          value={org.litellm_budget_table?.max_budget}
                                          decimals={2}
                                          emptyText="Unlimited"
                                          showZero
                                        />
                                      </TableCell>
                                      <TableCell
                                        style={{
                                          maxWidth: "8-x",
                                          whiteSpace: "pre-wrap",
                                          overflow: "hidden",
                                        }}
                                        className={org.models.length > 3 ? "px-0" : ""}
                                      >
                                        <div className="flex flex-col">
                                          {Array.isArray(org.models) ? (
                                            <div className="flex flex-col">
                                              {org.models.length === 0 ? (
                                                <Badge size={"xs"} className="mb-1" color="red">
                                                  <Text>All Proxy Models</Text>
                                                </Badge>
                                              ) : (
                                                <>
                                                  <div className="flex items-start">
                                                    {org.models.length > 3 && (
                                                      <div>
                                                        <Icon
                                                          icon={
                                                            expandedAccordions[org.organization_id || ""]
                                                              ? ChevronDownIcon
                                                              : ChevronRightIcon
                                                          }
                                                          className="cursor-pointer"
                                                          size="xs"
                                                          onClick={() => {
                                                            setExpandedAccordions((prev) => ({
                                                              ...prev,
                                                              [org.organization_id || ""]:
                                                                !prev[org.organization_id || ""],
                                                            }));
                                                          }}
                                                        />
                                                      </div>
                                                    )}
                                                    <div className="flex flex-wrap gap-1">
                                                      {org.models.slice(0, 3).map((model, index) =>
                                                        model === "all-proxy-models" ? (
                                                          <Badge key={index} size={"xs"} color="red">
                                                            <Text>Todos os Modelos do Proxy</Text>
                                                          </Badge>
                                                        ) : (
                                                          <Badge key={index} size={"xs"} color="blue">
                                                            <Text>
                                                              {model.length > 30
                                                                ? `${getModelDisplayName(model).slice(0, 30)}...`
                                                                : getModelDisplayName(model)}
                                                            </Text>
                                                          </Badge>
                                                        ),
                                                      )}
                                                      {org.models.length > 3 &&
                                                        !expandedAccordions[org.organization_id || ""] && (
                                                          <Badge size={"xs"} color="gray" className="cursor-pointer">
                                                            <Text>
                                                              +{org.models.length - 3}{" "}
                                                              {org.models.length - 3 === 1
                                                                ? "mais modelo"
                                                                : "mais modelos"}
                                                            </Text>
                                                          </Badge>
                                                        )}
                                                      {expandedAccordions[org.organization_id || ""] && (
                                                        <div className="flex flex-wrap gap-1">
                                                          {org.models.slice(3).map((model, index) =>
                                                            model === "all-proxy-models" ? (
                                                              <Badge key={index + 3} size={"xs"} color="red">
                                                                <Text>Todos os Modelos do Proxy</Text>
                                                              </Badge>
                                                            ) : (
                                                              <Badge key={index + 3} size={"xs"} color="blue">
                                                                <Text>
                                                                  {model.length > 30
                                                                    ? `${getModelDisplayName(model).slice(0, 30)}...`
                                                                    : getModelDisplayName(model)}
                                                                </Text>
                                                              </Badge>
                                                            ),
                                                          )}
                                                        </div>
                                                      )}
                                                    </div>
                                                  </div>
                                                </>
                                              )}
                                            </div>
                                          ) : null}
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <Text>
                                          TPM:{" "}
                                          {org.litellm_budget_table?.tpm_limit
                                            ? org.litellm_budget_table?.tpm_limit
                                            : "Ilimitado"}
                                          <br />
                                          RPM:{" "}
                                          {org.litellm_budget_table?.rpm_limit
                                            ? org.litellm_budget_table?.rpm_limit
                                            : "Ilimitado"}
                                        </Text>
                                      </TableCell>
                                      <TableCell>
                                        <Text>{org.members?.length || 0} Membros</Text>
                                      </TableCell>
                                      <TableCell>
                                        {userRole === "Admin" && (
                                          <>
                                            <TableIconActionButton
                                              variant="Edit"
                                              tooltipText="Editar organização"
                                              onClick={() => {
                                                setSelectedOrgId(org.organization_id);
                                                setEditOrg(true);
                                              }}
                                            />
                                            <TableIconActionButton
                                              variant="Delete"
                                              tooltipText="Excluir organização"
                                              onClick={() => handleDelete(org.organization_id)}
                                            />
                                          </>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ))
                              : null}
                          </TableBody>
                        </Table>
                      </Card>
                    </Col>
                  </Grid>
                </TabPanel>
              </TabPanels>
            </TabGroup>
          )}
        </Col>
      </Grid>
      <Modal title="Criar Organização" visible={isOrgModalVisible} width={800} footer={null} onCancel={handleCancel}>
        <Form form={form} onFinish={handleCreate} labelCol={{ span: 8 }} wrapperCol={{ span: 16 }} labelAlign="left">
          <Form.Item
            label="Nome da Organização"
            name="organization_alias"
            rules={[
              {
                required: true,
                message: "Por favor, insira um nome para a organização",
              },
            ]}
          >
            <TextInput placeholder="" />
          </Form.Item>
          <Form.Item label="Modelos" name="models">
            <ModelSelect
              options={{ showAllProxyModelsOverride: true, includeSpecialOptions: true }}
              value={form.getFieldValue("models")}
              onChange={(values) => form.setFieldValue("models", values)}
              context="organization"
            />
          </Form.Item>

          <Form.Item label="Orçamento Máximo (USD)" name="max_budget">
            <CurrencyMoneyInput />
          </Form.Item>
          <Form.Item label="Reiniciar Orçamento" name="budget_duration">
            <Select2 defaultValue={null} placeholder="n/a">
              <Select2.Option value="24h">diariamente</Select2.Option>
              <Select2.Option value="7d">semanalmente</Select2.Option>
              <Select2.Option value="30d">mensalmente</Select2.Option>
            </Select2>
          </Form.Item>
          <Form.Item label="Limite de Tokens por Minuto (TPM)" name="tpm_limit">
            <NumericalInput step={1} width={400} />
          </Form.Item>
          <Form.Item label="Limite de Requisições por Minuto (RPM)" name="rpm_limit">
            <NumericalInput step={1} width={400} />
          </Form.Item>

          <Form.Item
            label={
              <span>
                Lojas de Vetores Permitidas{" "}
                <Tooltip title="Selecione quais lojas de vetores essa organização pode acessar por padrão. Deixe vazio para acesso a todas as lojas de vetores">
                  <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                </Tooltip>
              </span>
            }
            name="allowed_vector_store_ids"
            className="mt-4"
            help="Selecione lojas de vetores que essa organização pode acessar. Deixe vazio para acesso a todas as lojas de vetores"
          >
            <VectorStoreSelector
              onChange={(values) => form.setFieldValue("allowed_vector_store_ids", values)}
              value={form.getFieldValue("allowed_vector_store_ids")}
              accessToken={accessToken || ""}
              placeholder="Selecione lojas de vetores (opcional)"
            />
          </Form.Item>

          <Form.Item
            label={
              <span>
                Servidores MCP Permitidos{" "}
                <Tooltip title="Selecione quais servidores MCP e grupos de acesso essa organização pode acessar por padrão.">
                  <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                </Tooltip>
              </span>
            }
            name="allowed_mcp_servers_and_groups"
            className="mt-4"
            help="Selecione servidores MCP e grupos de acesso que essa organização pode acessar."
          >
            <MCPServerSelector
              onChange={(values) => form.setFieldValue("allowed_mcp_servers_and_groups", values)}
              value={form.getFieldValue("allowed_mcp_servers_and_groups")}
              accessToken={accessToken || ""}
              placeholder="Selecione servidores MCP e grupos de acesso (opcional)"
            />
          </Form.Item>

          <Form.Item label="Metadados" name="metadata">
            <Input.TextArea rows={4} />
          </Form.Item>

          <div style={{ textAlign: "right", marginTop: "10px" }}>
            <Button type="submit">Criar Organização</Button>
          </div>
        </Form>
      </Modal>

      <DeleteResourceModal
        isOpen={isDeleteModalOpen}
        title="Excluir Organização?"
        message="Tem certeza que deseja excluir esta organização? Esta ação não pode ser desfeita."
        resourceInformationTitle="Informações da Organização"
        resourceInformation={[{ label: "ID da Organização", value: orgToDelete, code: true }]}
        onCancel={cancelDelete}
        onOk={confirmDelete}
        confirmLoading={isDeleting}
      />
    </div>
  );
};

export default OrganizationsTable;
