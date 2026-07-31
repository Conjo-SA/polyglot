import React from "react";
import { Title } from "@tremor/react";
import { Descriptions } from "antd";
import { Agent } from "@/components/agents/types";
import { useCurrency } from "@/contexts/CurrencyContext";

interface AgentCostViewProps {
  agent: Agent;
}

const AgentCostView: React.FC<AgentCostViewProps> = ({ agent }) => {
  const params = agent.litellm_params;

  if (
    params?.cost_per_query === undefined &&
    params?.input_cost_per_token === undefined &&
    params?.output_cost_per_token === undefined
  ) {
    return null;
  }

  return (
    <div style={{ marginTop: 24 }}>
      <Title>Cost Configuration</Title>
      <Descriptions bordered column={1} style={{ marginTop: 16 }}>
        {params.cost_per_query !== undefined && (
          <Descriptions.Item label="Cost Per Query">{(() => {
            const { symbol, rate } = useCurrency();
            return `${symbol}${(params.cost_per_query * rate).toFixed(4)}`;
          })()}</Descriptions.Item>
        )}
        {params.input_cost_per_token !== undefined && (
          <Descriptions.Item label="Input Cost Per Token">{(() => {
            const { symbol, rate } = useCurrency();
            return `${symbol}${(params.input_cost_per_token * rate).toFixed(8)}`;
          })()}</Descriptions.Item>
        )}
        {params.output_cost_per_token !== undefined && (
          <Descriptions.Item label="Output Cost Per Token">{(() => {
            const { symbol, rate } = useCurrency();
            return `${symbol}${(params.output_cost_per_token * rate).toFixed(8)}`;
          })()}</Descriptions.Item>
        )}
      </Descriptions>
    </div>
  );
};

export default AgentCostView;
