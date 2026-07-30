"use client";
import { keyKeys } from "@/app/(dashboard)/hooks/keys/useKeys";
import { useOrganizations } from "@/app/(dashboard)/hooks/organizations/useOrganizations";
import { useProjects } from "@/app/(dashboard)/hooks/projects/useProjects";
import { useTags } from "@/app/(dashboard)/hooks/tags/useTags";
import { useUISettings } from "@/app/(dashboard)/hooks/uiSettings/useUISettings";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatNumberWithCommas, formatSpend } from "@/utils/dataUtils";
import { InfoCircleOutlined } from "@ant-design/icons";
import { useQueryClient } from "@tanstack/react-query";
import { Accordion, AccordionBody, AccordionHeader, Button, Col, Grid, Text, TextInput, Title } from "@tremor/react";
import NumericalInput from "@/components/shared/numerical_input";
import { Button as Button2, Form, Input, Modal, Radio, Select, Switch, Tag, Tooltip, Typography } from "antd";
import { useDebouncedCallback } from "@tanstack/react-pacer/debouncer";
import { DEBOUNCE_WAIT_MS } from "@/utils/debounceConstants";
import React, { useEffect, useState } from "react";
import { rolesWithWriteAccess } from "../../utils/roles";

import AgentSelector from "../agent_management/AgentSelector";
import { mapDisplayToInternalNames } from "../callback_info_helpers";
import AccessGroupSelector from "../common_components/AccessGroupSelector";
import BudgetDurationDropdown from "../common_components/budget_duration_dropdown";
import SchemaFormFields from "../common_components/check_openapi_schema";
import KeyLifecycleSettings from "../common_components/KeyLifecycleSettings";
import ModelAliasManager from "../common_components/ModelAliasManager";
import PassThroughRoutesSelector from "../common_components/PassThroughRoutesSelector";
import PremiumLoggingSettings from "../common_components/PremiumLoggingSettings";
import RateLimitTypeFormItem from "../common_components/RateLimitTypeFormItem";
import RouterSettingsAccordion, { RouterSettingsAccordionValue } from "../common_components/RouterSettingsAccordion";
import TeamDropdown from "../common_components/team_dropdown";
import OrganizationDropdown from "../common_components/OrganizationDropdown";
import ProjectDropdown from "../common_components/ProjectDropdown";
import { CreateUserButton } from "../CreateUserButton";
import { BudgetFallbacksEditor } from "../key_team_helpers/BudgetFallbacksEditor";
import { BudgetWindowEntry, BudgetWindowsEditor } from "../key_team_helpers/BudgetWindowsEditor";
import { TagRateLimitEditor, TagRateLimitEntry, tagRowsToLimits } from "../key_team_helpers/TagRateLimitEditor";
import {
  excludeProxyWideSentinel,
  getModelDisplayName,
  hasAllModelsSentinel,
} from "../key_team_helpers/fetch_available_models_team_key";
import { Team } from "../key_team_helpers/key_list";
import MCPServerSelector from "../mcp_server_management/MCPServerSelector";
import { NO_MCP_SERVERS_SENTINEL } from "../mcp_tools/constants";
import MCPToolPermissions from "../mcp_server_management/MCPToolPermissions";
import NotificationsManager from "../molecules/notifications_manager";
import {
  getAgentsList,
  getGuardrailsList,
  getPoliciesList,
  getPossibleUserRoles,
  getPromptsList,
  keyCreateCall,
  keyCreateServiceAccountCall,
  modelAvailableCall,
  proxyBaseUrl,
  userFilterUICall,
} from "../networking";
import CreatedKeyDisplay from "../shared/CreatedKeyDisplay";
import { CurrencyMoneyInput } from "../shared/CurrencyMoneyInput";
import VectorStoreSelector from "../vector_store_management/VectorStoreSelector";
import { simplifyKeyGenerateError } from "./utils";

const { Option } = Select;

/**
 * Interface for pre-filling the create key form from URL parameters
 */
export interface CreateKeyPrefillData {
  owned_by?: "you" | "service_account" | "another_user";
  team_id?: string;
  key_alias?: string;
  models?: string[];
  key_type?: "default" | "llm_api" | "management";
}

interface CreateKeyProps {
  team: Team | null;
  data: any[] | null;
  teams: Team[] | null;
  addKey: (data: any) => void;
  autoOpenCreate?: boolean;
  prefillData?: CreateKeyPrefillData;
}

interface User {
  user_id: string;
  user_email: string;
  role?: string;
}

interface UserOption {
  label: string;
  value: string;
  user: User;
}

const getPredefinedTags = (data: any[] | null) => {
  let allTags = [];

  if (data) {
    for (let key of data) {
      if (key["metadata"] && key["metadata"]["tags"]) {
        allTags.push(...key["metadata"]["tags"]);
      }
    }
  }

  // Deduplicate using Set
  const uniqueTags = Array.from(new Set(allTags)).map((tag) => ({
    value: tag,
    label: tag,
  }));

  return uniqueTags;
};

export const fetchTeamModels = async (
  userID: string,
  userRole: string,
  accessToken: string,
  teamID: string | null,
): Promise<string[]> => {
  try {
    if (userID === null || userRole === null) {
      return [];
    }

    if (accessToken !== null) {
      const model_available = await modelAvailableCall(accessToken, userID, userRole, true, teamID, true);
      let available_model_names = model_available["data"].map((element: { id: string }) => element.id);
      return available_model_names;
    }
    return [];
  } catch (error) {
    console.error("Error fetching user models:", error);
    return [];
  }
};

export const fetchUserModels = async (
  userID: string,
  userRole: string,
  accessToken: string,
  setUserModels: (models: string[]) => void,
) => {
  try {
    if (userID === null || userRole === null) {
      return;
    }

    if (accessToken !== null) {
      const model_available = await modelAvailableCall(accessToken, userID, userRole);
      let available_model_names = model_available["data"].map((element: { id: string }) => element.id);
      setUserModels(available_model_names);
    }
  } catch (error) {
    console.error("Error fetching user models:", error);
  }
};

/**
 * ─────────────────────────────────────────────────────────────────────────
 * @deprecated
 * This component is being DEPRECATED in favor of src/app/(dashboard)/virtual-keys/components/CreateKey.tsx
 * Please contribute to the new refactor.
 * ─────────────────────────────────────────────────────────────────────────
 */
const CreateKey: React.FC<CreateKeyProps> = ({ team, teams, data, addKey, autoOpenCreate, prefillData }) => {
  const { currency, rate } = useCurrency();
  
  const { accessToken, userId: userID, userRole } = useAuthorized();
  const { data: organizations, isLoading: isOrganizationsLoading } = useOrganizations();
  const { data: projects, isLoading: isProjectsLoading } = useProjects();
  const { data: uiSettingsData } = useUISettings();
  const { data: tagsData } = useTags();
  const enableProjectsUI = Boolean(uiSettingsData?.values?.enable_projects_ui);
  const disableCustomApiKeys = Boolean(uiSettingsData?.values?.disable_custom_api_keys);
  const tagOptions = tagsData ? Object.values(tagsData).map((tag) => ({ value: tag.name, label: tag.name })) : [];
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [apiKey, setApiKey] = useState(null);
  const [softBudget, setSoftBudget] = useState(null);
  const [userModels, setUserModels] = useState<string[]>([]);
  const [modelsToPick, setModelsToPick] = useState<string[]>([]);
  const [keyOwner, setKeyOwner] = useState("you");
  const [hasPrefilled, setHasPrefilled] = useState(false);
  const [pendingPrefillModels, setPendingPrefillModels] = useState<string[] | null>(null);
  const [guardrailsList, setGuardrailsList] = useState<string[]>([]);
  const [policiesList, setPoliciesList] = useState<string[]>([]);
  const [promptsList, setPromptsList] = useState<string[]>([]);
  const [loggingSettings, setLoggingSettings] = useState<any[]>([]);
  const [selectedCreateKeyTeam, setSelectedCreateKeyTeam] = useState<Team | null>(team);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isCreateUserModalVisible, setIsCreateUserModalVisible] = useState(false);
  const [newlyCreatedUserId, setNewlyCreatedUserId] = useState<string | null>(null);
  const [possibleUIRoles, setPossibleUIRoles] = useState<Record<string, Record<string, string>>>({});
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState<boolean>(false);
  const [mcpAccessGroups, setMcpAccessGroups] = useState<string[]>([]);
  const [disabledCallbacks, setDisabledCallbacks] = useState<string[]>([]);
  const [keyType, setKeyType] = useState<string>("llm_api");
  const [modelAliases, setModelAliases] = useState<{ [key: string]: string }>({});
  const [autoRotationEnabled, setAutoRotationEnabled] = useState<boolean>(false);
  const [rotationInterval, setRotationInterval] = useState<string>("30d");
  const [routerSettings, setRouterSettings] = useState<RouterSettingsAccordionValue | null>(null);
  const [budgetLimits, setBudgetLimits] = useState<BudgetWindowEntry[]>([]);
  const [tagRateLimits, setTagRateLimits] = useState<TagRateLimitEntry[]>([]);
  const [budgetFallbacks, setBudgetFallbacks] = useState<Record<string, string[]>>({});
  const [budgetFallbacksKey, setBudgetFallbacksKey] = useState<number>(0);
  const [routerSettingsKey, setRouterSettingsKey] = useState<number>(0);
  const [agentsList, setAgentsList] = useState<{ agent_id: string; agent_name: string }[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const selectedModels: string[] = Form.useWatch("models", form) ?? [];
  const handleOk = () => {
    setIsModalVisible(false);
    form.resetFields();
    setLoggingSettings([]);
    setDisabledCallbacks([]);
    setKeyType("llm_api");
    setModelAliases({});
    setAutoRotationEnabled(false);
    setRotationInterval("30d");
    setRouterSettings(null);
    setRouterSettingsKey((prev) => prev + 1);
    setSelectedAgentId(null);
    setSelectedOrganizationId(null);
    setSelectedProjectId(null);
    setBudgetLimits([]);
    setTagRateLimits([]);
    setBudgetFallbacks({});
    setBudgetFallbacksKey((k) => k + 1);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setApiKey(null);
    setSelectedCreateKeyTeam(null);
    form.resetFields();
    setLoggingSettings([]);
    setDisabledCallbacks([]);
    setKeyType("llm_api");
    setModelAliases({});
    setAutoRotationEnabled(false);
    setRotationInterval("30d");
    setRouterSettings(null);
    setRouterSettingsKey((prev) => prev + 1);
    setSelectedAgentId(null);
    setSelectedOrganizationId(null);
    setSelectedProjectId(null);
    setBudgetLimits([]);
    setTagRateLimits([]);
    setBudgetFallbacks({});
    setBudgetFallbacksKey((k) => k + 1);
  };

  useEffect(() => {
    if (userID && userRole && accessToken) {
      fetchUserModels(userID, userRole, accessToken, setUserModels);
    }
  }, [accessToken, userID, userRole]);

  useEffect(() => {
    if (accessToken) {
      getAgentsList(accessToken)
        .then((res) => setAgentsList(res?.agents || []))
        .catch(() => setAgentsList([]));
    }
  }, [accessToken]);

  useEffect(() => {
    const fetchGuardrails = async () => {
      try {
        const response = await getGuardrailsList(accessToken);
        const guardrailNames = response.guardrails.map((g: { guardrail_name: string }) => g.guardrail_name);
        setGuardrailsList(guardrailNames);
      } catch (error) {
        console.error("Failed to fetch guardrails:", error);
      }
    };

    const fetchPolicies = async () => {
      try {
        const response = await getPoliciesList(accessToken);
        const policyNames = response.policies.map((p: { policy_name: string }) => p.policy_name);
        setPoliciesList(policyNames);
      } catch (error) {
        console.error("Failed to fetch policies:", error);
      }
    };

    const fetchPrompts = async () => {
      try {
        const response = await getPromptsList(accessToken);
        setPromptsList(response.prompts.map((prompt) => prompt.prompt_id));
      } catch (error) {
        console.error("Failed to fetch prompts:", error);
      }
    };

    fetchGuardrails();
    fetchPolicies();
    fetchPrompts();
  }, [accessToken]);

  // Fetch possible user roles when component mounts
  useEffect(() => {
    const fetchPossibleRoles = async () => {
      try {
        if (accessToken) {
          // Check if roles are cached in session storage
          const cachedRoles = sessionStorage.getItem("possibleUserRoles");
          if (cachedRoles) {
            setPossibleUIRoles(JSON.parse(cachedRoles));
          } else {
            const availableUserRoles = await getPossibleUserRoles(accessToken);
            sessionStorage.setItem("possibleUserRoles", JSON.stringify(availableUserRoles));
            setPossibleUIRoles(availableUserRoles);
          }
        }
      } catch (error) {
        console.error("Error fetching possible user roles:", error);
      }
    };

    fetchPossibleRoles();
  }, [accessToken]);

  // Auto-open modal and prefill form from URL params (deep link).
  // Guarded by write access so we don't open for read-only users.
  useEffect(() => {
    if (autoOpenCreate && !hasPrefilled && teams && userRole && rolesWithWriteAccess.includes(userRole)) {
      // Open the modal
      setIsModalVisible(true);
      setHasPrefilled(true);

      // Apply prefill data if provided
      if (prefillData) {
        // Set key owner (owned_by) - validate that "another_user" is only allowed for Admin
        if (prefillData.owned_by) {
          if (prefillData.owned_by === "another_user" && userRole !== "Admin") {
            // Ignore invalid owned_by for non-admin users, fall back to default
            setKeyOwner("you");
          } else {
            setKeyOwner(prefillData.owned_by);
          }
        }

        // Set team - find the team by ID and set it (only if team exists in user's teams)
        if (prefillData.team_id) {
          const selectedTeam = teams?.find((t) => t.team_id === prefillData.team_id) || null;
          if (selectedTeam) {
            setSelectedCreateKeyTeam(selectedTeam);
            form.setFieldsValue({ team_id: prefillData.team_id });
          }
          // Silently ignore invalid team_id - don't prefill with a team user doesn't have access to
        }

        // Set key alias
        if (prefillData.key_alias) {
          form.setFieldsValue({ key_alias: prefillData.key_alias });
        }

        // Defer model selection until we load the allowed model list.
        if (prefillData.models && prefillData.models.length > 0) {
          setPendingPrefillModels(prefillData.models);
        }

        // Set key type
        if (prefillData.key_type) {
          setKeyType(prefillData.key_type);
          form.setFieldsValue({ key_type: prefillData.key_type });
        }
      }
    }
  }, [autoOpenCreate, prefillData, teams, hasPrefilled, form, userRole]);

  // Check if team selection is required
  const isTeamSelectionRequired = modelsToPick.includes("no-default-models");
  const isFormDisabled = isTeamSelectionRequired && !selectedCreateKeyTeam;

  const handleCreate = async (formValues: Record<string, any>) => {
    try {
      const newKeyAlias = formValues?.key_alias ?? "";
      const newKeyTeamId = formValues?.team_id ?? null;

      const existingKeyAliases = data?.filter((k) => k.team_id === newKeyTeamId).map((k) => k.key_alias) ?? [];

      if (existingKeyAliases.includes(newKeyAlias)) {
        throw new Error(
          `Key alias ${newKeyAlias} already exists for team with ID ${newKeyTeamId}, please provide another key alias`,
        );
      }

      NotificationsManager.info("Fazendo chamada de API");
      setIsModalVisible(true);

      if (keyOwner === "you") {
        formValues.user_id = userID;
      } else if (keyOwner === "agent") {
        if (!selectedAgentId) {
          NotificationsManager.fromBackend("Por favor, selecione um agente");
          return;
        }
        formValues.agent_id = selectedAgentId;
      }

      // Handle metadata for all key types
      let metadata: Record<string, any> = {};
      try {
        metadata = JSON.parse(formValues.metadata || "{}");
      } catch (error) {
        console.error("Error parsing metadata:", error);
      }

      // If it's a service account, add the service_account_id to the metadata
      if (keyOwner === "service_account") {
        metadata["service_account_id"] = formValues.key_alias;
      }

      // Add logging settings to the metadata
      if (loggingSettings.length > 0) {
        metadata = {
          ...metadata,
          logging: loggingSettings.filter((config) => config.callback_name),
        };
      }

      // Add disabled callbacks to the metadata
      if (disabledCallbacks.length > 0) {
        // Map display names to internal callback values
        const mappedDisabledCallbacks = mapDisplayToInternalNames(disabledCallbacks);
        metadata = {
          ...metadata,
          litellm_disabled_callbacks: mappedDisabledCallbacks,
        };
      }

      // Add auto-rotation settings as top-level fields
      if (autoRotationEnabled) {
        formValues.auto_rotate = true;
        formValues.rotation_interval = rotationInterval;
      }

      // Handle duration field for key expiry - convert empty string to null
      if (!formValues.duration || formValues.duration.trim() === "") {
        formValues.duration = null;
      }

      // Update the formValues with the final metadata
      formValues.metadata = JSON.stringify(metadata);

      // disable_global_guardrails is premium-gated server-side; only send it when enabled
      // so non-premium key creation isn't blocked by that gate.
      if (!formValues.disable_global_guardrails) {
        delete formValues.disable_global_guardrails;
      }

      // Transform allowed_vector_store_ids and allowed_mcp_servers_and_groups into object_permission format
      if (formValues.allowed_vector_store_ids && formValues.allowed_vector_store_ids.length > 0) {
        formValues.object_permission = {
          vector_stores: formValues.allowed_vector_store_ids,
        };
        // Remove the original field as it's now part of object_permission
        delete formValues.allowed_vector_store_ids;
      }

      // Transform allowed_mcp_servers_and_groups into object_permission format
      if (
        formValues.allowed_mcp_servers_and_groups &&
        (formValues.allowed_mcp_servers_and_groups.servers?.length > 0 ||
          formValues.allowed_mcp_servers_and_groups.accessGroups?.length > 0)
      ) {
        if (!formValues.object_permission) {
          formValues.object_permission = {};
        }
        const { servers, accessGroups } = formValues.allowed_mcp_servers_and_groups;
        if (servers && servers.length > 0) {
          formValues.object_permission.mcp_servers = servers;
        }
        if (accessGroups && accessGroups.length > 0) {
          formValues.object_permission.mcp_access_groups = accessGroups;
        }
        // Remove the original field as it's now part of object_permission
        delete formValues.allowed_mcp_servers_and_groups;
      }

      // Add MCP tool permissions to object_permission
      const mcpToolPermissions = formValues.mcp_tool_permissions || {};
      if (Object.keys(mcpToolPermissions).length > 0) {
        if (!formValues.object_permission) {
          formValues.object_permission = {};
        }
        formValues.object_permission.mcp_tool_permissions = mcpToolPermissions;
      }
      delete formValues.mcp_tool_permissions;

      // Transform allowed_mcp_access_groups into object_permission format
      if (formValues.allowed_mcp_access_groups && formValues.allowed_mcp_access_groups.length > 0) {
        if (!formValues.object_permission) {
          formValues.object_permission = {};
        }
        formValues.object_permission.mcp_access_groups = formValues.allowed_mcp_access_groups;
        // Remove the original field as it's now part of object_permission
        delete formValues.allowed_mcp_access_groups;
      }

      // Transform allowed_agents_and_groups into object_permission format
      if (
        formValues.allowed_agents_and_groups &&
        (formValues.allowed_agents_and_groups.agents?.length > 0 ||
          formValues.allowed_agents_and_groups.accessGroups?.length > 0)
      ) {
        if (!formValues.object_permission) {
          formValues.object_permission = {};
        }
        const { agents, accessGroups } = formValues.allowed_agents_and_groups;
        if (agents && agents.length > 0) {
          formValues.object_permission.agents = agents;
        }
        if (accessGroups && accessGroups.length > 0) {
          formValues.object_permission.agent_access_groups = accessGroups;
        }
        // Remove the original field as it's now part of object_permission
        delete formValues.allowed_agents_and_groups;
      }

      // Add model_aliases if any are defined
      if (Object.keys(modelAliases).length > 0) {
        formValues.aliases = JSON.stringify(modelAliases);
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

      // Add multi-window budget limits (filter out incomplete entries)
      const validWindows = budgetLimits.filter(
        (w) => w.budget_duration && w.max_budget !== null && w.max_budget !== undefined,
      );
      if (validWindows.length > 0) {
        formValues.budget_limits = validWindows;
      }

      // Add per-tag rate limits (only when at least one row is configured)
      const { tag_rpm_limit } = tagRowsToLimits(tagRateLimits);
      if (Object.keys(tag_rpm_limit).length > 0) {
        formValues.tag_rpm_limit = tag_rpm_limit;
      }

      if (Object.keys(budgetFallbacks).length > 0) {
        formValues.budget_fallbacks = budgetFallbacks;
      }

      let response;
      if (keyOwner === "service_account") {
        response = await keyCreateServiceAccountCall(accessToken, formValues);
      } else {
        response = await keyCreateCall(accessToken, userID, formValues);
      }

      // Add the data to the state in the parent component
      // Also directly update the keys list in VirtualKeysTable without an API call
      addKey(response);

      // Invalidate and refetch all keys list queries to update the table
      // This will trigger a refetch of all key list queries regardless of pagination
      queryClient.invalidateQueries({ queryKey: keyKeys.lists() });

      setApiKey(response["key"]);
      setSoftBudget(response["soft_budget"]);
      NotificationsManager.success("Chave Virtual Criada");
      form.resetFields();
      setBudgetLimits([]);
      setTagRateLimits([]);
      setBudgetFallbacks({});
      setBudgetFallbacksKey((k) => k + 1);
      localStorage.removeItem("userData" + userID);
    } catch (error) {
      const simplifiedError = simplifyKeyGenerateError(error);
      NotificationsManager.fromBackend(simplifiedError);
    }
  };

  const handleCopy = () => {
    NotificationsManager.success("Chave Virtual copiada para a área de transferência");
  };

  // Fetch available models when team or auth changes.
  // Note: Model prefill from URL params is handled by the useEffect below, which
  // watches for pendingPrefillModels + modelsToPick to both be populated.
  useEffect(() => {
    if (selectedProjectId) {
      // When a project is selected, use the project's models
      const project = projects?.find((p) => p.project_id === selectedProjectId);
      const projectModels = project?.models ?? [];
      setModelsToPick(projectModels);
      form.setFieldValue("models", []);
      return;
    }
    if (userID && userRole && accessToken) {
      fetchTeamModels(userID, userRole, accessToken, selectedCreateKeyTeam?.team_id ?? null).then((models) => {
        const allModels = excludeProxyWideSentinel(
          Array.from(new Set([...(selectedCreateKeyTeam?.models ?? []), ...models])),
        );
        setModelsToPick(allModels);
      });
    }
    // Only clear models if we don't have pending prefill models
    if (!pendingPrefillModels) {
      form.setFieldValue("models", []);
    }
    // Clear MCP server selection when team changes (available servers may differ)
    form.setFieldValue("allowed_mcp_servers_and_groups", { servers: [], accessGroups: [] });
  }, [selectedCreateKeyTeam, selectedProjectId, accessToken, userID, userRole, form]);

  // Apply deferred model prefill once the available model list arrives.
  // This handles timing where prefill data arrives before or after models are fetched.
  useEffect(() => {
    if (!pendingPrefillModels || pendingPrefillModels.length === 0) {
      return;
    }
    if (!modelsToPick || modelsToPick.length === 0) {
      return;
    }

    const validModels = pendingPrefillModels.filter((model) => modelsToPick.includes(model));
    if (validModels.length > 0) {
      form.setFieldsValue({ models: validModels });
    }
    setPendingPrefillModels(null);
  }, [pendingPrefillModels, modelsToPick, form]);

  // Sync team when project is selected but teams loaded later (race condition)
  useEffect(() => {
    if (!selectedProjectId || !teams) return;
    const project = projects?.find((p) => p.project_id === selectedProjectId);
    if (!project?.team_id) return;
    // If team is already set correctly, skip
    if (selectedCreateKeyTeam?.team_id === project.team_id) return;
    const projectTeam = teams.find((t) => t.team_id === project.team_id) || null;
    if (projectTeam) {
      setSelectedCreateKeyTeam(projectTeam);
      form.setFieldValue("team_id", projectTeam.team_id);
    }
  }, [teams, selectedProjectId, projects]);

  // Add a callback function to handle user creation
  const handleUserCreated = (userId: string) => {
    setNewlyCreatedUserId(userId);
    form.setFieldsValue({ user_id: userId });
    setIsCreateUserModalVisible(false);
  };

  const fetchUsers = async (searchText: string): Promise<void> => {
    if (!searchText) {
      setUserOptions([]);
      return;
    }

    setUserSearchLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("user_email", searchText); // Always search by email
      if (accessToken == null) {
        return;
      }
      const response = await userFilterUICall(accessToken, params);

      const data: User[] = response;
      const options: UserOption[] = data.map((user) => ({
        label: `${user.user_email} (${user.user_id})`,
        value: user.user_id,
        user,
      }));

      setUserOptions(options);
    } catch (error) {
      console.error("Error fetching users:", error);
      NotificationsManager.fromBackend("Falha ao pesquisar usuários");
    } finally {
      setUserSearchLoading(false);
    }
  };

  const handleUserSearch = useDebouncedCallback((text: string) => fetchUsers(text), { wait: DEBOUNCE_WAIT_MS });

  const handleUserSelect = (_value: string, option: UserOption): void => {
    const selectedUser = option.user;
    form.setFieldsValue({
      user_id: selectedUser.user_id,
    });
  };

  return (
    <div>
      {userRole && rolesWithWriteAccess.includes(userRole) && (
        <Button className="mx-auto" onClick={() => setIsModalVisible(true)} data-testid="create-key-button">
          + Criar Nova Chave
        </Button>
      )}
      <Modal open={isModalVisible} width={1000} footer={null} onOk={handleOk} onCancel={handleCancel}>
        <Form form={form} onFinish={handleCreate} labelCol={{ span: 8 }} wrapperCol={{ span: 16 }} labelAlign="left">
          {/* Section 1: Key Ownership */}
          <div className="mb-8">
            <Title className="mb-4">Propriedade da Chave</Title>
            <Form.Item
              label={
                <span>
                  Proprietário Por{" "}
                  <Tooltip title="Selecione quem será o proprietário desta Chave Virtual">
                    <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                  </Tooltip>
                </span>
              }
              className="mb-4"
            >
              <Radio.Group onChange={(e) => setKeyOwner(e.target.value)} value={keyOwner}>
                <Radio value="you">Você</Radio>
                <Radio value="service_account">Conta de Serviço</Radio>
                {userRole === "Admin" && <Radio value="another_user">Outro Usuário</Radio>}
                <Radio value="agent">
                  Agente <Tag color="purple">Novo</Tag>
                </Radio>
              </Radio.Group>
            </Form.Item>

            {keyOwner === "another_user" && (
              <Form.Item
                label={
                  <span>
                    ID do Usuário{" "}
                    <Tooltip title="O usuário que será responsável pela chave">
                      <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                    </Tooltip>
                  </span>
                }
                name="user_id"
                className="mt-4"
                rules={[
                  {
                    required: keyOwner === "another_user",
                    message: `Por favor, informe o ID do usuário ao qual você está atribuindo a chave`,
                  },
                ]}
              >
                <div>
                  <div style={{ display: "flex", marginBottom: "8px" }}>
                    <Select
                      showSearch
                      placeholder="Digite o e-mail para buscar usuários"
                      filterOption={false}
                      onSearch={handleUserSearch}
                      onSelect={(value, option) => handleUserSelect(value, option as UserOption)}
                      options={userOptions}
                      loading={userSearchLoading}
                      allowClear
                      style={{ width: "100%" }}
                      notFoundContent={userSearchLoading ? "Buscando..." : "Nenhum usuário encontrado"}
                    />
                    <Button2 onClick={() => setIsCreateUserModalVisible(true)} style={{ marginLeft: "8px" }}>
                      Criar Usuário
                    </Button2>
                  </div>
                  <div className="text-xs text-gray-500">Pesquise por e-mail para encontrar usuários</div>
                </div>
              </Form.Item>
            )}
            {keyOwner === "agent" && (
              <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-md">
                <div className="mb-3">
                  <span className="text-sm font-medium text-gray-700">
                    Select Agent <span className="text-red-500">*</span>
                  </span>
                </div>
                <Select
                  showSearch
                  placeholder="Selecionar um agente"
                  style={{ width: "100%" }}
                  value={selectedAgentId}
                  onChange={(value) => setSelectedAgentId(value)}
                  filterOption={(input, option) =>
                    (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                  }
                  options={agentsList.map((a) => ({
                    label: a.agent_name || a.agent_id,
                    value: a.agent_id,
                  }))}
                />
                <div className="text-xs text-gray-500 mt-2">
                  Esta chave será usada pelo agente selecionado para fazer requisições ao Polyglot
                </div>
              </div>
            )}
            <Form.Item
              label={
                <span>
                  Organização{" "}
                  <Tooltip title="A organização à qual esta chave pertence. Selecionar uma organização filtra as equipes disponíveis.">
                    <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                  </Tooltip>
                </span>
              }
              name="organization_id"
              className="mt-4"
            >
              <OrganizationDropdown
                organizations={organizations}
                loading={isOrganizationsLoading}
                disabled={userRole !== "Admin"}
                onChange={(orgId) => {
                  setSelectedOrganizationId(orgId || null);
                  // Clear team and project when org changes
                  setSelectedCreateKeyTeam(null);
                  setSelectedProjectId(null);
                  form.setFieldValue("team_id", undefined);
                  form.setFieldValue("project_id", undefined);
                }}
              />
            </Form.Item>
            <Form.Item
              label={
                <span>
                  Time{" "}
                  <Tooltip title="A equipe à qual esta chave pertence, que determina os modelos disponíveis e limites de orçamento">
                    <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                  </Tooltip>
                </span>
              }
              name="team_id"
              initialValue={team ? team.team_id : null}
              className="mt-4"
              rules={[
                {
                  required: keyOwner === "service_account",
                  message: "Por favor, selecione uma equipe para a conta de serviço",
                },
              ]}
              help={keyOwner === "service_account" ? "obrigatório" : ""}
            >
              <TeamDropdown
                disabled={selectedProjectId !== null}
                organizationId={selectedOrganizationId}
                onTeamSelect={(team) => {
                  setSelectedCreateKeyTeam(team);
                  setSelectedProjectId(null);
                  form.setFieldValue("project_id", undefined);
                  // Auto-populate org from team for non-admin users
                  if (team?.organization_id) {
                    setSelectedOrganizationId(team.organization_id);
                    form.setFieldValue("organization_id", team.organization_id);
                  } else if (!team) {
                    setSelectedOrganizationId(null);
                    form.setFieldValue("organization_id", undefined);
                  }
                }}
              />
            </Form.Item>
            {enableProjectsUI && (
              <Form.Item
                label={
                  <span>
                    Projeto{" "}
                    <Tooltip title="Atribuir esta chave a um projeto. Selecionar um projeto irá travar a equipe para a equipe do projeto.">
                      <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                    </Tooltip>
                  </span>
                }
                name="project_id"
                className="mt-4"
              >
                <ProjectDropdown
                  projects={projects}
                  teamId={selectedCreateKeyTeam?.team_id}
                  loading={isProjectsLoading || !teams}
                  onChange={(projectId) => {
                    if (!projectId) {
                      setSelectedProjectId(null);
                      setSelectedCreateKeyTeam(null);
                      form.setFieldValue("team_id", undefined);
                      return;
                    }
                    setSelectedProjectId(projectId);
                  }}
                />
              </Form.Item>
            )}
          </div>

          {/* Show message when team selection is required */}
          {isFormDisabled && (
            <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <Text className="text-blue-800 text-sm">
                Por favor selecione uma equipe para continuar configurando sua Chave Virtual. Se você não visualizar nenhuma equipe, por favor entre em contato com o Administrador do Proxy para fornecer acesso aos modelos ou adicioná-lo a uma equipe.
              </Text>
            </div>
          )}

          {/* Section 2: Key Details */}
          {!isFormDisabled && (
            <div className="mb-8">
              <Title className="mb-4">Detalhes da Chave</Title>
              <Form.Item
                label={
                  <span>
                    {keyOwner === "you" || keyOwner === "another_user" ? "Nome da Chave" : "ID da Conta de Serviço"}{" "}
                    <Tooltip
                      title={
                        keyOwner === "you" || keyOwner === "another_user"
                          ? "Um nome descritivo para identificar esta chave"
                          : "Identificador único para esta conta de serviço"
                      }
                    >
                      <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                    </Tooltip>
                  </span>
                }
                name="key_alias"
                rules={[
                  {
                    required: true,
                    message: `Por favor, informe um ${keyOwner === "you" ? "nome para a chave" : "ID para a conta de serviço"}`,
                  },
                ]}
                help="obrigatório"
              >
                <TextInput placeholder="" />
              </Form.Item>

              <Form.Item
                label={
                  <span>
                    Modelos{" "}
                    <Tooltip title="Selecione quais modelos esta chave pode acessar. Escolha 'Todos os Modelos da Equipe' para conceder acesso a todos os modelos disponíveis para a equipe. Deixe vazio para permitir acesso a todos os modelos.">
                      <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                    </Tooltip>
                  </span>
                }
                name="models"
                rules={[]}
                help={
                  keyType === "management" || keyType === "read_only"
                    ? "O campo Modelos está desabilitado para este tipo de chave"
                    : "opcional - deixe vazio para permitir acesso a todos os modelos"
                }
                className="mt-4"
              >
                <Select
                  mode="multiple"
                  placeholder="Select models"
                  style={{ width: "100%" }}
                  disabled={keyType === "management" || keyType === "read_only"}
                  onChange={(values) => {
                    if (values.includes("all-team-models")) {
                      form.setFieldsValue({ models: ["all-team-models"] });
                    } else if (values.includes("all-proxy-models")) {
                      form.setFieldsValue({ models: ["all-proxy-models"] });
                    }
                  }}
                >
                  {!selectedProjectId && selectedCreateKeyTeam && (
                    <Option key="all-team-models" value="all-team-models">
                      Todos os Modelos do Time
                    </Option>
                  )}
                  {!selectedProjectId && !selectedCreateKeyTeam && (
                    <Option key="all-proxy-models" value="all-proxy-models">
                      Todos os Modelos do Proxy
                    </Option>
                  )}
                  {modelsToPick.map((model: string) => (
                    <Option key={model} value={model} disabled={hasAllModelsSentinel(selectedModels)}>
                      {getModelDisplayName(model)}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                label={
                  <span>
                    Tipo de Chave{" "}
                    <Tooltip title="Selecione o tipo de chave para determinar quais rotas e operações esta chave pode acessar">
                      <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                    </Tooltip>
                  </span>
                }
                name="key_type"
                initialValue="llm_api"
                className="mt-4"
              >
                <Select
                  defaultValue="llm_api"
                  placeholder="Select key type"
                  style={{ width: "100%" }}
                  optionLabelProp="label"
                  onChange={(value) => {
                    setKeyType(value);
                    // Clear models field and disable if management or read_only
                    if (value === "management" || value === "read_only") {
                      form.setFieldsValue({ models: [] });
                    }
                  }}
                >
                  <Option value="llm_api" label="APIs de IA">
                    <div style={{ padding: "4px 0" }}>
                      <Typography.Text strong>APIs de IA</Typography.Text>
                      <Typography.Paragraph type="secondary" style={{ fontSize: 11, margin: "2px 0 0" }}>
                        Pode chamar apenas rotas de API de IA (chat/completions, embeddings, etc.)
                      </Typography.Paragraph>
                    </div>
                  </Option>
                  <Option value="management" label="Gerenciamento">
                    <div style={{ padding: "4px 0" }}>
                      <Typography.Text strong>Gerenciamento</Typography.Text>
                      <Typography.Paragraph type="secondary" style={{ fontSize: 11, margin: "2px 0 0" }}>
                        Pode chamar apenas rotas de gerenciamento (gerenciamento de usuário/equipe/chave)
                      </Typography.Paragraph>
                    </div>
                  </Option>
                  <Option value="default" label="Acesso Total">
                    <div style={{ padding: "4px 0" }}>
                      <Typography.Text strong>Acesso Total</Typography.Text>
                      <Typography.Paragraph type="secondary" style={{ fontSize: 11, margin: "2px 0 0" }}>
                        Pode chamar todas as rotas (APIs de IA, Gerenciamento e somente leitura)
                      </Typography.Paragraph>
                    </div>
                  </Option>
                </Select>
              </Form.Item>
            </div>
          )}

          {/* Section 3: Optional Settings */}
          {!isFormDisabled && (
            <div className="mb-8">
              <Accordion className="mt-4 mb-4">
                <AccordionHeader>
                  <Title className="m-0">Configurações Opcionais</Title>
                </AccordionHeader>
                <AccordionBody>
                  <Form.Item
                    className="mt-4"
                    label={
                      <span>
                        {`Orçamento Máximo (${currency})`}{" "}
                        <Tooltip title="Valor máximo que esta chave pode gastar (convertido para a moeda selecionada). Quando atingido, a chave será bloqueada de fazer requisições adicionais">
                          <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                        </Tooltip>
                      </span>
                    }
                    name="max_budget"
                    help={
                      team?.max_budget !== null && team?.max_budget !== undefined
                        ? `Orçamento não pode exceder o orçamento máximo da equipe: ${formatSpend(team.max_budget, 4, currency, rate)}`
                        : "Orçamento não pode exceder o orçamento máximo da equipe: ilimitado"
                    }
                    rules={[
                      {
                        validator: async (_, value) => {
                          if (value && team && team.max_budget !== null && value > team.max_budget) {
                            throw new Error(
                              `Orçamento não pode exceder o orçamento máximo da equipe: ${formatSpend(team.max_budget, 4, currency, rate)}`,
                            );
                          }
                        },
                      },
                    ]}
                  >
                    <CurrencyMoneyInput />
                  </Form.Item>
                  <Form.Item
                    className="mt-4"
                    label={
                      <span>
                        Redefinir Orçamento{" "}
                        <Tooltip title="Com que frequência o orçamento deve ser redefinido. Por exemplo, definir 'diário' redefinirá o orçamento a cada 24 horas">
                          <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                        </Tooltip>
                      </span>
                    }
                    name="budget_duration"
                    help={`Redefinição de Orçamento da Equipe: ${team?.budget_duration !== null && team?.budget_duration !== undefined ? team?.budget_duration : "Nenhum"}`}
                  >
                    <BudgetDurationDropdown onChange={(value) => form.setFieldValue("budget_duration", value)} />
                  </Form.Item>
                  <Form.Item
                    className="mt-4"
                    label={
                      <span>
                        Janelas de Orçamento{" "}
                        <Tooltip title="Defina múltiplas janelas de orçamento independentes (por exemplo, por hora $10 E mensal $200). Cada janela rastreia gastos separadamente e se reinicia segundo seu próprio cronograma.">
                          <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                        </Tooltip>
                      </span>
                    }
                  >
                    <BudgetWindowsEditor value={budgetLimits} onChange={setBudgetLimits} />
                  </Form.Item>
                  <Form.Item
                    className="mt-4"
                    label={
                      <span>
                        Roteamento por Orçamento{" "}
                        <Tooltip title="Quando um modelo excede seu orçamento por modelo (model_max_budget), as requisições são automaticamente redirecionadas para modelos alternativos ao invés de falhar. Configure orçamentos por modelo nas Configurações Avançadas.">
                          <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                        </Tooltip>
                      </span>
                    }
                  >
                    <BudgetFallbacksEditor
                      key={budgetFallbacksKey}
                      value={budgetFallbacks}
                      onChange={setBudgetFallbacks}
                      availableModels={modelsToPick}
                    />
                  </Form.Item>
                  <Form.Item
                    className="mt-4"
                    label={
                      <span>
                        Limite de Tokens por Minuto (TPM){" "}
                        <Tooltip title="Número máximo de tokens que esta chave pode processar por minuto. Ajuda a controlar uso e custos">
                          <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                        </Tooltip>
                      </span>
                    }
                    name="tpm_limit"
                    help={`TPM não pode exceder o limite de TPM da equipe: ${team?.tpm_limit !== null && team?.tpm_limit !== undefined ? team?.tpm_limit : "ilimitado"}`}
                    rules={[
                      {
                        validator: async (_, value) => {
                          if (value && team && team.tpm_limit !== null && value > team.tpm_limit) {
                            throw new Error(`Limite de TPM não pode exceder o limite de TPM da equipe: ${team.tpm_limit}`);
                          }
                        },
                      },
                    ]}
                  >
                    <NumericalInput step={1} width={400} />
                  </Form.Item>
                  <RateLimitTypeFormItem
                    type="tpm"
                    name="tpm_limit_type"
                    className="mt-4"
                    initialValue={null}
                    form={form}
                    showDetailedDescriptions={true}
                  />
                  <Form.Item
                    className="mt-4"
                    label={
                      <span>
                        Limite de Requisições por Minuto (RPM){" "}
                        <Tooltip title="Número máximo de requisições API que esta chave pode fazer por minuto. Ajuda a prevenir abusos e gerenciar carga">
                          <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                        </Tooltip>
                      </span>
                    }
                    name="rpm_limit"
                    help={`RPM não pode exceder o limite de RPM da equipe: ${team?.rpm_limit !== null && team?.rpm_limit !== undefined ? team?.rpm_limit : "ilimitado"}`}
                    rules={[
                      {
                        validator: async (_, value) => {
                          if (value && team && team.rpm_limit !== null && value > team.rpm_limit) {
                            throw new Error(`Limite de RPM não pode exceder o limite de RPM da equipe: ${team.rpm_limit}`);
                          }
                        },
                      },
                    ]}
                  >
                    <NumericalInput step={1} width={400} />
                  </Form.Item>
                  <RateLimitTypeFormItem
                    type="rpm"
                    name="rpm_limit_type"
                    className="mt-4"
                    initialValue={null}
                    form={form}
                    showDetailedDescriptions={true}
                  />
                  <Form.Item
                    className="mt-4"
                    label={
                      <span>
                        Limites de Taxa por Tag{" "}
                        <Tooltip title="Limite de taxa aplicado a tags de requisição para que cada tag (ex: uma célula ou grupo) tenha seu próprio contador RPM. Requisições sem tag correspondente usam o limite de nível da chave.">
                          <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                        </Tooltip>
                      </span>
                    }
                  >
                    <TagRateLimitEditor value={tagRateLimits} onChange={setTagRateLimits} />
                  </Form.Item>
                  <Form.Item
                    className="mt-4"
                    label={
                      <span>
                        Aceleração quando orçamento excedido{" "}
                        <Tooltip title="Quando esta chave exceder seu orçamento máximo, reduz seu TPM/RPM para a porcentagem configurada globalmente em vez de bloquear totalmente o acesso. Requer budget_exceeded_throttle_percentage em litellm_settings e um limite TPM/RPM na chave.">
                          <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                        </Tooltip>
                      </span>
                    }
                    name="throttle_on_budget_exceeded"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="Yes" unCheckedChildren="No" />
                  </Form.Item>
                  <Form.Item
                    label={
                      <span>
                        Guardrails{" "}
                        <Tooltip title="Aplicar guardrails de segurança a esta chave para filtrar conteúdo ou aplicar políticas">
                          <a
                            href="https://docs.litellm.ai/docs/proxy/guardrails/quick_start"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()} // Prevent accordion from collapsing when clicking link
                          >
                            <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                          </a>
                        </Tooltip>
                      </span>
                    }
                    name="guardrails"
                    className="mt-4"
                    help="Selecione guardrails existentes ou digite novos"
                  >
                    <Select
                      mode="tags"
                      style={{ width: "100%" }}
                      placeholder="Select or enter guardrails"
                      options={guardrailsList.map((name) => ({ value: name, label: name }))}
                    />
                  </Form.Item>
                  <Form.Item
                    label={
                      <span>
                        Desativar Guardrails Globais{" "}
                        <Tooltip title="Quando ativado, esta chave ignorará qualquer guardrail configurada para rodar em cada requisição (guardrails globais)">
                          <a
                            href="https://docs.litellm.ai/docs/proxy/guardrails/quick_start"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()} // Prevent accordion from collapsing when clicking link
                          >
                            <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                          </a>
                        </Tooltip>
                      </span>
                    }
                    name="disable_global_guardrails"
                    className="mt-4"
                    valuePropName="checked"
                    help="Ignorar guardrails globais para esta chave"
                  >
                    <Switch checkedChildren="Yes" unCheckedChildren="No" />
                  </Form.Item>
                  <Form.Item
                    label={
                      <span>
                        Políticas{" "}
                        <Tooltip title="Aplicar políticas a esta chave para controlar guardrails e outras configurações">
                          <a
                            href="https://docs.litellm.ai/docs/proxy/guardrails/guardrail_policies"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()} // Prevent accordion from collapsing when clicking link
                          >
                            <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                          </a>
                        </Tooltip>
                      </span>
                    }
                    name="policies"
                    className="mt-4"
                    help="Selecione políticas existentes ou digite novas"
                  >
                    <Select
                      mode="tags"
                      style={{ width: "100%" }}
                      placeholder="Select or enter policies"
                      options={policiesList.map((name) => ({ value: name, label: name }))}
                    />
                  </Form.Item>
                  <Form.Item
                    label={
                      <span>
                        Prompts{" "}
                        <Tooltip title="Permitir que esta chave use templates de prompt específicos">
                          <a
                            href="https://docs.litellm.ai/docs/proxy/prompt_management"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()} // Prevent accordion from collapsing when clicking link
                          >
                            <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                          </a>
                        </Tooltip>
                      </span>
                    }
                    name="prompts"
                    className="mt-4"
                    help="Selecione prompts existentes ou digite novos"
                  >
                    <Select
                      mode="tags"
                      style={{ width: "100%" }}
                      placeholder="Select or enter prompts"
                      options={promptsList.map((name) => ({ value: name, label: name }))}
                    />
                  </Form.Item>
                  <Form.Item
                    label={
                      <span>
                        Grupos de Acesso{" "}
                        <Tooltip title="Atribuir grupos de acesso a esta chave. Grupos de acesso controlam quais modelos, servidores MCP e agentes esta chave pode usar">
                          <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                        </Tooltip>
                      </span>
                    }
                    name="access_group_ids"
                    className="mt-4"
                    help="Selecione grupos de acesso para atribuir a esta chave"
                  >
                    <AccessGroupSelector placeholder="Select access groups (optional)" />
                  </Form.Item>
                  <Form.Item
                    label={
                      <span>
                        Rotas de Passagem Permitidas{" "}
                        <Tooltip title="Permitir que esta chave use rotas de passagem específicas">
                          <a
                            href="https://docs.litellm.ai/docs/proxy/pass_through"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()} // Prevent accordion from collapsing when clicking link
                          >
                            <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                          </a>
                        </Tooltip>
                      </span>
                    }
                    name="allowed_passthrough_routes"
                    className="mt-4"
                    help="Selecione rotas de passagem existentes ou digite novas"
                  >
                    <PassThroughRoutesSelector
                      onChange={(values: string[]) => form.setFieldValue("allowed_passthrough_routes", values)}
                      value={form.getFieldValue("allowed_passthrough_routes")}
                      accessToken={accessToken}
                      placeholder="Select or enter pass through routes"
                      teamId={selectedCreateKeyTeam ? selectedCreateKeyTeam.team_id : null}
                    />
                  </Form.Item>
                  <Form.Item
                    label={
                      <span>
                        Lojas de Vetores Permitidas{" "}
                        <Tooltip title="Selecione quais lojas de vetores esta chave pode acessar. Se nada selecionado, a chave terá acesso a todas as lojas de vetores disponíveis">
                          <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                        </Tooltip>
                      </span>
                    }
                    name="allowed_vector_store_ids"
                    className="mt-4"
                    help="Selecione lojas de vetores que esta chave pode acessar. Deixe vazio para acesso a todas as lojas de vetores"
                  >
                    <VectorStoreSelector
                      onChange={(values: string[]) => form.setFieldValue("allowed_vector_store_ids", values)}
                      value={form.getFieldValue("allowed_vector_store_ids")}
                      accessToken={accessToken}
                      placeholder="Select vector stores (optional)"
                    />
                  </Form.Item>
                  <Form.Item
                    label={
                      <span>
                        Metadados{" "}
                        <Tooltip title="Objeto JSON com informações adicionais sobre esta chave. Usado para rastreamento ou lógica personalizada">
                          <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                        </Tooltip>
                      </span>
                    }
                    name="metadata"
                    className="mt-4"
                  >
                    <Input.TextArea rows={4} placeholder="Enter metadata as JSON" />
                  </Form.Item>
                  <Form.Item
                    label={
                      <span>
                        Tags{" "}
                        <Tooltip title="Tags para rastrear gastos e/ou fazer roteamento baseado em tags. Usado para análise e filtragem">
                          <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                        </Tooltip>
                      </span>
                    }
                    name="tags"
                    className="mt-4"
                    help={`Tags para rastrear gastos e/ou fazer roteamento baseado em tags.`}
                  >
                    <Select
                      mode="tags"
                      style={{ width: "100%" }}
                      placeholder="Select or enter tags"
                      tokenSeparators={[","]}
                      options={tagOptions}
                    />
                  </Form.Item>
                  <Accordion className="mt-4 mb-4">
                    <AccordionHeader>
                      <b>Configurações MCP</b>
                    </AccordionHeader>
                    <AccordionBody>
                      <Form.Item
                        label={
                          <span>
                            Servidores MCP Permitidos{" "}
                            <Tooltip title="Selecione quais servidores MCP ou grupos de acesso esta chave pode acessar">
                              <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                            </Tooltip>
                          </span>
                        }
                        name="allowed_mcp_servers_and_groups"
                        help="Selecione servidores MCP ou grupos de acesso que esta chave pode acessar"
                      >
                        <MCPServerSelector
                          onChange={(val: any) => form.setFieldValue("allowed_mcp_servers_and_groups", val)}
                          value={form.getFieldValue("allowed_mcp_servers_and_groups")}
                          accessToken={accessToken}
                          teamId={selectedCreateKeyTeam?.team_id ?? null}
                          placeholder="Select MCP servers or access groups (optional)"
                          allowNoMcpServers
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
                              accessToken={accessToken}
                              selectedServers={(
                                form.getFieldValue("allowed_mcp_servers_and_groups")?.servers || []
                              ).filter((s: string) => s !== NO_MCP_SERVERS_SENTINEL)}
                              toolPermissions={form.getFieldValue("mcp_tool_permissions") || {}}
                              onChange={(toolPerms) => form.setFieldsValue({ mcp_tool_permissions: toolPerms })}
                            />
                          </div>
                        )}
                      </Form.Item>
                    </AccordionBody>
                  </Accordion>

                  <Accordion className="mt-4 mb-4">
                    <AccordionHeader>
                      <b>Configurações do Agente</b>
                    </AccordionHeader>
                    <AccordionBody>
                      <Form.Item
                        label={
                          <span>
                            Agentes Permitidos{" "}
                            <Tooltip title="Selecione quais agentes ou grupos de acesso esta chave pode acessar">
                              <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                            </Tooltip>
                          </span>
                        }
                        name="allowed_agents_and_groups"
                        help="Selecione agentes ou grupos de acesso que esta chave pode acessar"
                      >
                        <AgentSelector
                          onChange={(val: any) => form.setFieldValue("allowed_agents_and_groups", val)}
                          value={form.getFieldValue("allowed_agents_and_groups")}
                          accessToken={accessToken}
                          placeholder="Select agents or access groups (optional)"
                        />
                      </Form.Item>
                    </AccordionBody>
                  </Accordion>

                    <Accordion className="mt-4 mb-4">
                      <AccordionHeader>
                        <b>Configurações de Registro</b>
                      </AccordionHeader>
                      <AccordionBody>
                        <div className="mt-4">
                          <PremiumLoggingSettings
                            value={loggingSettings}
                            onChange={setLoggingSettings}
                            premiumUser={true}
                            disabledCallbacks={disabledCallbacks}
                            onDisabledCallbacksChange={setDisabledCallbacks}
                          />
                        </div>
                      </AccordionBody>
                    </Accordion>

                  <Accordion key={`router-settings-accordion-${routerSettingsKey}`} className="mt-4 mb-4">
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
                            userModels.length > 0
                              ? { data: userModels.map((model) => ({ model_name: model })) }
                              : undefined
                          }
                        />
                      </div>
                    </AccordionBody>
                  </Accordion>

                  <Accordion className="mt-4 mb-4">
                    <AccordionHeader>
                      <b>Aliases dos Modelos</b>
                    </AccordionHeader>
                    <AccordionBody>
                      <div className="mt-4">
                        <Text className="text-sm text-gray-600 mb-4">
                          Create custom aliases for models that can be used in API calls. This allows you to create
                          shortcuts for specific models.
                        </Text>
                        <ModelAliasManager
                          accessToken={accessToken}
                          initialModelAliases={modelAliases}
                          onAliasUpdate={setModelAliases}
                          showExampleConfig={false}
                        />
                      </div>
                    </AccordionBody>
                  </Accordion>

                  <Accordion className="mt-4 mb-4">
                    <AccordionHeader>
                      <b>Ciclo de Vida da Chave</b>
                    </AccordionHeader>
                    <AccordionBody>
                      <div className="mt-4">
                        <KeyLifecycleSettings
                          form={form}
                          autoRotationEnabled={autoRotationEnabled}
                          onAutoRotationChange={setAutoRotationEnabled}
                          rotationInterval={rotationInterval}
                          onRotationIntervalChange={setRotationInterval}
                          isCreateMode={true}
                        />
                      </div>
                    </AccordionBody>
                    <Form.Item name="duration" hidden initialValue={null}>
                      <Input />
                    </Form.Item>
                  </Accordion>
                  <Accordion className="mt-4 mb-4">
                    <AccordionHeader>
                      <div className="flex items-center gap-2">
                        <b>Configurações Avançadas</b>
                        <Tooltip
                          title={
                            <span>
                              Saiba mais sobre configurações avançadas em nossa{" "}
                              <a
                                href={
                                  proxyBaseUrl
                                    ? `${proxyBaseUrl}/#/key%20management/generate_key_fn_key_generate_post`
                                    : `/#/key%20management/generate_key_fn_key_generate_post`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300"
                              >
                                documentação
                              </a>
                            </span>
                          }
                        >
                          <InfoCircleOutlined className="text-gray-400 hover:text-gray-300 cursor-help" />
                        </Tooltip>
                      </div>
                    </AccordionHeader>
                    <AccordionBody>
                      <SchemaFormFields
                        schemaComponent="GenerateKeyRequest"
                        form={form}
                        excludedFields={[
                          "key_alias",
                          "team_id",
                          "organization_id",
                          "models",
                          "duration",
                          "metadata",
                          "tags",
                          "guardrails",
                          "max_budget",
                          "budget_duration",
                          "tpm_limit",
                          "rpm_limit",
                          ...(disableCustomApiKeys ? ["key"] : []),
                        ]}
                      />
                    </AccordionBody>
                  </Accordion>
                </AccordionBody>
              </Accordion>
            </div>
          )}

          <div style={{ textAlign: "right", marginTop: "10px" }}>
            <Button2 htmlType="submit" disabled={isFormDisabled} style={{ opacity: isFormDisabled ? 0.5 : 1 }}>
              Criar Chave
            </Button2>
          </div>
        </Form>
      </Modal>

      {/* Add the Criar Usuário Modal */}
      {isCreateUserModalVisible && (
        <Modal
          title="Criar Novo Usuário"
          open={isCreateUserModalVisible}
          onCancel={() => setIsCreateUserModalVisible(false)}
          footer={null}
          width={800}
        >
          <CreateUserButton
            userID={userID}
            accessToken={accessToken}
            teams={teams}
            possibleUIRoles={possibleUIRoles}
            onUserCreated={handleUserCreated}
            isEmbedded={true}
          />
        </Modal>
      )}

      {apiKey && (
        <Modal open={isModalVisible} onOk={handleOk} onCancel={handleCancel} footer={null}>
          <Grid numItems={1} className="gap-2 w-full">
            <Title>Salve sua Chave</Title>
            <Col numColSpan={1}>
              {apiKey != null ? (
                <CreatedKeyDisplay apiKey={apiKey} />
              ) : (
                <Text>Chave sendo criada, isso pode levar 30s</Text>
              )}
            </Col>
          </Grid>
        </Modal>
      )}
    </div>
  );
};

export default CreateKey;