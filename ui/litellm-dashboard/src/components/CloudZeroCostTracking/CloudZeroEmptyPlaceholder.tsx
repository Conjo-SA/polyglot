import { Empty, Typography, Button } from "antd";

const { Title, Paragraph } = Typography;

interface CloudZeroEmptyPlaceholderProps {
  startCreation: () => void;
}

export default function CloudZeroEmptyPlaceholder({ startCreation }: CloudZeroEmptyPlaceholderProps) {
  return (
    <div className="bg-white p-12 rounded-lg border border-dashed border-gray-300 text-center max-w-2xl mx-auto mt-8">
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <div className="space-y-2">
            <Title level={4}>Nenhuma Integração com CloudZero Encontrada</Title>
            <Paragraph type="secondary" className="max-w-md mx-auto">
              Conecte sua conta do CloudZero para começar a rastrear e analisar seus custos na nuvem diretamente do Polyglot.
            </Paragraph>
          </div>
        }
      >
        <Button type="primary" size="large" onClick={startCreation} className="flex items-center gap-2 mx-auto mt-4">
          Adicionar Integração com CloudZero
        </Button>
      </Empty>
    </div>
  );
}
