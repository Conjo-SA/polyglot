/**
 * Shared configuration for agent form fields
 * Used across create, view, and update operations
 */

export interface FieldConfig {
  name: string;
  label: string;
  type: "text" | "textarea" | "url" | "switch" | "list" | "select";
  required?: boolean;
  tooltip?: string;
  placeholder?: string;
  defaultValue?: any;
  rows?: number;
  validation?: any[];
  options?: string[];
  helpText?: string;
}

export interface SectionConfig {
  key: string;
  title: string;
  fields: FieldConfig[];
  defaultExpanded?: boolean;
}

export const AGENT_FORM_CONFIG: {
  basic: SectionConfig;
  skills: SectionConfig;
  capabilities: SectionConfig;
  optional: SectionConfig;
  litellm: SectionConfig;
  cost: SectionConfig;
  tracing: SectionConfig;
} = {
  basic: {
    key: "basic",
    title: "Informações Básicas",
    defaultExpanded: true,
    fields: [
      {
        name: "name",
        label: "Nome de Exibição",
        type: "text",
        required: true,
        placeholder: "ex.: Agente de Suporte ao Cliente",
      },
      {
        name: "description",
        label: "Descrição",
        type: "textarea",
        required: true,
        placeholder: "Descreva o que este agente faz...",
        rows: 3,
      },
      {
        name: "url",
        label: "URL",
        type: "url",
        required: false,
        placeholder: "http://localhost:9999/",
        tooltip: "URL base onde o agente está hospedado (opcional)",
      },
      {
        name: "version",
        label: "Versão",
        type: "text",
        placeholder: "1.0.0",
        defaultValue: "1.0.0",
      },
      {
        name: "protocolVersion",
        label: "Versão do Protocolo",
        type: "select",
        options: ["1.0", "0.3"],
        defaultValue: "1.0",
        tooltip:
          "A versão do protocolo A2A que o Polyglot fornece aos clientes para este agente. O Polyglot converte as respostas do agente upstream para esta versão, assim os clientes sempre veem a versão que você escolheu aqui independentemente da versão original do agente.",
        helpText:
          "O Polyglot fornece esta versão aos clientes e converte as respostas do agente upstream para corresponder a ela, independentemente da versão original do agente.",
      },
    ],
  },
  skills: {
    key: "skills",
    title: "Habilidades",
    fields: [
      {
        name: "skills",
        label: "Habilidades",
        type: "list",
        defaultValue: [],
      },
    ],
  },
  capabilities: {
    key: "capabilities",
    title: "Capacidades",
    fields: [
      {
        name: "streaming",
        label: "Streaming",
        type: "switch",
        defaultValue: false,
      },
      {
        name: "pushNotifications",
        label: "Notificações Push",
        type: "switch",
      },
      {
        name: "stateTransitionHistory",
        label: "Histórico de Transição de Estado",
        type: "switch",
      },
    ],
  },
  optional: {
    key: "optional",
    title: "Configurações Opcionais",
    fields: [
      {
        name: "iconUrl",
        label: "URL do Ícone",
        type: "url",
        placeholder: "https://exemplo.com/icone.png",
      },
      {
        name: "documentationUrl",
        label: "URL da Documentação",
        type: "url",
        placeholder: "https://docs.exemplo.com",
      },
      {
        name: "supportsAuthenticatedExtendedCard",
        label: "Suporta Cartão Estendido Autenticado",
        type: "switch",
      },
    ],
  },
  litellm: {
    key: "litellm",
    title: "Parâmetros do Polyglot",
    fields: [
      {
        name: "model",
        label: "Modelo (Opcional)",
        type: "text",
      },
      {
        name: "make_public",
        label: "Tornar Público",
        type: "switch",
      },
    ],
  },
  cost: {
    key: "cost",
    title: "Configuração de Custos",
    fields: [
      {
        name: "cost_per_query",
        label: "Custo Por Consulta ($)",
        type: "text",
        placeholder: "0.0",
        tooltip: "Custo fixo por consulta",
      },
      {
        name: "input_cost_per_token",
        label: "Custo Por Token de Entrada ($)",
        type: "text",
        placeholder: "0.000001",
        tooltip: "Custo por token de entrada",
      },
      {
        name: "output_cost_per_token",
        label: "Custo Por Token de Saída ($)",
        type: "text",
        placeholder: "0.000002",
        tooltip: "Custo por token de saída",
      },
    ],
  },
  tracing: {
    key: "tracing",
    title: "Rastreamento",
    fields: [
      {
        name: "enable_tracing",
        label: "Ativar Rastreamento",
        type: "switch",
        defaultValue: false,
        tooltip: "Ativar rastreamento de requisições para este agente",
      },
    ],
  },
};

export const SKILL_FIELD_CONFIG = {
  id: {
    name: "id",
    label: "Skill ID",
    required: true,
    placeholder: "e.g., hello_world",
  },
  name: {
    name: "name",
    label: "Skill Name",
    required: true,
    placeholder: "e.g., Returns hello world",
  },
  description: {
    name: "description",
    label: "Description",
    required: true,
    placeholder: "What this skill does",
    rows: 2,
  },
  tags: {
    name: "tags",
    label: "Tags",
    required: true,
    placeholder: "Type a tag and press Enter",
  },
  examples: {
    name: "examples",
    label: "Examples",
    placeholder: "Type an example and press Enter",
  },
};

/**
 * Get default form values from configuration
 */
export const getDefaultFormValues = () => {
  const defaults: any = {
    defaultInputModes: ["text"],
    defaultOutputModes: ["text"],
  };

  Object.values(AGENT_FORM_CONFIG).forEach((section) => {
    section.fields.forEach((field) => {
      if (field.defaultValue !== undefined) {
        defaults[field.name] = field.defaultValue;
      }
    });
  });

  return defaults;
};

/**
 * Build agent data from form values according to AgentConfig spec
 */
export const buildAgentDataFromForm = (values: any, existingAgent?: any) => {
  const agentData: any = {
    agent_name: values.agent_name,
    agent_card_params: {
      protocolVersion: values.protocolVersion || "1.0",
      name: values.name || values.agent_name,
      description: values.description || "",
      url: values.url || "",
      version: values.version || "1.0.0",
      defaultInputModes: existingAgent?.agent_card_params?.defaultInputModes || ["text"],
      defaultOutputModes: existingAgent?.agent_card_params?.defaultOutputModes || ["text"],
      capabilities: {
        streaming: values.streaming === true,
        ...(values.pushNotifications !== undefined && { pushNotifications: values.pushNotifications }),
        ...(values.stateTransitionHistory !== undefined && { stateTransitionHistory: values.stateTransitionHistory }),
      },
      skills: values.skills || [],
      ...(values.iconUrl && { iconUrl: values.iconUrl }),
      ...(values.documentationUrl && { documentationUrl: values.documentationUrl }),
      ...(values.supportsAuthenticatedExtendedCard !== undefined && {
        supportsAuthenticatedExtendedCard: values.supportsAuthenticatedExtendedCard,
      }),
    },
  };

  const params: Record<string, any> = {};

  if (values.model) params.model = values.model;
  if (values.make_public !== undefined) params.make_public = values.make_public;
  if (values.cost_per_query) params.cost_per_query = parseFloat(values.cost_per_query);
  if (values.input_cost_per_token) params.input_cost_per_token = parseFloat(values.input_cost_per_token);
  if (values.output_cost_per_token) params.output_cost_per_token = parseFloat(values.output_cost_per_token);

  if (Object.keys(params).length > 0) {
    agentData.litellm_params = params;
  }

  if (values.tpm_limit != null) agentData.tpm_limit = values.tpm_limit;
  if (values.rpm_limit != null) agentData.rpm_limit = values.rpm_limit;
  if (values.session_tpm_limit != null) agentData.session_tpm_limit = values.session_tpm_limit;
  if (values.session_rpm_limit != null) agentData.session_rpm_limit = values.session_rpm_limit;
  // static_headers: convert [{header, value}, ...] → {header: value, ...}
  if (Array.isArray(values.static_headers) && values.static_headers.length > 0) {
    const staticHeaders: Record<string, string> = {};
    values.static_headers.forEach((entry: { header?: string; value?: string }) => {
      const key = entry?.header?.trim();
      if (key) staticHeaders[key] = entry?.value ?? "";
    });
    if (Object.keys(staticHeaders).length > 0) {
      agentData.static_headers = staticHeaders;
    }
  }

  // extra_headers: already an array of strings from Select tags
  if (Array.isArray(values.extra_headers) && values.extra_headers.length > 0) {
    agentData.extra_headers = values.extra_headers;
  }

  return agentData;
};

/**
 * Parse agent data for form fields
 */
export const parseAgentForForm = (agent: any) => {
  const skills =
    agent.agent_card_params?.skills?.map((skill: any) => ({
      ...skill,
      tags: skill.tags,
      examples: skill.examples || [],
    })) || [];

  return {
    agent_name: agent.agent_name,
    name: agent.agent_card_params?.name,
    description: agent.agent_card_params?.description,
    url: agent.agent_card_params?.url,
    version: agent.agent_card_params?.version,
    protocolVersion: agent.agent_card_params?.protocolVersion,
    streaming: agent.agent_card_params?.capabilities?.streaming,
    pushNotifications: agent.agent_card_params?.capabilities?.pushNotifications,
    stateTransitionHistory: agent.agent_card_params?.capabilities?.stateTransitionHistory,
    skills: skills,
    iconUrl: agent.agent_card_params?.iconUrl,
    documentationUrl: agent.agent_card_params?.documentationUrl,
    supportsAuthenticatedExtendedCard: agent.agent_card_params?.supportsAuthenticatedExtendedCard,
    model: agent.litellm_params?.model,
    make_public: agent.litellm_params?.make_public,
    cost_per_query: agent.litellm_params?.cost_per_query,
    input_cost_per_token: agent.litellm_params?.input_cost_per_token,
    output_cost_per_token: agent.litellm_params?.output_cost_per_token,
    tpm_limit: agent.tpm_limit,
    rpm_limit: agent.rpm_limit,
    session_tpm_limit: agent.session_tpm_limit,
    session_rpm_limit: agent.session_rpm_limit,
    // static_headers: {key: value} → [{header, value}, ...]
    static_headers: agent.static_headers
      ? Object.entries(agent.static_headers as Record<string, string>).map(([header, value]) => ({
          header,
          value,
        }))
      : [],
    // extra_headers: already an array of strings
    extra_headers: agent.extra_headers ?? [],
  };
};
