import React from "react";
import { RobotOutlined } from "@ant-design/icons";

interface EmptyStateProps {
  hasVariables: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({ hasVariables }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center text-gray-400">
      <RobotOutlined style={{ fontSize: "48px", marginBottom: "16px" }} />
      <span className="text-base">
        {hasVariables
          ? "Preencha as variáveis acima e digite uma mensagem para começar a testar"
          : "Digite uma mensagem abaixo para começar a testar seu prompt"}
      </span>
    </div>
  );
};

export default EmptyState;
