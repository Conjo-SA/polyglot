import { Empty, Typography, Button } from "antd";

const { Title, Paragraph } = Typography;

interface SSOSettingsEmptyPlaceholderProps {
  onAdd: () => void;
}

export default function SSOSettingsEmptyPlaceholder({ onAdd }: SSOSettingsEmptyPlaceholderProps) {
  return (
    <div className="bg-white p-12 rounded-lg border border-dashed border-gray-300 text-center w-full">
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <div className="space-y-2">
            <Title level={4}>Nenhuma Configuração de SSO Encontrada</Title>
            <Paragraph type="secondary" className="max-w-md mx-auto">
              Configure o Single Sign-On (SSO) para habilitar autenticação fluida para seus membros da equipe usando seu provedor de identidade.
            </Paragraph>
          </div>
        }
      >
        <Button type="primary" size="large" onClick={onAdd} className="flex items-center gap-2 mx-auto mt-4">
          Configurar SSO
        </Button>
      </Empty>
    </div>
  );
}
