import { useOrganizations } from "@/app/(dashboard)/hooks/organizations/useOrganizations";
import AvailableTeamsPanel from "@/components/team/AvailableTeamsPanel";
import TeamInfoView from "@/components/team/TeamInfo";
import TeamSSOSettings from "@/components/TeamSSOSettings";
import { isProxyAdminRole } from "@/utils/roles";
import { InfoCircleOutlined } from "@ant-design/icons";
import { Accordion, AccordionBody, AccordionHeader, TextInput } from "@tremor/react";
import { Button, Form, Input, Layout, Modal, Select, Switch, Tabs, theme, Tooltip, Typography } from "antd";
import { Plus, Users } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button as UIButton } from "@/components/ui/button";
import { teamsTableKeys } from "@/app/(dashboard)/hooks/teams/useTeams";
import { TeamsTable } from "./TeamsPage/TeamsTable";
import AccessGroupSelector from "./common_components/AccessGroupSelector";
import PassThroughRoutesSelector from "./common_components/PassThroughRoutesSelector";
import AgentSelector from "./agent_management/AgentSelector";
import ModelAliasManager from "./common_components/ModelAliasManager";
import PremiumLoggingSettings from "./common_components/PremiumLoggingSettings";
import RouterSettingsAccordion, { RouterSettingsAccordionValue } from "./common_components/RouterSettingsAccordion";
import {
  fetchAvailableModelsForTeamOrKey,
  unfurlWildcardModelsInList,
} from "./key_team_helpers/fetch_available_models_team_key";
import type { Team } from "./key_team_helpers/key_list";
import MCPServerSelector from "./mcp_server_management/MCPServerSelector";
import MCPToolPermissions from "./mcp_server_management/MCPToolPermissions";
import NotificationsManager from "./molecules/notifications_manager";
import { Organization, fetchMCPAccessGroups, getGuardrailsList, getPoliciesList, teamDeleteCall } from "./networking";
import { useCurrency } from "@/contexts/CurrencyContext";
import NumericalInput from "./shared/numerical_input";
import VectorStoreSelector from "./vector_store_management/VectorStoreSelector";
import SearchToolSelector from "./search_tools/SearchToolSelector";
import { CurrencyMoneyInput } from "@/components/shared/CurrencyMoneyInput";

interface TeamProps {
  accessToken: string | null;
  userID: string | null;
  userRole: string | null;
  premiumUser?: boolean;
}

interface EditTeamModalProps {
  visible: boolean;
  onCancel: () => void;
  team: any; // Assuming TeamType is a type representing your team object
  onSubmit: (data: FormData) => void; // Assuming FormData is the type of data to be submitted
}

import DeleteResourceModal from "./common_components/DeleteResourceModal";
import { teamCreateCall } from "./networking";
import { ModelSelect } from "./ModelSelect/ModelSelect";

const getOrganizationModels = (organization: Organization | null, userModels: string[]) => {
  let tempModelsToPick = [];

  if (organization) {
    if (organization.models.length > 0) {
      tempModelsToPick = organization.models;
    } else {
      // show all available models if the team has no models set
      tempModelsToPick = userModels;
    }
  } else {
    // no team set, show all available models
    tempModelsToPick = userModels;
  }

  return unfurlWildcardModelsInList(tempModelsToPick, userModels);
};

const canCreateOrManageTeams = (
  userRole: string | null,
  userID: string | null,
  organizations: Organization[] | null,
): boolean => {
  // Admin role always has permission
  if (userRole === "Admin") {
    return true;
  }

  // Check if user is an org_admin in any organization
  if (organizations && userID) {
    return organizations.some((org) =>
      org.members?.some((member) => member.user_id === userID && member.user_role === "org_admin"),
    );
  }

  return false;
};

const getAdminOrganizations = (
  userRole: string | null,
  userID: string | null,
  organizations: Organization[] | null,
): Organization[] => {
  // Global Admin can see all organizations
  if (userRole === "Admin") {
    return organizations || [];
  }

  // Org Admin can only see organizations they're an admin for
  if (organizations && userID) {
    return organizations.filter((org) =>
      org.members?.some((member) => member.user_id === userID && member.user_role === "org_admin"),
    );
  }

  return [];
};

const getOrganizationAlias = (
  organizationId: string | null | undefined,
  organizations: Organization[] | null | undefined,
): string => {
  if (!organizationId || !organizations) {
    return organizationId || "N/A";
  }

  const organization = organizations.find((org) => org.organization_id === organizationId);
  return organization?.organization_alias || organizationId;
};

// @deprecated
const Teams: React.FC<TeamProps> = ({ accessToken, userID, userRole, premiumUser = false }) => {
  const { currency } = useCurrency();
  const { data: organizationsData } = useOrganizations();
  const organizations = organizationsData ?? null;
  const queryClient = useQueryClient();
  const refreshTeams = () => queryClient.invalidateQueries({ queryKey: teamsTableKeys.all });
  const [currentOrg] = useState<Organization | null>(null);
  const [currentOrgForCreateTeam, setCurrentOrgForCreateTeam] = useState<Organization | null>(null);

  const [form] = Form.useForm();
  const [memberForm] = Form.useForm();
  const [value, setValue] = useState("");
  const [editModalVisible, setEditModalVisible] = useState(false);

  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [editTeam, setEditTeam] = useState<boolean>(false);

  const [isTeamModalVisible, setIsTeamModalVisible] = useState(false);
  const [isAddMemberModalVisible, setIsAddMemberModalVisible] = useState(false);
  const [isEditMemberModalVisible, setIsEditMemberModalVisible] = useState(false);
  const [userModels, setUserModels] = useState<string[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [modelsToPick, setModelsToPick] = useState<string[]>([]);
  const [isTeamDeleting, setIsTeamDeleting] = useState(false);
  // Add this state near the other useState declarations
  const [guardrailsList, setGuardrailsList] = useState<string[]>([]);
  const [policiesList, setPoliciesList] = useState<string[]>([]);
  const [loggingSettings, setLoggingSettings] = useState<any[]>([]);
  const [mcpAccessGroups, setMcpAccessGroups] = useState<string[]>([]);
  const [mcpAccessGroupsLoaded, setMcpAccessGroupsLoaded] = useState(false);
  const [modelAliases, setModelAliases] = useState<{ [key: string]: string }>({});
  const [routerSettings, setRouterSettings] = useState<RouterSettingsAccordionValue | null>(null);
  const [routerSettingsKey, setRouterSettingsKey] = useState<number>(0);

  useEffect(() => {
    const models = getOrganizationModels(currentOrgForCreateTeam, userModels);
    setModelsToPick(models);
    form.setFieldValue("models", []);
  }, [currentOrgForCreateTeam, userModels]);

  // Handle organization preselection when modal opens
  useEffect(() => {
    if (isTeamModalVisible) {
      const adminOrgs = getAdminOrganizations(userRole, userID, organizations);
      const isOrgAdmin = userRole !== "Admin";

      // Org admins must scope a team to an org, so with exactly one we preselect it.
      // Proxy admins can create org-less teams, so the field stays optional regardless of org count.
      if (isOrgAdmin && adminOrgs.length === 1) {
        const org = adminOrgs[0];
        form.setFieldValue("organization_id", org.organization_id);
        setCurrentOrgForCreateTeam(org);
      } else {
        form.setFieldValue("organization_id", currentOrg?.organization_id || null);
        setCurrentOrgForCreateTeam(currentOrg);
      }
    }
  }, [isTeamModalVisible, userRole, userID, organizations, currentOrg]);

  // Add this useEffect to fetch guardrails
  useEffect(() => {
    const fetchGuardrails = async () => {
      try {
        if (accessToken == null) {
          return;
        }

        const response = await getGuardrailsList(accessToken);
        const guardrailNames = response.guardrails.map((g: { guardrail_name: string }) => g.guardrail_name);
        setGuardrailsList(guardrailNames);
      } catch (error) {
        console.error("Failed to fetch guardrails:", error);
      }
    };

    const fetchPolicies = async () => {
      try {
        if (accessToken == null) {
          return;
        }

        const response = await getPoliciesList(accessToken);
        const policyNames = response.policies.map((p: { policy_name: string }) => p.policy_name);
        setPoliciesList(policyNames);
      } catch (error) {
        console.error("Failed to fetch policies:", error);
      }
    };

    fetchGuardrails();
    fetchPolicies();
  }, [accessToken]);

  const fetchMcpAccessGroups = async () => {
    try {
      if (accessToken == null) {
        return;
      }
      const groups = await fetchMCPAccessGroups(accessToken);
      setMcpAccessGroups(groups);
    } catch (error) {
      console.error("Failed to fetch MCP access groups:", error);
    }
  };

  useEffect(() => {
    fetchMcpAccessGroups();
  }, [accessToken]);

  const handleOk = () => {
    setIsTeamModalVisible(false);
    form.resetFields();
    setLoggingSettings([]);
    setModelAliases({});
    setRouterSettings(null);
    setRouterSettingsKey((prev) => prev + 1);
  };

  const handleMemberOk = () => {
    setIsAddMemberModalVisible(false);
    setIsEditMemberModalVisible(false);
    memberForm.resetFields();
  };

  const handleCancel = () => {
    setIsTeamModalVisible(false);
    form.resetFields();
    setLoggingSettings([]);
    setModelAliases({});
    setRouterSettings(null);
    setRouterSettingsKey((prev) => prev + 1);
  };

  const handleMemberCancel = () => {
    setIsAddMemberModalVisible(false);
    setIsEditMemberModalVisible(false);
    memberForm.resetFields();
  };

  const handleDelete = async (team: Team) => {
    // Set the team to delete and open the confirmation modal
    setTeamToDelete(team);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (teamToDelete == null || accessToken == null) {
      return;
    }

    try {
      setIsTeamDeleting(true);
      await teamDeleteCall(accessToken, teamToDelete.team_id);
      await refreshTeams();
      NotificationsManager.success("Team deleted successfully");
    } catch (error) {
      NotificationsManager.fromBackend("Error deleting the team: " + error);
    } finally {
      setIsTeamDeleting(false);
      setIsDeleteModalOpen(false);
      setTeamToDelete(null);
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setTeamToDelete(null);
  };

  useEffect(() => {
    const fetchUserModels = async () => {
      try {
        if (userID === null || userRole === null || accessToken === null) {
          return;
        }
        const models = await fetchAvailableModelsForTeamOrKey(userID, userRole, accessToken);
        if (models) {
          setUserModels(models);
        }
      } catch (error) {
        console.error("Error fetching user models:", error);
      }
    };

    fetchUserModels();
  }, [accessToken, userID, userRole]);

  const handleCreate = async (formValues: Record<string, any>) => {
    try {
      if (accessToken != null) {
        let organizationId = formValues?.organization_id || currentOrg?.organization_id;
        if (organizationId === "" || typeof organizationId !== "string") {
          formValues.organization_id = null;
        } else {
          formValues.organization_id = organizationId.trim();
        }

        NotificationsManager.info("Creating Team");

        // Handle logging settings in metadata
        if (loggingSettings.length > 0) {
          let metadata = {};
          if (formValues.metadata) {
            try {
              metadata = JSON.parse(formValues.metadata);
            } catch (e) {
              console.warn("Invalid JSON in metadata field, starting with empty object");
            }
          }

          // Add logging settings to metadata
          metadata = {
            ...metadata,
            logging: loggingSettings.filter((config) => config.callback_name), // Only include configs with callback_name
          };

          formValues.metadata = JSON.stringify(metadata);
        }

        if (formValues.secret_manager_settings) {
          if (typeof formValues.secret_manager_settings === "string") {
            if (formValues.secret_manager_settings.trim() === "") {
              delete formValues.secret_manager_settings;
            } else {
              try {
                formValues.secret_manager_settings = JSON.parse(formValues.secret_manager_settings);
              } catch (e) {
                throw new Error("Failed to parse secret manager settings: " + e);
              }
            }
          }
        }

        const hasSearchTools =
          Array.isArray(formValues.object_permission_search_tools) &&
          formValues.object_permission_search_tools.length > 0;

        if (
          (formValues.allowed_vector_store_ids && formValues.allowed_vector_store_ids.length > 0) ||
          (formValues.allowed_mcp_servers_and_groups &&
            (formValues.allowed_mcp_servers_and_groups.servers?.length > 0 ||
              formValues.allowed_mcp_servers_and_groups.accessGroups?.length > 0 ||
              formValues.allowed_mcp_servers_and_groups.toolPermissions))
        ) {
          if (!formValues.object_permission) {
            formValues.object_permission = {};
          }
          if (formValues.allowed_vector_store_ids && formValues.allowed_vector_store_ids.length > 0) {
            formValues.object_permission.vector_stores = formValues.allowed_vector_store_ids;
            delete formValues.allowed_vector_store_ids;
          }
          if (formValues.allowed_mcp_servers_and_groups) {
            const { servers, accessGroups } = formValues.allowed_mcp_servers_and_groups;
            if (servers && servers.length > 0) {
              formValues.object_permission.mcp_servers = servers;
            }
            if (accessGroups && accessGroups.length > 0) {
              formValues.object_permission.mcp_access_groups = accessGroups;
            }
            delete formValues.allowed_mcp_servers_and_groups;
          }

          if (formValues.mcp_tool_permissions && Object.keys(formValues.mcp_tool_permissions).length > 0) {
            formValues.object_permission.mcp_tool_permissions = formValues.mcp_tool_permissions;
            delete formValues.mcp_tool_permissions;
          }
        }

        // Transform allowed_mcp_access_groups into object_permission
        if (formValues.allowed_mcp_access_groups && formValues.allowed_mcp_access_groups.length > 0) {
          if (!formValues.object_permission) {
            formValues.object_permission = {};
          }
          formValues.object_permission.mcp_access_groups = formValues.allowed_mcp_access_groups;
          delete formValues.allowed_mcp_access_groups;
        }

        // Handle agent permissions
        if (formValues.allowed_agents_and_groups) {
          const { agents, accessGroups } = formValues.allowed_agents_and_groups;
          if (!formValues.object_permission) {
            formValues.object_permission = {};
          }
          if (agents && agents.length > 0) {
            formValues.object_permission.agents = agents;
          }
          if (accessGroups && accessGroups.length > 0) {
            formValues.object_permission.agent_access_groups = accessGroups;
          }
          delete formValues.allowed_agents_and_groups;
        }

        if (hasSearchTools) {
          if (!formValues.object_permission) {
            formValues.object_permission = {};
          }
          formValues.object_permission.search_tools = formValues.object_permission_search_tools;
          delete formValues.object_permission_search_tools;
        }

        // Add model_aliases if any are defined
        if (Object.keys(modelAliases).length > 0) {
          formValues.model_aliases = modelAliases;
        }

        // Add router_settings if any are defined
        if (routerSettings?.router_settings) {
          // Only include router_settings if it has at least one non-null value
          const hasValues = Object.values(routerSettings.router_settings).some(
            (value) => value !== null && value !== undefined && value !== "",
          );
          if (hasValues) {
            formValues.router_settings = routerSettings.router_settings;
          }
        }

        await teamCreateCall(accessToken, formValues);
        NotificationsManager.success("Team created");
        await refreshTeams();
        form.resetFields();
        setLoggingSettings([]);
        setModelAliases({});
        setRouterSettings(null);
        setRouterSettingsKey((prev) => prev + 1);
        setIsTeamModalVisible(false);
      }
    } catch (error) {
      console.error("Error creating the team:", error);
      NotificationsManager.fromBackend("Error creating the team: " + error);
    }
  };

  const is_team_admin = (team: any) => {
    if (team == null || team.members_with_roles == null) {
      return false;
    }
    for (let i = 0; i < team.members_with_roles.length; i++) {
      let member = team.members_with_roles[i];
      if (member.user_id == userID && member.role == "admin") {
        return true;
      }
    }
    return false;
  };

  const { token } = theme.useToken();
  const { Text } = Typography;
  const { Content } = Layout;

  const tabItems = [
    {
      key: "your-teams",
      label: "Suas Equipes",
      children: (
        <>
          <TeamsTable
            userRole={userRole}
            userID={userID}
            onSelectTeam={(team) => {
              setSelectedTeam(team);
              setSelectedTeamId(team.team_id);
              setEditTeam(false);
            }}
            onEditTeam={(team) => {
              setSelectedTeam(team);
              setSelectedTeamId(team.team_id);
              setEditTeam(true);
            }}
            onDeleteTeam={handleDelete}
          />

          <DeleteResourceModal
            isOpen={isDeleteModalOpen}
            title="Excluir Equipe?"
            alertMessage={(() => {
              const deleteKeyCount = teamToDelete?.keys_count ?? teamToDelete?.keys?.length ?? 0;
              return deleteKeyCount === 0
                ? undefined
                : `Aviso: Esta equipe possui ${deleteKeyCount} chaves associadas a ela. Excluir a equipe também excluirá todas as chaves associadas, além de quaisquer modelos criados para esta equipe. Esta ação é irreversível.`;
            })()}
            message="Tem certeza de que deseja excluir esta equipe, todas as suas chaves e quaisquer modelos criados para ela? Esta ação não pode ser desfeita."
            resourceInformationTitle="Informações da Equipe"
            resourceInformation={[
              { label: "ID da Equipe", value: teamToDelete?.team_id, code: true },
              { label: "Nome da Equipe", value: teamToDelete?.team_alias },
              {
                label: "Chaves",
                value: teamToDelete?.keys_count ?? teamToDelete?.keys?.length ?? 0,
              },
              { label: "Membros", value: teamToDelete?.members_with_roles?.length },
            ]}
            requiredConfirmation={teamToDelete?.team_alias}
            onCancel={cancelDelete}
            onOk={confirmDelete}
            confirmLoading={isTeamDeleting}
          />
        </>
      ),
    },
    {
      key: "available-teams",
      label: "Equipes Disponíveis",
      children: <AvailableTeamsPanel accessToken={accessToken} userID={userID} />,
    },
    ...(isProxyAdminRole(userRole || "")
      ? [
          {
            key: "default-settings",
            label: "Default Team Settings",
            children: <TeamSSOSettings accessToken={accessToken} userID={userID || ""} userRole={userRole || ""} />,
          },
        ]
      : []),
  ];

  return (
    <Content style={{ padding: token.paddingLG, paddingInline: token.paddingLG * 2 }}>
      {selectedTeamId ? (
        <TeamInfoView
          teamId={selectedTeamId}
          onUpdate={() => {
            refreshTeams();
          }}
          onClose={() => {
            setSelectedTeam(null);
            setSelectedTeamId(null);
            setEditTeam(false);
          }}
          accessToken={accessToken}
          is_team_admin={is_team_admin(selectedTeam)}
          is_proxy_admin={userRole == "Admin"}
          userModels={userModels}
          editTeam={editTeam}
          premiumUser={premiumUser}
        />
      ) : (
        <>
          <div className="mb-4">
            <PageHeader
              icon={<Users className="size-5" />}
              title="Equipes"
              subtitle="Gerencie equipes, membros e seu acesso a modelos e orçamentos"
            />
          </div>

          <Tabs
            items={tabItems}
            tabBarExtraContent={{
              left: canCreateOrManageTeams(userRole, userID, organizations) ? (
                <div className="flex items-center gap-4 pr-4">
                  <UIButton onClick={() => setIsTeamModalVisible(true)} data-testid="create-team-button">
                    <Plus className="size-4" />
                    Criar Equipe
                  </UIButton>
                  <div className="h-6 w-px bg-gray-200" />
                </div>
              ) : undefined,
            }}
          />
        </>
      )}

      {canCreateOrManageTeams(userRole, userID, organizations) && (
        <Modal
          title="Criar Equipe"
          open={isTeamModalVisible}
          width={1000}
          footer={null}
          onOk={handleOk}
          onCancel={handleCancel}
        >
          <Form form={form} onFinish={handleCreate} labelCol={{ span: 8 }} wrapperCol={{ span: 16 }} labelAlign="left">
            <>
              <Form.Item
                label="Nome da Equipe"
                name="team_alias"
                rules={[
                  {
                    required: true,
                    message: "Por favor, informe um nome para a equipe",
                  },
                ]}
              >
                <TextInput placeholder="" data-testid="team-name-input" />
              </Form.Item>
              {(() => {
                const adminOrgs = getAdminOrganizations(userRole, userID, organizations);
                const isOrgAdmin = userRole !== "Admin";
                const isSingleOrg = adminOrgs.length === 1;
                const hasNoOrgs = adminOrgs.length === 0;

                return (
                  <>
                    <Form.Item
                      label={
                        <span>
                          Organization{" "}
                          <Tooltip
                            title={
                              <span>
                                Organizações podem ter várias equipes. Saiba mais sobre{" "}
                                <a
                                  href="https://docs.litellm.ai/docs/proxy/user_management_heirarchy"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    color: "#1890ff",
                                    textDecoration: "underline",
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  hierarquia de gerenciamento de usuários
                                </a>
                              </span>
                            }
                          >
                            <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                          </Tooltip>
                        </span>
                      }
                      name="organization_id"
                      initialValue={currentOrg ? currentOrg.organization_id : null}
                      className="mt-8"
                      rules={
                        isOrgAdmin
                          ? [
                              {
                                required: true,
                                message: "Please select an organization",
                              },
                            ]
                          : []
                      }
                      help={
                        isOrgAdmin && isSingleOrg
                          ? "You can only create teams within this organization"
                          : isOrgAdmin
                            ? "required"
                            : ""
                      }
                    >
                      <Select
                        showSearch
                        allowClear={!isOrgAdmin}
                        disabled={isOrgAdmin && isSingleOrg}
                        placeholder={hasNoOrgs ? "No organizations available" : "Search or select an Organization"}
                        onChange={(value) => {
                          form.setFieldValue("organization_id", value);
                          setCurrentOrgForCreateTeam(adminOrgs?.find((org) => org.organization_id === value) || null);
                        }}
                        filterOption={(input, option) => {
                          if (!option) return false;
                          const optionValue = option.children?.toString() || "";
                          return optionValue.toLowerCase().includes(input.toLowerCase());
                        }}
                        optionFilterProp="children"
                      >
                        {adminOrgs?.map((org) => (
                          <Select.Option key={org.organization_id} value={org.organization_id}>
                            <span className="font-medium">{org.organization_alias}</span>{" "}
                            <span className="text-gray-500">({org.organization_id})</span>
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>

                    {/* Show message when org admin needs to select organization */}
                    {isOrgAdmin && !isSingleOrg && adminOrgs.length > 1 && (
                      <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
                        <Text style={{ color: "#1e40af", fontSize: 14 }}>
                          Por favor, selecione uma organização para criar uma equipe. Você só pode criar equipes dentro
                          das organizações onde é administrador.
                        </Text>
                      </div>
                    )}
                  </>
                );
              })()}
              <Form.Item
                label={
                  <span>
                    Modelos{" "}
                    <Tooltip title="Estes são os modelos aos quais sua equipe selecionada tem acesso">
                      <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                    </Tooltip>
                  </span>
                }
                rules={[
                  {
                    required: true,
                    message: "Por favor, selecione pelo menos um modelo",
                  },
                ]}
                name="models"
              >
                <ModelSelect
                  value={form.getFieldValue("models") || []}
                  onChange={(values) => form.setFieldValue("models", values)}
                  organizationID={form.getFieldValue("organization_id")}
                  options={{
                    includeSpecialOptions: true,
                    showAllProxyModelsOverride: !form.getFieldValue("organization_id"),
                  }}
                  context="team"
                  dataTestId="create-team-models-select"
                />
              </Form.Item>

              <Form.Item label={`Orçamento Máximo (${currency})`} name="max_budget">
                <CurrencyMoneyInput />
              </Form.Item>
              <Form.Item className="mt-8" label="Reiniciar Orçamento" name="budget_duration">
                <Select defaultValue={null} placeholder="n/a">
                  <Select.Option value="24h">diário</Select.Option>
                  <Select.Option value="7d">semanal</Select.Option>
                  <Select.Option value="30d">mensal</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item label="Limite de Tokens por Minuto (TPM)" name="tpm_limit">
                <NumericalInput step={1} width={400} />
              </Form.Item>
              <Form.Item label="Limite de Requisições por Minuto (RPM)" name="rpm_limit">
                <NumericalInput step={1} width={400} />
              </Form.Item>

              <Accordion
                className="mt-20 mb-8"
                onClick={() => {
                  if (!mcpAccessGroupsLoaded) {
                    fetchMcpAccessGroups();
                    setMcpAccessGroupsLoaded(true);
                  }
                }}
              >
                <AccordionHeader>
                  <b>Configurações Adicionais</b>
                </AccordionHeader>
                <AccordionBody>
                  <Form.Item
                    label="ID da Equipe"
                    name="team_id"
                    help="ID da equipe que você deseja criar. Se não fornecido, será gerado automaticamente."
                  >
                    <TextInput
                      onChange={(e) => {
                        e.target.value = e.target.value.trim();
                      }}
                    />
                  </Form.Item>
                  <Form.Item
                    label={`Orçamento do Membro da Equipe (${currency})`}
                    name="team_member_budget"
                    normalize={(value) => (value ? Number(value) : undefined)}
                    tooltip="Este é o orçamento individual para um usuário na equipe."
                  >
                    <NumericalInput step={0.01} precision={2} width={200} />
                  </Form.Item>
                  <Form.Item
                    label="Duração da Chave do Membro da Equipe (ex: 1d, 1mo)"
                    name="team_member_key_duration"
                    tooltip="Defina um limite para a duração da chave de um membro da equipe. Formato: 30s (segundos), 30m (minutos), 30h (horas), 30d (dias), 1mo (mês)"
                  >
                    <TextInput placeholder="ex: 30d" />
                  </Form.Item>
                  <Form.Item
                    label="Limite de RPM do Membro da Equipe"
                    name="team_member_rpm_limit"
                    tooltip="O limite de RPM (Requisições Por Minuto) para membros individuais da equipe"
                  >
                    <NumericalInput step={1} width={400} />
                  </Form.Item>
                  <Form.Item
                    label="Limite de TPM do Membro da Equipe"
                    name="team_member_tpm_limit"
                    tooltip="O limite de TPM (Tokens Por Minuto) para membros individuais da equipe"
                  >
                    <NumericalInput step={1} width={400} />
                  </Form.Item>
                  <Form.Item
                    label="Metadata"
                    name="metadata"
                    help="Metadados adicionais da equipe. Informe os metadados como objeto JSON."
                  >
                    <Input.TextArea rows={4} />
                  </Form.Item>
                  <Form.Item
                    label="Secret Manager Settings"
                    name="secret_manager_settings"
                    help={
                      premiumUser
                        ? "Enter secret manager configuration as a JSON object."
                        : "Premium feature - Upgrade to manage secret manager settings."
                    }
                    rules={[
                      {
                        validator: async (_, value) => {
                          if (!value) {
                            return Promise.resolve();
                          }
                          try {
                            JSON.parse(value);
                            return Promise.resolve();
                          } catch (error) {
                            return Promise.reject(new Error("Please enter valid JSON"));
                          }
                        },
                      },
                    ]}
                  >
                    <Input.TextArea
                      rows={4}
                      placeholder='{"namespace": "admin", "mount": "secret", "path_prefix": "litellm"}'
                      disabled={!premiumUser}
                    />
                  </Form.Item>
                  <Form.Item
                    label={
                      <span>
                        Guardrails{" "}
                        <Tooltip title="Configure seu primeiro guardrail">
                          <a
                            href="https://docs.litellm.ai/docs/proxy/guardrails/quick_start"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                          </a>
                        </Tooltip>
                      </span>
                    }
                    name="guardrails"
                    className="mt-8"
                    help="Selecione guardrails existentes ou insira novos"
                  >
                    <Select
                      mode="tags"
                      style={{ width: "100%" }}
                      placeholder="Select or enter guardrails"
                      options={guardrailsList.map((name) => ({
                        value: name,
                        label: name,
                      }))}
                    />
                  </Form.Item>
                  <Form.Item
                    label={
                      <span>
                        Desabilitar Guardrails Globais{" "}
                        <Tooltip title="Quando ativado, esta equipe ignorará quaisquer guardrails configurados para rodar em cada requisição (guardrails globais)">
                          <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                        </Tooltip>
                      </span>
                    }
                    name="disable_global_guardrails"
                    className="mt-4"
                    valuePropName="checked"
                    help="Ignorar guardrails globais para esta equipe"
                  >
                    <Switch
                      disabled={!premiumUser}
                      checkedChildren={
                        premiumUser ? "Sim" : "Recurso premium - Atualize para desabilitar guardrails globais por equipe"
                      }
                      unCheckedChildren={
                        premiumUser ? "Não" : "Recurso premium - Atualize para desabilitar guardrails globais por equipe"
                      }
                    />
                  </Form.Item>
                  <Form.Item
                    label={
                      <span>
                        Políticas{" "}
                        <Tooltip title="Aplique políticas a esta equipe para controlar guardrails e outras configurações">
                          <a
                            href="https://docs.litellm.ai/docs/proxy/guardrails/guardrail_policies"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                          </a>
                        </Tooltip>
                      </span>
                    }
                    name="policies"
                    className="mt-8"
                    help="Selecione políticas existentes ou insira novas"
                  >
                    <Select
                      mode="tags"
                      style={{ width: "100%" }}
                      placeholder="Select or enter policies"
                      options={policiesList.map((name) => ({
                        value: name,
                        label: name,
                      }))}
                    />
                  </Form.Item>
                  <Form.Item
                    label={
                      <span>
                        Grupos de Acesso{" "}
                        <Tooltip title="Atribua grupos de acesso a esta equipe. Grupos de acesso controlam quais modelos, servidores MCP e agentes esta equipe pode usar">
                          <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                        </Tooltip>
                      </span>
                    }
                    name="access_group_ids"
                    className="mt-8"
                    help="Selecione grupos de acesso para atribuir a esta equipe"
                  >
                    <AccessGroupSelector placeholder="Select access groups (optional)" />
                  </Form.Item>
                  <Form.Item
                    label={
                      <span>
                        Armazenamentos de Vetores Permitidos{" "}
                        <Tooltip title="Selecione quais armazenamentos de vetores esta equipe pode acessar por padrão. Deixe vazio para acesso a todos os armazenamentos">
                          <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                        </Tooltip>
                      </span>
                    }
                    name="allowed_vector_store_ids"
                    className="mt-8"
                    help="Selecione os armazenamentos de vetores que esta equipe pode acessar. Deixe vazio para acesso a todos os armazenamentos"
                  >
                    <VectorStoreSelector
                      onChange={(values: string[]) => form.setFieldValue("allowed_vector_store_ids", values)}
                      value={form.getFieldValue("allowed_vector_store_ids")}
                      accessToken={accessToken || ""}
                      placeholder="Select vector stores (optional)"
                    />
                  </Form.Item>
                  <Form.Item label="Rotas de Passagem Permitidas" name="allowed_passthrough_routes" className="mt-8">
                    <Tooltip
                      title={
                        !premiumUser
                          ? "Recurso premium - Atualize para definir rotas de passagem permitidas"
                          : !isProxyAdminRole(userRole || "")
                            ? "Apenas administradores proxy podem definir rotas de passagem permitidas"
                            : ""
                      }
                      placement="top"
                    >
                      <PassThroughRoutesSelector
                        onChange={(values: string[]) => form.setFieldValue("allowed_passthrough_routes", values)}
                        value={form.getFieldValue("allowed_passthrough_routes")}
                        accessToken={accessToken || ""}
                        placeholder="Selecionar rotas de passagem (opcional)"
                        disabled={!premiumUser || !isProxyAdminRole(userRole || "")}
                      />
                    </Tooltip>
                  </Form.Item>
                </AccordionBody>
              </Accordion>

              <Accordion className="mt-8 mb-8">
                <AccordionHeader>
                  <b>Configurações MCP</b>
                </AccordionHeader>
                <AccordionBody>
                  <Form.Item
                    label={
                      <span>
                        Servidores MCP Permitidos{" "}
                        <Tooltip title="Selecione quais servidores MCP ou grupos de acesso esta equipe pode acessar">
                          <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                        </Tooltip>
                      </span>
                    }
                    name="allowed_mcp_servers_and_groups"
                    className="mt-4"
                    help="Selecione servidores MCP ou grupos de acesso que esta equipe pode acessar"
                  >
                    <MCPServerSelector
                      onChange={(val: any) => form.setFieldValue("allowed_mcp_servers_and_groups", val)}
                      value={form.getFieldValue("allowed_mcp_servers_and_groups")}
                      accessToken={accessToken || ""}
                      placeholder="Select MCP servers or access groups (optional)"
                      allowAllProxyMcpServers={isProxyAdminRole(userRole || "")}
                    />
                  </Form.Item>

                  {/* Hidden field to register mcp_tool_permissions with the form */}
                  <Form.Item name="mcp_tool_permissions" initialValue={{}} hidden>
                    <Input type="hidden" />
                  </Form.Item>

                  <Form.Item
                    noStyle
                    shouldUpdate={(prevValues, currentValues) =>
                      prevValues.allowed_mcp_servers_and_groups !== currentValues.allowed_mcp_servers_and_groups ||
                      prevValues.mcp_tool_permissions !== currentValues.mcp_tool_permissions
                    }
                  >
                    {() => (
                      <div className="mt-6">
                        <MCPToolPermissions
                          accessToken={accessToken || ""}
                          selectedServers={form.getFieldValue("allowed_mcp_servers_and_groups")?.servers || []}
                          toolPermissions={form.getFieldValue("mcp_tool_permissions") || {}}
                          onChange={(toolPerms) => form.setFieldsValue({ mcp_tool_permissions: toolPerms })}
                        />
                      </div>
                    )}
                  </Form.Item>
                </AccordionBody>
              </Accordion>

              <Accordion className="mt-8 mb-8">
                <AccordionHeader>
                  <b>Configurações de Agentes</b>
                </AccordionHeader>
                <AccordionBody>
                  <Form.Item
                    label={
                      <span>
                        Agentes Permitidos{" "}
                        <Tooltip title="Selecione quais agentes ou grupos de acesso esta equipe pode acessar">
                          <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                        </Tooltip>
                      </span>
                    }
                    name="allowed_agents_and_groups"
                    className="mt-4"
                    help="Selecione agentes ou grupos de acesso que esta equipe pode acessar"
                  >
                    <AgentSelector
                      onChange={(val: any) => form.setFieldValue("allowed_agents_and_groups", val)}
                      value={form.getFieldValue("allowed_agents_and_groups")}
                      accessToken={accessToken || ""}
                      placeholder="Select agents or access groups (optional)"
                    />
                  </Form.Item>
                </AccordionBody>
              </Accordion>

              <Accordion className="mt-8 mb-8">
                <AccordionHeader>
                  <b>Configurações de Ferramentas de Busca</b>
                </AccordionHeader>
                <AccordionBody>
                  <Form.Item
                    label={
                      <span>
                        Ferramentas de Busca Permitidas{" "}
                        <Tooltip title="Selecione quais ferramentas de busca esta equipe pode acessar. Deixe vazio para permitir todas as ferramentas de busca.">
                          <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                        </Tooltip>
                      </span>
                    }
                    name="object_permission_search_tools"
                    className="mt-4"
                    help="Restringe quais ferramentas de busca configuradas as chaves desta equipe podem chamar."
                  >
                    <SearchToolSelector
                      onChange={(vals: string[]) => form.setFieldValue("object_permission_search_tools", vals)}
                      value={form.getFieldValue("object_permission_search_tools")}
                      accessToken={accessToken || ""}
                      placeholder="Select search tools (optional, empty = all allowed)"
                    />
                  </Form.Item>
                </AccordionBody>
              </Accordion>

              <Accordion className="mt-8 mb-8">
                <AccordionHeader>
                  <b>Configurações de Registro</b>
                </AccordionHeader>
                <AccordionBody>
                  <div className="mt-4">
                    <PremiumLoggingSettings
                      value={loggingSettings}
                      onChange={setLoggingSettings}
                      premiumUser={premiumUser}
                    />
                  </div>
                </AccordionBody>
              </Accordion>

              <Accordion key={`router-settings-accordion-${routerSettingsKey}`} className="mt-8 mb-8">
                <AccordionHeader>
                  <b>Configurações do Roteador</b>
                </AccordionHeader>
                <AccordionBody>
                  <div className="mt-4 w-full">
                    <RouterSettingsAccordion
                      key={routerSettingsKey}
                      accessToken={accessToken || ""}
                      value={routerSettings || undefined}
                      onChange={setRouterSettings}
                      modelData={
                        userModels.length > 0 ? { data: userModels.map((model) => ({ model_name: model })) } : undefined
                      }
                    />
                  </div>
                </AccordionBody>
              </Accordion>

              <Accordion className="mt-8 mb-8">
                <AccordionHeader>
                  <b>Apelidos de Modelos</b>
                </AccordionHeader>
                <AccordionBody>
                  <div className="mt-4">
                    <Text type="secondary" style={{ fontSize: 14, marginBottom: 16, display: "block" }}>
                      Crie apelidos personalizados para modelos que podem ser usados pelos membros da equipe em chamadas de API. Isso permite que você crie atalhos para modelos específicos.
                    </Text>
                    <ModelAliasManager
                      accessToken={accessToken || ""}
                      initialModelAliases={modelAliases}
                      onAliasUpdate={setModelAliases}
                      showExampleConfig={false}
                    />
                  </div>
                </AccordionBody>
              </Accordion>
            </>
            <div style={{ textAlign: "right", marginTop: "10px" }}>
              <Button htmlType="submit" data-testid="create-team-submit">
                Criar Equipe
              </Button>
            </div>
          </Form>
        </Modal>
      )}
    </Content>
  );
};

export default Teams;
