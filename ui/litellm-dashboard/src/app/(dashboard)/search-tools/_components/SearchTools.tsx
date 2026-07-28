import { isAdminRole } from "@/utils/roles";
import { useQuery } from "@tanstack/react-query";
import { Button, Text, Title } from "@tremor/react";
import { Form, Input, Modal, Select } from "antd";
import React, { useState } from "react";
import DeleteResourceModal from "@/components/common_components/DeleteResourceModal";
import NotificationsManager from "@/components/molecules/notifications_manager";
import {
  deleteSearchTool,
  fetchAvailableSearchProviders,
  fetchSearchTools,
  updateSearchTool,
} from "@/components/networking";
import CreateSearchTool from "./CreateSearchTools";
import SearchToolTable from "./SearchToolTable";
import { SearchToolView } from "./SearchToolView";
import { AvailableSearchProvider, SearchTool } from "./types";

interface SearchToolsProps {
  accessToken: string | null;
  userRole: string | null;
  userID: string | null;
}

const SearchTools: React.FC<SearchToolsProps> = ({ accessToken, userRole, userID }) => {
  const {
    data: searchTools,
    isLoading: isLoadingTools,
    refetch,
  } = useQuery({
    queryKey: ["searchTools"],
    queryFn: () => {
      if (!accessToken) throw new Error("Access Token required");
      return fetchSearchTools(accessToken).then((res) => res.search_tools || []);
    },
    enabled: !!accessToken,
  }) as { data: SearchTool[]; isLoading: boolean; refetch: () => void };

  const { data: providersResponse, isLoading: isLoadingProviders } = useQuery({
    queryKey: ["searchProviders"],
    queryFn: () => {
      if (!accessToken) throw new Error("Access Token required");
      return fetchAvailableSearchProviders(accessToken);
    },
    enabled: !!accessToken,
  }) as { data: { providers: AvailableSearchProvider[] }; isLoading: boolean };

  const availableProviders = providersResponse?.providers || [];

  // State
  const [toolIdToDelete, setToolToDelete] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [editTool, setEditTool] = useState(false);
  const [isCreateModalVisible, setCreateModalVisible] = useState(false);
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [form] = Form.useForm();

  const handleView = (toolId: string) => {
    setSelectedToolId(toolId);
    setEditTool(false);
  };

  const handleEditOpen = (toolId: string) => {
    const tool = searchTools?.find((t) => t.search_tool_id === toolId);
    if (!tool) {
      return;
    }
    const editFormValues = {
      search_tool_name: tool.search_tool_name,
      search_provider: tool.litellm_params.search_provider,
      api_key: tool.litellm_params.api_key,
      api_base: tool.litellm_params.api_base,
      timeout: tool.litellm_params.timeout,
      max_retries: tool.litellm_params.max_retries,
      description: tool.search_tool_info?.description,
    };
    form.setFieldsValue(editFormValues);
    setSelectedToolId(toolId);
    setEditModalVisible(true);
  };

  function handleDelete(toolId: string) {
    setToolToDelete(toolId);
    setIsDeleteModalOpen(true);
  }

  const confirmDelete = async () => {
    if (toolIdToDelete == null || accessToken == null) {
      return;
    }
    setIsDeleting(true);
    try {
      await deleteSearchTool(accessToken, toolIdToDelete);
      NotificationsManager.success("Deleted search tool successfully");
      setIsDeleteModalOpen(false);
      setToolToDelete(null);
      refetch();
    } catch (error) {
      console.error("Error deleting the search tool:", error);
      NotificationsManager.error("Falha ao excluir a ferramenta de busca");
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setToolToDelete(null);
  };

  const toolToDelete = searchTools?.find((t) => t.search_tool_id === toolIdToDelete);
  const providerInfo = toolToDelete
    ? availableProviders.find((p) => p.provider_name === toolToDelete.litellm_params.search_provider)
    : null;

  const handleCreateSuccess = (newSearchTool: SearchTool) => {
    setCreateModalVisible(false);
    refetch();
  };

  const handleEditSubmit = async () => {
    if (!accessToken || !selectedToolId) return;

    try {
      const values = await form.validateFields();
      const searchToolData = {
        search_tool_name: values.search_tool_name,
        litellm_params: {
          search_provider: values.search_provider,
          api_key: values.api_key,
          api_base: values.api_base,
          timeout: values.timeout ? parseFloat(values.timeout) : undefined,
          max_retries: values.max_retries ? parseInt(values.max_retries) : undefined,
        },
        search_tool_info: values.description
          ? {
              description: values.description,
            }
          : undefined,
      };

      await updateSearchTool(accessToken, selectedToolId, searchToolData);
      NotificationsManager.success("Ferramenta de busca atualizada com sucesso");
      setEditModalVisible(false);
      form.resetFields();
      setSelectedToolId(null);
      refetch();
    } catch (error) {
      console.error("Failed to update search tool:", error);
      NotificationsManager.error("Failed to update search tool");
    }
  };

  const renderEditForm = () => (
    <Form form={form} layout="vertical">
      <Form.Item
        name="search_tool_name"
        label="Search Tool Name"
        rules={[{ required: true, message: "Please enter a search tool name" }]}
      >
        <Input placeholder="e.g., my-perplexity-search" />
      </Form.Item>

      <Form.Item
        name="search_provider"
        label="Search Provider"
        rules={[{ required: true, message: "Please select a search provider" }]}
      >
        <Select placeholder="Select a search provider" loading={isLoadingProviders}>
          {availableProviders.map((provider) => (
            <Select.Option key={provider.provider_name} value={provider.provider_name}>
              {provider.ui_friendly_name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item name="api_key" label="API Key" extra="API key for the search provider">
        <Input.Password placeholder="Enter API key" />
      </Form.Item>

      <Form.Item name="description" label="Description">
        <Input.TextArea rows={3} placeholder="Description of this search tool" />
      </Form.Item>
    </Form>
  );

  if (!accessToken || !userRole || !userID) {
    return <div className="p-6 text-center text-gray-500">Parâmetros de autenticação obrigatórios ausentes.</div>;
  }

  const ToolsTab = () =>
    selectedToolId ? (
      <SearchToolView
        searchTool={
          searchTools?.find((tool: SearchTool) => tool.search_tool_id === selectedToolId) || {
            search_tool_id: "",
            search_tool_name: "",
            litellm_params: {
              search_provider: "",
            },
          }
        }
        onBack={() => {
          setEditTool(false);
          setSelectedToolId(null);
          refetch();
        }}
        isEditing={editTool}
        accessToken={accessToken}
        availableProviders={availableProviders}
      />
    ) : (
      <div className="w-full h-full">
        <SearchToolTable
          searchTools={searchTools || []}
          isLoading={isLoadingTools}
          availableProviders={availableProviders}
          onView={handleView}
          onEdit={handleEditOpen}
          onDelete={handleDelete}
        />
      </div>
    );

  return (
    <div className="w-full h-full p-6">
      <DeleteResourceModal
        isOpen={isDeleteModalOpen}
        title="Excluir Ferramenta de Busca"
        message="Tem certeza de que deseja excluir esta ferramenta de busca? Esta ação não pode ser desfeita."
        resourceInformationTitle="Informações da Ferramenta de Busca"
        resourceInformation={
          toolToDelete
            ? [
                { label: "Nome", value: toolToDelete.search_tool_name },
                { label: "ID", value: toolToDelete.search_tool_id, code: true },
                {
                  label: "Provedor",
                  value: providerInfo?.ui_friendly_name || toolToDelete.litellm_params.search_provider,
                },
                { label: "Descrição", value: toolToDelete.search_tool_info?.description || "-" },
              ]
            : []
        }
        onCancel={cancelDelete}
        onOk={confirmDelete}
        confirmLoading={isDeleting}
      />

      <CreateSearchTool
        userRole={userRole}
        accessToken={accessToken}
        onCreateSuccess={handleCreateSuccess}
        isModalVisible={isCreateModalVisible}
        setModalVisible={setCreateModalVisible}
      />

      {/* Edit Modal */}
      <Modal
        title="Editar Ferramenta de Busca"
        open={isEditModalVisible}
        onOk={handleEditSubmit}
        onCancel={() => {
          setEditModalVisible(false);
          form.resetFields();
          setSelectedToolId(null);
        }}
        width={600}
      >
        {renderEditForm()}
      </Modal>

      <Title>Ferramentas de Busca</Title>
      <Text className="text-tremor-content mt-2">Configure e gerencie seus provedores de busca</Text>
      {isAdminRole(userRole) && (
        <Button className="mt-4 mb-4" onClick={() => setCreateModalVisible(true)}>
          + Adicionar Nova Ferramenta de Busca
        </Button>
      )}

      <ToolsTab />
    </div>
  );
};

export default SearchTools;
