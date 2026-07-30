import { InfoCircleOutlined } from "@ant-design/icons";
import { Select as AntdSelect, Card, Collapse, Divider, Space, Switch, Tooltip, Typography } from "antd";
import React from "react";
import { ModelGroup } from "@/components/llm_calls/fetch_models";
import AdaptiveRoutingConfig from "./AdaptiveRoutingConfig";
import ClassificationMethodConfig from "./ClassificationMethodConfig";
import EscalationKeywords from "./EscalationKeywords";
import KeywordTierRules, { KeywordTierRule } from "./KeywordTierRules";
import SemanticKeywordMatching from "./SemanticKeywordMatching";

const { Text } = Typography;

export const DEFAULT_CLASSIFIER_TIMEOUT_MS = 3000;
export const DEFAULT_TIER_DISTANCE_PENALTY = 0.5;

export interface ComplexityTiers {
  SIMPLE: string[];
  MEDIUM: string[];
  COMPLEX: string[];
  REASONING: string[];
}

export interface ClassifierLLMConfig {
  model: string;
  timeout_ms: number;
}

export type ClassifierType = "heuristic" | "llm";

export interface AdaptiveRouterWeights {
  quality: number;
  cost: number;
}

export const DEFAULT_ADAPTIVE_WEIGHTS: AdaptiveRouterWeights = { quality: 0.3, cost: 0.7 };

export type AdaptiveEligible = "all" | "classified_tier";

export interface ComplexityRouterConfigValue {
  tiers: ComplexityTiers;
  classifier_type: ClassifierType;
  classifier_llm_config?: ClassifierLLMConfig;
  adaptive?: boolean;
  adaptive_weights?: AdaptiveRouterWeights;
  tier_distance_penalty?: number;
  adaptive_eligible?: AdaptiveEligible;
  return_raw_model_name?: boolean;
}

interface ComplexityRouterConfigProps {
  modelInfo: ModelGroup[];
  value: ComplexityRouterConfigValue;
  onChange: (value: ComplexityRouterConfigValue) => void;
  customTechnicalKeywords?: string[];
  onCustomTechnicalKeywordsChange?: (keywords: string[]) => void;
  // Optional: the edit-auto-router modal doesn't yet support editing keyword tier
  // rules or semantic matching, so it renders this component without them.
  keywordTierRules?: KeywordTierRule[];
  onKeywordTierRulesChange?: (rules: KeywordTierRule[]) => void;
  semanticMatchingEnabled?: boolean;
  onSemanticMatchingEnabledChange?: (enabled: boolean) => void;
  embeddingModel?: string;
  onEmbeddingModelChange?: (model: string) => void;
  matchThreshold?: number;
  onMatchThresholdChange?: (threshold: number) => void;
  escalationKeywords?: string[];
  onEscalationKeywordsChange?: (keywords: string[]) => void;
  showValidationErrors?: boolean;
}

const TIER_DESCRIPTIONS: Record<keyof ComplexityTiers, { label: string; description: string; examples: string }> = {
  SIMPLE: {
    label: "Simples",
    description: "Perguntas básicas, saudações, consultas factuais simples",
    examples: '"Olá!", "O que é Python?", "Obrigado!"',
  },
  MEDIUM: {
    label: "Médio",
    description: "Consultas padrão que requerem algum raciocínio ou explicação",
    examples: '"Explique como funcionam as APIs REST", "Depure este erro"',
  },
  COMPLEX: {
    label: "Complexo",
    description: "Consultas técnicas, de múltiplas partes que requerem conhecimento profundo",
    examples: '"Projete uma arquitetura de microserviços", "Implemente um limitador de taxa"',
  },
  REASONING: {
    label: "Raciocínio",
    description: "Raciocínio encadeado, análise, pedidos de raciocínio explícito",
    examples: '"Pense passo a passo...", "Analise os prós e contras..."',
  },
};

const ComplexityRouterConfig: React.FC<ComplexityRouterConfigProps> = ({
  modelInfo,
  value,
  onChange,
  customTechnicalKeywords,
  onCustomTechnicalKeywordsChange,
  keywordTierRules = [],
  onKeywordTierRulesChange,
  semanticMatchingEnabled = false,
  onSemanticMatchingEnabledChange,
  embeddingModel,
  onEmbeddingModelChange = () => {},
  matchThreshold = 0.5,
  onMatchThresholdChange = () => {},
  escalationKeywords = [],
  onEscalationKeywordsChange,
  showValidationErrors = false,
}) => {
  // Embedding models can't serve a chat-completion role, so they're excluded here.
  const modelOptions = modelInfo
    .filter((model) => model.mode !== "embedding")
    .map((model) => ({
      value: model.model_group,
      label: model.model_group,
    }));

  const handleTierChange = (tier: keyof ComplexityTiers, models: string[]) => {
    onChange({
      ...value,
      tiers: { ...value.tiers, [tier]: models },
    });
  };

  return (
    <div className="w-full max-w-none">
      <Space align="center" style={{ marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Configuração de Níveis de Complexidade
        </Typography.Title>
        <Tooltip title="Mapeie cada nível de complexidade para um ou mais modelos. Consultas simples utilizam modelos mais baratos/rapidos, consultas complexas utilizam modelos mais capazes.">
          <InfoCircleOutlined className="text-gray-400" />
        </Tooltip>
      </Space>

      <Text type="secondary" style={{ display: "block", marginBottom: 24 }}>
        O roteador de complexidade classifica automaticamente as requisições por complexidade usando pontuação baseada em regras (sem chamadas à API,
        latência &lt;1ms). Configure qual(is) modelo(s) irá(ão) lidar com cada nível.
      </Text>

      <Card>
        {(Object.keys(TIER_DESCRIPTIONS) as Array<keyof ComplexityTiers>).map((tier, index) => {
          const tierInfo = TIER_DESCRIPTIONS[tier];
          const tierMissing = showValidationErrors && value.tiers[tier].length === 0;
          return (
            <div key={tier}>
              {index > 0 && <Divider style={{ margin: "16px 0" }} />}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Text strong style={{ fontSize: 16 }}>
                    Nível {tierInfo.label}
                  </Text>
                  <Tooltip title={tierInfo.description}>
                    <InfoCircleOutlined className="text-gray-400" />
                  </Tooltip>
                </div>
                <Text type="secondary" style={{ display: "block", marginBottom: 8, fontSize: 12 }}>
                  Exemplos: {tierInfo.examples}
                </Text>
                <AntdSelect
                  mode="multiple"
                  value={value.tiers[tier]}
                  onChange={(models) => handleTierChange(tier, models)}
                  placeholder={`Selecionar modelo(s) para consultas ${tierInfo.label.toLowerCase()}`}
                  showSearch
                  style={{ width: "100%" }}
                  options={modelOptions}
                  status={tierMissing ? "error" : undefined}
                />
                {value.tiers[tier].length > 1 && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Vários modelos selecionados — o roteador seleciona aleatoriamente entre eles por requisição (ou amostras Thompson
                    dentro do grupo quando o roteamento adaptativo está ativado).
                  </Text>
                )}
                {tierMissing && (
                  <Text type="danger" style={{ fontSize: 12 }}>
                    Este nível é obrigatório
                  </Text>
                )}
              </div>
            </div>
          );
        })}
      </Card>

      <Divider />

      <Collapse
        ghost
        style={{ background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb" }}
        items={[
          {
            key: "classifier",
            label: (
              <Text strong style={{ color: "#374151" }}>
                Avançado: Método de Classificação
              </Text>
            ),
            children: (
              <ClassificationMethodConfig
                value={value}
                onChange={onChange}
                modelOptions={modelOptions}
                customTechnicalKeywords={customTechnicalKeywords}
                onCustomTechnicalKeywordsChange={onCustomTechnicalKeywordsChange}
                showValidationErrors={showValidationErrors}
              />
            ),
          },
          {
            key: "adaptive",
            label: (
              <Text strong style={{ color: "#374151" }}>
                Avançado: Roteamento Adaptativo
              </Text>
            ),
            children: <AdaptiveRoutingConfig value={value} onChange={onChange} />,
          },
          {
            key: "response",
            label: (
              <Text strong style={{ color: "#374151" }}>
                Avançado: Formato da Resposta
              </Text>
            ),
            children: (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <Switch
                    checked={value.return_raw_model_name ?? false}
                    onChange={(returnRawModelName) => onChange({ ...value, return_raw_model_name: returnRawModelName })}
                  />
                  <Text strong>Retornar nome do modelo bruto</Text>
                </div>
                <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                  Retorna o nome do modelo subjacente resolvido nas respostas em vez do alias do autorouter.
                </Text>
              </>
            ),
          },
          ...(onEscalationKeywordsChange
            ? [
                {
                  key: "escalation",
                  label: (
                    <Text strong style={{ color: "#374151" }}>
                      Avançado: Palavras-chave de Escalação
                    </Text>
                  ),
                  children: <EscalationKeywords keywords={escalationKeywords} onChange={onEscalationKeywordsChange} />,
                },
              ]
            : []),
          ...(onKeywordTierRulesChange || onSemanticMatchingEnabledChange
            ? [
                {
                  key: "keyword-semantic",
                  label: (
                    <Text strong style={{ color: "#374151" }}>
                      Avançado: Correspondência de Palavras-Chave/Semântica
                    </Text>
                  ),
                  children: (
                    <>
                      {onKeywordTierRulesChange && (
                        <KeywordTierRules rules={keywordTierRules} onChange={onKeywordTierRulesChange} />
                      )}
                      {onKeywordTierRulesChange && onSemanticMatchingEnabledChange && (
                        <Divider style={{ margin: "16px 0" }} />
                      )}
                      {onSemanticMatchingEnabledChange && (
                        <SemanticKeywordMatching
                          enabled={semanticMatchingEnabled}
                          onEnabledChange={onSemanticMatchingEnabledChange}
                          embeddingModel={embeddingModel}
                          onEmbeddingModelChange={onEmbeddingModelChange}
                          matchThreshold={matchThreshold}
                          onMatchThresholdChange={onMatchThresholdChange}
                          modelInfo={modelInfo}
                          showValidationErrors={showValidationErrors}
                        />
                      )}
                    </>
                  ),
                },
              ]
            : []),
        ]}
      />
    </div>
  );
};

export default ComplexityRouterConfig;
