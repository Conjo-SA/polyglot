import { Card, InputNumber, Radio, Slider, Space, Switch, Typography } from "antd";
import React from "react";
import {
  AdaptiveEligible,
  ComplexityRouterConfigValue,
  DEFAULT_ADAPTIVE_WEIGHTS,
  DEFAULT_TIER_DISTANCE_PENALTY,
} from "./ComplexityRouterConfig";

const { Text } = Typography;

interface AdaptiveRoutingConfigProps {
  value: ComplexityRouterConfigValue;
  onChange: (value: ComplexityRouterConfigValue) => void;
}

const AdaptiveRoutingConfig: React.FC<AdaptiveRoutingConfigProps> = ({ value, onChange }) => {
  const adaptiveWeights = value.adaptive_weights ?? DEFAULT_ADAPTIVE_WEIGHTS;
  const adaptiveEligible = value.adaptive_eligible ?? "all";
  const tierDistancePenalty = value.tier_distance_penalty ?? DEFAULT_TIER_DISTANCE_PENALTY;

  const handleAdaptiveToggle = (adaptive: boolean) => {
    const nextValue: ComplexityRouterConfigValue = {
      ...value,
      adaptive,
      adaptive_weights: adaptiveWeights,
      adaptive_eligible: adaptiveEligible,
      tier_distance_penalty: tierDistancePenalty,
    };
    onChange(nextValue);
  };

  const handleQualityWeightChange = (qualityPercent: number) => {
    const quality = qualityPercent / 100;
    onChange({ ...value, adaptive_weights: { quality, cost: Math.round((1 - quality) * 100) / 100 } });
  };

  const handleAdaptiveEligibleChange = (eligible: AdaptiveEligible) => {
    onChange({ ...value, adaptive_eligible: eligible });
  };

  const handleTierDistancePenaltyChange = (penalty: number | null) => {
    onChange({ ...value, tier_distance_penalty: penalty ?? DEFAULT_TIER_DISTANCE_PENALTY });
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <Switch checked={value.adaptive ?? false} onChange={handleAdaptiveToggle} />
        <Text strong>Habilitar seleção adaptativa por bandit</Text>
      </div>
      <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
        Quando desativado, cada requisição sempre usa o modelo atribuído ao seu tier classificado.
      </Text>

      <Card className="bg-gray-50 mt-4">
        <Text strong style={{ display: "block", marginBottom: 8 }}>
          Como Funciona o Roteamento Adaptativo
        </Text>
        <Text type="secondary" style={{ fontSize: 13 }}>
          Ele aprende com o funcionamento real de cada conversa: se o usuário precisa reformular ou corrigir o modelo, se
          ele fica preso repetindo-se, se esgota as chamadas de ferramentas, se o usuário parece satisfeito. Combinado com
          o custo, este feedback em tempo real desloca o roteamento futuro para os modelos que realmente funcionam bem, e melhora
          conforme mais conversas forem recebidas. Até que haja feedback suficiente, ele retorna ao modelo do tier classificado.
        </Text>
      </Card>

      {value.adaptive && (
        <div className="mt-4 space-y-4">
          <div>
            <Text strong style={{ display: "block", marginBottom: 4 }}>
              Qualidade vs. Custo ({Math.round(adaptiveWeights.quality * 100)}% qualidade /{" "}
              {Math.round(adaptiveWeights.cost * 100)}% custo)
            </Text>
            <Slider
              min={0}
              max={100}
              value={Math.round(adaptiveWeights.quality * 100)}
              onChange={handleQualityWeightChange}
              tooltip={{ formatter: (v) => `${v}% qualidade / ${100 - (v ?? 0)}% custo` }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Peso de qualidade mais alto favorece modelos mais capazes (mais caros); peso de custo mais alto favorece modelos mais baratos quando
              o bandit tem feedback para agir. Recomendado: divisão de 30% qualidade / 70% custo.
            </Text>
          </div>

          <div>
            <Text strong style={{ display: "block", marginBottom: 4 }}>
              Conjunto de Modelos Eligíveis
            </Text>
            <Radio.Group
              value={adaptiveEligible}
              onChange={(e) => handleAdaptiveEligibleChange(e.target.value)}
              className="w-full"
            >
              <Space direction="vertical" className="w-full">
                <Radio value="all">
                  <Text strong>Todos os tiers (limite suave)</Text>{" "}
                  <Text type="secondary">— roteador pode selecionar entre tiers, dependendo da melhor adequação ao prompt</Text>
                </Radio>
                <Radio value="classified_tier">
                  <Text strong>Apenas tier classificado</Text>{" "}
                  <Text type="secondary">— roteador só pode selecionar modelos dentro do tier</Text>
                </Radio>
              </Space>
            </Radio.Group>
          </div>

          {adaptiveEligible === "all" && (
            <div>
              <Text strong style={{ display: "block", marginBottom: 4 }}>
                Penalidade por Distância entre Tiers
              </Text>
              <InputNumber
                value={tierDistancePenalty}
                onChange={handleTierDistancePenaltyChange}
                min={0}
                step={0.1}
                style={{ width: "100%" }}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Penalidade de pontuação aplicada por passo de tier afastado do tier classificado.
              </Text>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default AdaptiveRoutingConfig;
