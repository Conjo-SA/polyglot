import React from "react";
import { Card, Text } from "@tremor/react";
import VariableTextArea from "../variable_textarea";

interface DeveloperMessageCardProps {
  value: string;
  onChange: (value: string) => void;
}

const DeveloperMessageCard: React.FC<DeveloperMessageCardProps> = ({ value, onChange }) => {
  return (
    <Card className="p-3">
      <Text className="block mb-2 text-sm font-medium">Mensagem do desenvolvedor</Text>
      <Text className="text-gray-500 text-xs mb-2">Instruções opcionais do sistema para o modelo</Text>
      <VariableTextArea value={value} onChange={onChange} rows={3} placeholder="ex: Você é um assistente útil..." />
    </Card>
  );
};

export default DeveloperMessageCard;
