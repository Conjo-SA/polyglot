export const ERROR_CODE_OPTIONS: { label: string; value: string }[] = [
  { label: "400 - Bad Request", value: "400" },
  { label: "401 - Invalid Authentication", value: "401" },
  { label: "403 - Permission Denied", value: "403" },
  { label: "404 - Not Found", value: "404" },
  { label: "408 - Request Timeout", value: "408" },
  { label: "422 - Unprocessable Entity", value: "422" },
  { label: "429 - Rate Limited", value: "429" },
  { label: "500 - Internal Server Error", value: "500" },
  { label: "502 - Bad Gateway", value: "502" },
  { label: "503 - Service Unavailable", value: "503" },
  { label: "529 - Overloaded", value: "529" },
];

/** Call types that represent MCP tool invocations (shared across columns, index, drawer). */
export const MCP_CALL_TYPES = ["call_mcp_tool", "list_mcp_tools"];

/** Call types that represent agent/A2A requests (e.g. asend_message). */
export const AGENT_CALL_TYPES = ["asend_message"];

export const QUICK_SELECT_OPTIONS: { label: string; value: number; unit: string }[] = [
  { label: "Último Minuto", value: 1, unit: "minutes" },
  { label: "Últimos 15 Minutos", value: 15, unit: "minutes" },
  { label: "Última Hora", value: 1, unit: "hours" },
  { label: "Últimas 4 Horas", value: 4, unit: "hours" },
  { label: "Últimas 24 Horas", value: 24, unit: "hours" },
  { label: "Últimos 7 Dias", value: 7, unit: "days" },
];
