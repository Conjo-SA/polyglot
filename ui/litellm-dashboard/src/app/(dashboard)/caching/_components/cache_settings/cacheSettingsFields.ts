import type { FormItemProps } from "antd";

export type CacheFieldType = "string" | "password" | "integer" | "float" | "boolean" | "list" | "model-select";

export type RedisType = "node" | "cluster" | "sentinel" | "semantic";

export type CacheSection = "connection" | "cluster" | "sentinel" | "semantic" | "ssl" | "cacheManagement" | "gcp";

export type CacheFieldRule = NonNullable<FormItemProps["rules"]>[number];

export interface CacheField {
  readonly name: string;
  readonly label: string;
  readonly type: CacheFieldType;
  readonly section: CacheSection;
  readonly helpText: string;
  readonly redisType: RedisType | null;
  readonly defaultValue?: string | number | boolean;
  readonly rules?: CacheFieldRule[];
}

export const REDIS_TYPES: readonly RedisType[] = ["node", "cluster", "sentinel", "semantic"];

export const REDIS_TYPE_DESCRIPTIONS: Readonly<Record<RedisType, string>> = {
  node: "Nó Redis padrão/instância única",
  cluster: "Modo Redis Cluster para alta disponibilidade e escalabilidade horizontal",
  sentinel: "Modo Redis Sentinel para alta disponibilidade com failover automático",
  semantic: "Cache semântico que reutiliza respostas para prompts similares",
};

const portRule: CacheFieldRule = {
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

const jsonListRule: CacheFieldRule = {
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

const nonNegativeIntegerRule: CacheFieldRule = {
  validator: (_rule, value) => {
    if (value === undefined || value === null || String(value).trim() === "") {
      return Promise.resolve();
    }
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0) {
      return Promise.reject(new Error("Deve ser um número inteiro não negativo"));
    }
    return Promise.resolve();
  },
};

const numberRule: CacheFieldRule = {
  validator: (_rule, value) => {
    if (value === undefined || value === null || String(value).trim() === "") {
      return Promise.resolve();
    }
    if (Number.isNaN(Number(value))) {
      return Promise.reject(new Error("Deve ser um número"));
    }
    return Promise.resolve();
  },
};

export const CACHE_FIELDS: readonly CacheField[] = [
  {
    name: "url",
    label: "URL do Redis",
    type: "string",
    section: "connection",
    helpText:
      "URL de conexão completa do Redis/Valkey (por exemplo, redis://:senha@host:6379/1). Quando definido, tem prioridade sobre Host, Porta, Senha e Índice do Banco de Dados.",
    redisType: null,
  },
  {
    name: "host",
    label: "Host",
    type: "string",
    section: "connection",
    helpText: "Nome de host ou endereço IP do servidor Redis",
    redisType: null,
  },
  {
    name: "port",
    label: "Porta",
    type: "string",
    section: "connection",
    helpText: "Número da porta do servidor Redis",
    redisType: null,
    defaultValue: "6379",
    rules: [portRule],
  },
  {
    name: "db",
    label: "Índice do Banco de Dados",
    type: "integer",
    section: "connection",
    helpText: "Índice lógico do banco de dados para isolar o cache (ex: 1 para redis://host:6379/1)",
    redisType: null,
    rules: [nonNegativeIntegerRule],
  },
  {
    name: "password",
    label: "Senha",
    type: "password",
    section: "connection",
    helpText: "Senha do servidor Redis",
    redisType: null,
  },
  {
    name: "username",
    label: "Nome de Usuário",
    type: "string",
    section: "connection",
    helpText: "Nome de usuário do servidor Redis (se necessário)",
    redisType: null,
  },
  {
    name: "redis_startup_nodes",
    label: "Nós Iniciais",
    type: "list",
    section: "cluster",
    helpText: 'Lista de nós inicias para Redis Cluster (ex: [{"host": "127.0.0.1", "port": "7001"}])',
    redisType: "cluster",
    rules: [jsonListRule],
  },
  {
    name: "sentinel_nodes",
    label: "Nós Sentinel",
    type: "list",
    section: "sentinel",
    helpText: 'Lista de nós Sentinel (ex: [["localhost", 26379]])',
    redisType: "sentinel",
    rules: [jsonListRule],
  },
  {
    name: "service_name",
    label: "Nome do Serviço",
    type: "string",
    section: "sentinel",
    helpText: "Nome do serviço master para Redis Sentinel",
    redisType: "sentinel",
  },
  {
    name: "sentinel_password",
    label: "Senha do Sentinel",
    type: "password",
    section: "sentinel",
    helpText: "Senha para autenticação do Redis Sentinel",
    redisType: "sentinel",
  },
  {
    name: "similarity_threshold",
    label: "Limiar de Similaridade",
    type: "float",
    section: "semantic",
    helpText: "Limiar de similaridade para cache semântico",
    redisType: "semantic",
    defaultValue: 0.8,
    rules: [numberRule],
  },
  {
    name: "redis_semantic_cache_embedding_model",
    label: "Modelo de Embedding",
    type: "model-select",
    section: "semantic",
    helpText: "Modelo de embedding para cache semântico",
    redisType: "semantic",
  },
  {
    name: "ssl",
    label: "SSL",
    type: "boolean",
    section: "ssl",
    helpText: "Habilitar conexão SSL/TLS",
    redisType: null,
    defaultValue: false,
  },
  {
    name: "ssl_cert_reqs",
    label: "Requisitos do Cert SSL",
    type: "string",
    section: "ssl",
    helpText: "Requisitos do certificado SSL (None, CERT_REQUIRED, CERT_OPTIONAL)",
    redisType: null,
  },
  {
    name: "ssl_check_hostname",
    label: "Verificação de Hostname SSL",
    type: "boolean",
    section: "ssl",
    helpText: "Habilitar verificação de hostname SSL",
    redisType: null,
    defaultValue: false,
  },
  {
    name: "namespace",
    label: "Namespace",
    type: "string",
    section: "cacheManagement",
    helpText: "Prefixo de namespace para chaves de cache",
    redisType: null,
  },
  {
    name: "ttl",
    label: "TTL (segundos)",
    type: "float",
    section: "cacheManagement",
    helpText: "Tempo de vida para itens em cache em segundos",
    redisType: null,
    rules: [numberRule],
  },
  {
    name: "max_connections",
    label: "Máximo de Conexões",
    type: "integer",
    section: "cacheManagement",
    helpText: "Número máximo de conexões no pool de conexões",
    redisType: null,
    rules: [nonNegativeIntegerRule],
  },
  {
    name: "gcp_service_account",
    label: "Conta de Serviço GCP",
    type: "string",
    section: "gcp",
    helpText:
      "Conta de serviço GCP para autenticação IAM (ex: projects/-/serviceAccounts/sua-sa@projeto.iam.gserviceaccount.com)",
    redisType: null,
  },
  {
    name: "gcp_ssl_ca_certs",
    label: "Certificados CA SSL GCP",
    type: "string",
    section: "gcp",
    helpText: "Caminho para o arquivo de certificado CA SSL para GCP Memorystore Redis",
    redisType: null,
  },
];
