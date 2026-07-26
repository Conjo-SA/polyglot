"use client";

import React, { useEffect, useState } from "react";
import { Form, Input, Modal, Typography } from "antd";
import type { MemoryRow } from "@/components/networking";

const { Text } = Typography;

interface MemoryEditModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialRow?: MemoryRow;
  onClose: () => void;
  onSave: (key: string, value: string, metadataText: string, isCreate: boolean) => Promise<boolean>;
}

export const MemoryEditModal: React.FC<MemoryEditModalProps> = ({ open, mode, initialRow, onClose, onSave }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initialRow) {
      form.setFieldsValue({
        key: initialRow.key,
        value: initialRow.value,
        metadata: initialRow.metadata != null ? JSON.stringify(initialRow.metadata, null, 2) : "",
      });
    } else {
      form.resetFields();
    }
  }, [open, mode, initialRow, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    const ok = await onSave(values.key.trim(), values.value ?? "", values.metadata ?? "", mode === "create");
    setSubmitting(false);
    if (ok) {
      form.resetFields();
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      title={mode === "create" ? "Criar memória" : `Editar ${initialRow?.key ?? ""}`}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      onOk={handleOk}
      okText={mode === "create" ? "Criar" : "Salvar"}
      confirmLoading={submitting}
      width={640}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Chave"
          name="key"
          rules={[{ required: true, message: "A chave é obrigatória" }]}
          tooltip="Globalmente única — duas memórias não podem compartilhar uma chave. Nomesie suas próprias chaves se precisar de isolamento por usuário (ex. user:123:notes)."
        >
          <Input placeholder="ex. user_role" disabled={mode === "edit"} />
        </Form.Item>
        <Form.Item
          label="Valor"
          name="value"
          rules={[{ required: true, message: "O valor é obrigatório" }]}
          tooltip="Markdown/text injetado no contexto do LLM. Strings simples são aceitas."
        >
          <Input.TextArea rows={8} placeholder="O que o agente deve lembrar…" />
        </Form.Item>
        <Form.Item
          label={
            <span>
              Metadados <Text type="secondary">(JSON opcional)</Text>
            </span>
          }
          name="metadata"
          tooltip="Metadados estruturados opcionais — deve ser um JSON válido se fornecido."
        >
          <Input.TextArea
            rows={4}
            placeholder='{"tags": ["exemplo"]}'
            style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default MemoryEditModal;
