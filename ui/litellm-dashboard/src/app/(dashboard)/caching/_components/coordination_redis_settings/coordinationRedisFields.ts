import type { FormItemProps } from "antd";

export type CoordinationFieldType = "string" | "password" | "integer" | "boolean" | "list";

export type CoordinationRedisType = "node" | "cluster" | "sentinel";

export type CoordinationSection = "connection" | "cluster" | "sentinel" | "ssl";

export type CoordinationFieldRule = NonNullable<FormItemProps["rules"]>[number];

export interface CoordinationField {
  readonly name: string;
  readonly label: string;
  readonly type: CoordinationFieldType;
  readonly section: CoordinationSection;
  readonly helpText: string;
  readonly redisType: CoordinationRedisType | null;
  readonly secret: boolean;
  readonly defaultValue?: string | number | boolean;
  readonly rules?: CoordinationFieldRule[];
}

export const COORDINATION_REDIS_TYPES: readonly CoordinationRedisType[] = ["node", "cluster", "sentinel"];

export const COORDINATION_REDIS_TYPE_DESCRIPTIONS: Readonly<Record<CoordinationRedisType, string>> = {
  node: "Nó Redis padrão/instância única",
  cluster: "Modo Cluster Redis para alta disponibilidade e dimensionamento horizontal",
  sentinel: "Modo Sentinel Redis para alta disponibilidade com failover automático",
};

export const COORDINATION_REDIS_TYPE_LABELS: Readonly<Record<CoordinationRedisType, string>> = {
  node: "Nó (Instância Única)",
  cluster: "Cluster",
  sentinel: "Sentinel",
};

const portRule: CoordinationFieldRule = {
  validator: (_rule, value) => {
    if (value === undefined || value === null || String(value).trim() === "") {
      return Promise.resolve();
    }
    const port = Number(value);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      return Promise.reject(new Error("A porta deve ser um número inteiro entre 1 e 65535"));
    }
    return Promise.resolve();
  },
};

const jsonListRule: CoordinationFieldRule = {
  validator: (_rule, value) => {
    if (value === undefined || value === null || String(value).trim() === "") {
      return Promise.resolve();
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(String(value));
    } catch {
      return Promise.reject(new Error("Deve ser um array JSON válido (use aspas duplas)"));
    }
    if (!Array.isArray(parsed)) {
      return Promise.reject(new Error("Deve ser um array JSON"));
    }
    return Promise.resolve();
  },
};

export const COORDINATION_FIELDS: readonly CoordinationField[] = [
  {
    name: "url",
    label: "Redis URL",
    type: "password",
    section: "connection",
    helpText:
      "URL de conexão completa do Redis/Valkey (ex.: redis://:senha@host:6379/1). Quando definido, tem precedência sobre Host, Porta, Nome de usuário e Senha.",
    redisType: null,
    secret: true,
  },
  {
    name: "host",
    label: "Host",
    type: "string",
    section: "connection",
    helpText: "Nome de host ou endereço IP do servidor Redis",
    redisType: null,
    secret: false,
  },
  {
    name: "port",
    label: "Port",
    type: "integer",
    section: "connection",
    helpText: "Número da porta do servidor Redis",
    redisType: null,
    secret: false,
    defaultValue: "6379",
    rules: [portRule],
  },
  {
    name: "username",
    label: "Username",
    type: "string",
    section: "connection",
    helpText: "Nome de usuário do servidor Redis (se exigido)",
    redisType: null,
    secret: false,
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    section: "connection",
    helpText: "Senha do servidor Redis",
    redisType: null,
    secret: true,
  },
  {
    name: "startup_nodes",
    label: "Startup Nodes",
    type: "list",
    section: "cluster",
    helpText: 'Lista de nós de inicialização para o Cluster Redis (ex.: [{"host": "127.0.0.1", "port": 7001}])',
    redisType: "cluster",
    secret: false,
    rules: [jsonListRule],
  },
  {
    name: "sentinel_nodes",
    label: "Sentinel Nodes",
    type: "list",
    section: "sentinel",
    helpText: 'Lista de nós Sentinel (ex.: [["localhost", 26379]])',
    redisType: "sentinel",
    secret: false,
    rules: [jsonListRule],
  },
  {
    name: "service_name",
    label: "Service Name",
    type: "string",
    section: "sentinel",
    helpText: "Nome do serviço mestre para o Redis Sentinel",
    redisType: "sentinel",
    secret: false,
  },
  {
    name: "sentinel_password",
    label: "Sentinel Password",
    type: "password",
    section: "sentinel",
    helpText: "Senha para autenticação do Redis Sentinel",
    redisType: "sentinel",
    secret: true,
  },
  {
    name: "ssl",
    label: "SSL",
    type: "boolean",
    section: "ssl",
    helpText: "Enable SSL/TLS connection",
    redisType: null,
    secret: false,
    defaultValue: false,
  },
];
