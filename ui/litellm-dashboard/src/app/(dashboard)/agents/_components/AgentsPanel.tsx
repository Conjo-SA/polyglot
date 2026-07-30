import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Badge,
  Text,
} from "@tremor/react";
import { Modal, Alert, Tooltip, Skeleton, Switch } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import { getAgentsList, deleteAgentCall } from "@/components/networking";
import AddAgentForm from "./add_agent_form";
import { isAdminRole } from "@/utils/roles";
import AgentInfoView from "./agent_info";
import NotificationsManager from "@/components/molecules/notifications_manager";
import { Agent } from "@/components/agents/types";
import { Team } from "@/components/key_team_helpers/key_list";
import { DateCell, IdCell, MoneyCell, StatusBadge } from "@/components/shared/table_cells";
import TableIconActionButton from "@/components/common_components/IconActionButton/TableIconActionButtons/TableIconActionButton";

interface AgentsPanelProps {
  accessToken: string | null;
  userRole?: string;
  teams?: Team[] | null;
}

interface AgentsResponse {
  agents: Agent[];
}

const AgentsPanel: React.FC<AgentsPanelProps> = ({ accessToken, userRole, teams }) => {
  const [agentsList, setAgentsList] = useState<Agent[]>([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<{ id: string; name: string } | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [healthCheckEnabled, setHealthCheckEnabled] = useState(false);

  const isAdmin = userRole ? isAdminRole(userRole) : false;

  const fetchAgents = async (healthCheck?: boolean) => {
    if (!accessToken) {
      return;
    }

    setIsLoading(true);
    try {
      const response: AgentsResponse = await getAgentsList(accessToken, healthCheck ?? healthCheckEnabled);
      setAgentsList(response.agents || []);
    } catch (error) {
      console.error("Error fetching agents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, [accessToken]);

  const handleHealthCheckToggle = (checked: boolean) => {
    setHealthCheckEnabled(checked);
    fetchAgents(checked);
  };

  const handleAddAgent = () => {
    if (selectedAgentId) {
      setSelectedAgentId(null);
    }
    setIsAddModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsAddModalVisible(false);
  };

  const handleSuccess = () => {
    fetchAgents();
  };

  const handleDeleteClick = (agentId: string, agentName: string) => {
    setAgentToDelete({ id: agentId, name: agentName });
  };

  const handleDeleteConfirm = async () => {
    if (!agentToDelete || !accessToken) return;

    setIsDeleting(true);
    try {
      await deleteAgentCall(accessToken, agentToDelete.id);
      NotificationsManager.success(`Agent "${agentToDelete.name}" deleted successfully`);
      fetchAgents();
    } catch (error) {
      console.error("Error deleting agent:", error);
      NotificationsManager.fromBackend("Failed to delete agent");
    } finally {
      setIsDeleting(false);
      setAgentToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setAgentToDelete(null);
  };

  const sortedAgents = [...agentsList].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  });

  const columnCount = isAdmin ? 7 : 6;

  return (
    <div className="w-full mx-auto flex-auto overflow-y-auto m-8 p-2">
      <div className="flex flex-col gap-2 mb-4">
        <h1 className="text-2xl font-bold">Agentes</h1>
        <p className="text-sm text-gray-600">
          Lista de agentes especificados A2A disponíveis para uso em sua organização. Vá para o AI Hub para tornar os agentes
          públicos.
        </p>
        <Alert
          message="Por que os agentes precisam de chaves?"
          description="Chaves controlam o acesso a um agente e permitem que ele chame ferramentas MCP. Atribua uma chave ao criar um agente ou na página de Chaves Virtuais."
          type="info"
          showIcon
          className="mb-3"
        />
        <div className="mt-2 flex items-center gap-4">
          {isAdmin && (
            <Button onClick={handleAddAgent} disabled={!accessToken}>
              + Adicionar Novo Agente
            </Button>
          )}
          <Tooltip title="Quando ativado, apenas agentes com URLs acessíveis são mostrados">
            <div className="flex items-center gap-2">
              <CheckCircleOutlined className={healthCheckEnabled ? "text-green-500" : "text-gray-400"} />
              <span className="text-sm text-gray-600">Verificação de Saúde</span>
              <Switch
                size="small"
                checked={healthCheckEnabled}
                onChange={handleHealthCheckToggle}
                loading={isLoading && healthCheckEnabled}
              />
            </div>
          </Tooltip>
        </div>
      </div>

      {selectedAgentId ? (
        <AgentInfoView
          agentId={selectedAgentId}
          onClose={() => setSelectedAgentId(null)}
          accessToken={accessToken}
          isAdmin={isAdmin}
        />
      ) : (
        <Card>
          {isLoading ? (
            <Skeleton active paragraph={{ rows: 3 }} />
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Nome do Agente</TableHeaderCell>
                  <TableHeaderCell>ID do Agente</TableHeaderCell>
                  <TableHeaderCell>Gastos (USD)</TableHeaderCell>
                  <TableHeaderCell>Modelo</TableHeaderCell>
                  <TableHeaderCell>Criado</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  {isAdmin && <TableHeaderCell>Ações</TableHeaderCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedAgents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columnCount}>
                      <Text className="text-center">
                        Nenhum agente encontrado. Clique em &quot;+ Adicionar Novo Agente&quot; para criar um.
                      </Text>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedAgents.map((agent) => (
                    <TableRow key={agent.agent_id}>
                      <TableCell>
                        <Text>{agent.agent_name}</Text>
                      </TableCell>
                      <TableCell>
                        <IdCell value={agent.agent_id} onClick={(id) => setSelectedAgentId(id)} />
                      </TableCell>
                      <TableCell>
                        <MoneyCell value={agent.spend} decimals={4} />
                      </TableCell>
                      <TableCell>
                        <Badge size="xs" color="blue">
                          {agent.litellm_params?.model || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DateCell value={agent.created_at} precision="date" />
                      </TableCell>
                      <TableCell>
                        {(agent.keys?.length ?? 0) > 0 ? (
                          <StatusBadge tone="success" label="Ativo" />
                        ) : (
                          <StatusBadge tone="warning" label="Precisa de Configuração" />
                        )}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <TableIconActionButton
                            variant="Delete"
                            onClick={() => handleDeleteClick(agent.agent_id, agent.agent_name)}
                          />
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      <AddAgentForm
        visible={isAddModalVisible}
        onClose={handleCloseModal}
        accessToken={accessToken}
        onSuccess={handleSuccess}
        teams={teams}
      />

      {agentToDelete && (
        <Modal
          title="Excluir Agente"
          open={agentToDelete !== null}
          onOk={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          confirmLoading={isDeleting}
          okText="Excluir"
          okButtonProps={{ danger: true }}
        >
          <p>Tem certeza que deseja excluir o agente: {agentToDelete.name}?</p>
          <p>Esta ação não pode ser desfeita.</p>
        </Modal>
      )}
    </div>
  );
};

export default AgentsPanel;
