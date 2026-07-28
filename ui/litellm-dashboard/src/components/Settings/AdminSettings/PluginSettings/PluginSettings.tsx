"use client";

import { useState, useEffect } from "react";
import { Button, Card, Form, Input, Modal, Space, Table, Typography } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { getConfigFieldSetting, updateConfigFieldSetting } from "@/components/networking";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";

const { Title, Text, Paragraph } = Typography;

interface Plugin {
  name: string;
  display_name: string;
  url: string;
  plugin_key?: string;
}

export default function PluginSettings() {
  const { accessToken } = useAuthorized();
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [form] = Form.useForm<Plugin>();

  useEffect(() => {
    if (!accessToken) return;
    getConfigFieldSetting(accessToken, "plugins")
      .then((data) => {
        const val = data?.field_value;
        setPlugins(Array.isArray(val) ? val : []);
      })
      .catch(() => setPlugins([]))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const save = async (updated: Plugin[]) => {
    if (!accessToken) return;
    setSaving(true);
    try {
      await updateConfigFieldSetting(accessToken, "plugins", updated);
      setPlugins(updated);
    } finally {
      setSaving(false);
    }
  };

  const openAdd = () => {
    setEditingIndex(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (idx: number) => {
    setEditingIndex(idx);
    // plugin_key arrives redacted ("***"); start it blank so an untouched save
    // keeps the stored credential instead of overwriting it with the placeholder.
    form.setFieldsValue({ ...plugins[idx], plugin_key: "" });
    setModalOpen(true);
  };

  const handleDelete = (idx: number) => {
    const updated = plugins.filter((_, i) => i !== idx);
    save(updated);
  };

  const handleOk = async () => {
    const values = await form.validateFields();
    const updated =
      editingIndex !== null ? plugins.map((p, i) => (i === editingIndex ? values : p)) : [...plugins, values];
    await save(updated);
    setModalOpen(false);
  };

  const columns = [
    {
      title: "Nome",
      dataIndex: "name",
      key: "name",
      render: (v: string) => <Text code>{v}</Text>,
    },
    { title: "Nome de Exibição", dataIndex: "display_name", key: "display_name" },
    {
      title: "URL",
      dataIndex: "url",
      key: "url",
      render: (v: string) => (
        <a href={v} target="_blank" rel="noopener noreferrer">
          {v}
        </a>
      ),
    },
    {
      title: "Chave do Plugin",
      dataIndex: "plugin_key",
      key: "plugin_key",
      render: (v?: string) => (v ? <Text code>{"•".repeat(8)}</Text> : <Text type="secondary">—</Text>),
    },
    {
      title: "Ações",
      key: "actions",
      render: (_: unknown, __: Plugin, idx: number) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(idx)} />
          <Button icon={<DeleteOutlined />} size="small" danger onClick={() => handleDelete(idx)} />
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Title level={4}>Plugins</Title>
      <Paragraph>
        Registre serviços externos como plugins. Após adicionar, os usuários podem alternar para o plugin no seletor de modo
        no canto superior esquerdo da barra lateral.
      </Paragraph>
      <Paragraph type="secondary" style={{ fontSize: 12 }}>
        Cada plugin deve expor <Text code>GET /api/plugin-manifest</Text> retornando itens de navegação e capacidades.
      </Paragraph>

      <Button type="primary" icon={<PlusOutlined />} onClick={openAdd} style={{ marginBottom: 16 }}>
        Adicionar Plugin
      </Button>

      <Table dataSource={plugins} columns={columns} rowKey="name" loading={loading} pagination={false} size="small" />

      <Modal
        title={editingIndex !== null ? "Editar Plugin" : "Adicionar Plugin"}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
        confirmLoading={saving}
        okText="Salvar"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="Nome (identificador)"
            rules={[{ required: true, message: "Obrigatório" }]}
            extra="Usado em URLs e configurações. Sem espaços. Ex.: litellm-platform-plugin"
          >
            <Input placeholder="litellm-platform-plugin" />
          </Form.Item>
          <Form.Item name="display_name" label="Nome de Exibição" rules={[{ required: true, message: "Obrigatório" }]}>
            <Input placeholder="Plataforma LiteLLM" />
          </Form.Item>
          <Form.Item
            name="url"
            label="URL"
            rules={[
              { required: true, message: "Obrigatório" },
              { type: "url", message: "Deve ser uma URL válida" },
            ]}
            extra="URL base do serviço do plugin"
          >
            <Input placeholder="https://seu-plugin.exemplo.com" />
          </Form.Item>
          <Form.Item
            name="plugin_key"
            label="Chave do Plugin"
            extra="Opcional. A credencial própria do plugin, injetada como Authorization: Bearer <key> apenas quando o litellm faz proxy reverso das chamadas de API para o backend do plugin (/plugin-proxy/<nome>/*). Deixe em branco para plugins que usam o token do usuário encaminhado pelo litellm (por exemplo, plugins iframe) — este caminho usa o token do usuário, não esta chave."
          >
            <Input.Password
              placeholder={editingIndex !== null ? "Deixe em branco para manter a chave atual" : "sk-... (opcional)"}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
