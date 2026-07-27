import React from "react";
import { Button as TremorButton, Text } from "@tremor/react";
import { Input, Modal } from "antd";

interface PublishModalProps {
  visible: boolean;
  promptName: string;
  isSaving: boolean;
  onNameChange: (name: string) => void;
  onPublish: () => void;
  onCancel: () => void;
}

const PublishModal: React.FC<PublishModalProps> = ({
  visible,
  promptName,
  isSaving,
  onNameChange,
  onPublish,
  onCancel,
}) => {
  return (
    <Modal
      title="Publicar Prompt"
      open={visible}
      onCancel={onCancel}
      footer={[
        <div key="footer" className="flex justify-end gap-2">
          <TremorButton variant="secondary" onClick={onCancel}>
            Cancelar
          </TremorButton>
          <TremorButton onClick={onPublish} loading={isSaving}>
            Publicar
          </TremorButton>
        </div>,
      ]}
    >
      <div className="py-4">
        <Text className="mb-2">Nome</Text>
        <Input
          value={promptName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Digite o nome do prompt"
          onPressEnter={onPublish}
          autoFocus
        />
        <Text className="text-gray-500 text-xs mt-2">
          Prompts publicados podem ser usados em chamadas de API e são versionados para fácil rastreamento.
        </Text>
      </div>
    </Modal>
  );
};

export default PublishModal;
