import { InfoCircleOutlined } from "@ant-design/icons";
import { Select as AntdSelect, Tooltip, Typography } from "antd";
import React from "react";

const { Text } = Typography;

export const DEFAULT_ESCALATION_KEYWORDS = ["LITELLM ESCALATE"];

interface EscalationKeywordsProps {
  keywords: string[];
  onChange: (keywords: string[]) => void;
}

const EscalationKeywords: React.FC<EscalationKeywordsProps> = ({ keywords, onChange }) => {
  return (
    <div className="w-full max-w-none">
      <div className="flex items-center gap-2 mb-1">
        <Typography.Title level={4} style={{ margin: 0 }}>
          Palavras-chave de Escalação
        </Typography.Title>
        <Tooltip title="Frases sensíveis a maiúsculas e minúsculas que um usuário pode incluir em sua mensagem para forçar um aumento para o próximo nível de complexidade quando não estiver satisfeito com os resultados. Eles podem forçar um modelo mais forte, mas não escolher qual um.">
          <InfoCircleOutlined className="text-gray-400" />
        </Tooltip>
      </div>
      <Text type="secondary" style={{ display: "block", marginBottom: 8, fontSize: 12 }}>
        Opcional: quando uma mensagem do usuário contém uma destas frases, a solicitação é elevada para um nível superior ao que ela normalmente seria roteada. A correspondência diferencia maiúsculas e minúsculas, então &quot;LITELLM ESCALATE&quot; só se activa com a forma exata gritada. Deixe vazio para desativar.
      </Text>
      <AntdSelect
        mode="tags"
        value={keywords}
        onChange={onChange}
        placeholder="ex., LITELLM ESCALATE"
        tokenSeparators={[","]}
        open={false}
        suffixIcon={null}
        style={{ width: "100%" }}
        allowClear
      />
    </div>
  );
};

export default EscalationKeywords;
