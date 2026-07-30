import { InfoCircleOutlined } from "@ant-design/icons";
import { Select as AntdSelect, Card, InputNumber, Radio, Space, Tooltip, Typography } from "antd";
import React from "react";
import { ClassifierType, ComplexityRouterConfigValue, DEFAULT_CLASSIFIER_TIMEOUT_MS } from "./ComplexityRouterConfig";

const { Text } = Typography;

interface ClassificationMethodConfigProps {
  value: ComplexityRouterConfigValue;
  onChange: (value: ComplexityRouterConfigValue) => void;
  modelOptions: { value: string; label: string }[];
  customTechnicalKeywords?: string[];
  onCustomTechnicalKeywordsChange?: (keywords: string[]) => void;
  showValidationErrors?: boolean;
}

const ClassificationMethodConfig: React.FC<ClassificationMethodConfigProps> = ({
  value,
  onChange,
  modelOptions,
  customTechnicalKeywords,
  onCustomTechnicalKeywordsChange,
  showValidationErrors = false,
}) => {
  const classifierModelMissing =
    showValidationErrors && value.classifier_type === "llm" && !value.classifier_llm_config?.model;

  const handleClassifierTypeChange = (classifierType: ClassifierType) => {
    onChange({
      ...value,
      classifier_type: classifierType,
      classifier_llm_config:
        classifierType === "llm"
          ? value.classifier_llm_config ?? { model: "", timeout_ms: DEFAULT_CLASSIFIER_TIMEOUT_MS }
          : undefined,
    });
  };

  const handleClassifierModelChange = (model: string) => {
    onChange({
      ...value,
      classifier_llm_config: {
        model,
        timeout_ms: value.classifier_llm_config?.timeout_ms ?? DEFAULT_CLASSIFIER_TIMEOUT_MS,
      },
    });
  };

  const handleClassifierTimeoutChange = (timeoutMs: number | null) => {
    onChange({
      ...value,
      classifier_llm_config: {
        model: value.classifier_llm_config?.model ?? "",
        timeout_ms: timeoutMs ?? DEFAULT_CLASSIFIER_TIMEOUT_MS,
      },
    });
  };

  return (
    <>
      <Radio.Group
        value={value.classifier_type}
        onChange={(e) => handleClassifierTypeChange(e.target.value)}
        className="w-full"
      >
        <Space direction="vertical" className="w-full">
          <Radio value="heuristic">
            <Text strong>Heurística</Text>{" "}
            <Text type="secondary">(padrão) — pontuação baseada em regras, sem chamadas à API, latência &lt;1ms</Text>
          </Radio>
          <Radio value="llm">
            <Text strong>Classificador LLM</Text>{" "}
            <Text type="secondary">— use um modelo para decidir o nível (por exemplo, um modelo pequeno/rápido)</Text>
          </Radio>
        </Space>
      </Radio.Group>

      {value.classifier_type === "llm" && (
        <div className="mt-4 space-y-3">
          <div>
            <Text strong style={{ display: "block", marginBottom: 4 }}>
              Modelo Classificador
            </Text>
            <AntdSelect
              value={value.classifier_llm_config?.model || undefined}
              onChange={handleClassifierModelChange}
              placeholder="Selecione o modelo que classificará a complexidade das requisições"
              showSearch
              style={{ width: "100%" }}
              options={modelOptions}
              status={classifierModelMissing ? "error" : undefined}
            />
            {classifierModelMissing && (
              <Text type="danger" style={{ fontSize: 12 }}>
                Um modelo classificador é obrigatório
              </Text>
            )}
          </div>
          <div>
            <Text strong style={{ display: "block", marginBottom: 4 }}>
              Tempo limite (ms)
            </Text>
            <InputNumber
              value={value.classifier_llm_config?.timeout_ms ?? DEFAULT_CLASSIFIER_TIMEOUT_MS}
              onChange={handleClassifierTimeoutChange}
              min={1}
              style={{ width: "100%" }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Retorna ao avaliador heurístico se a chamada do classificador tiver erros, timeout ou retornar uma
              resposta impossível de analisar.
            </Text>
          </div>
        </div>
      )}

      {value.classifier_type === "heuristic" && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-1">
            <Text strong>Palavras-chave Técnicas Personalizadas</Text>
            <Tooltip title="Domain-specific terms appended to the built-in technical keyword list. Prompts containing these terms score higher on the technical dimension and route to more capable models.">
              <InfoCircleOutlined className="text-gray-400" />
            </Tooltip>
          </div>
          <Text type="secondary" style={{ display: "block", marginBottom: 8, fontSize: 12 }}>
            Opcional: Adicione termos à lista interna para melhorar a precisão da classificação na dimensão técnica.
            (por exemplo, udp, kafka, terraform).
          </Text>
          <AntdSelect
            mode="tags"
            value={customTechnicalKeywords ?? []}
            onChange={(keywords: string[]) => onCustomTechnicalKeywordsChange?.(keywords)}
            placeholder="Digite uma palavra-chave e pressione Enter, ou cole uma lista separada por vírgulas"
            tokenSeparators={[","]}
            open={false}
            suffixIcon={null}
            style={{ width: "100%" }}
            allowClear
          />
        </div>
      )}

      <Card className="bg-gray-50 mt-4">
        <Text strong style={{ display: "block", marginBottom: 8 }}>
          Como funciona a Classificação
        </Text>
        <Text type="secondary" style={{ fontSize: 13 }}>
          O roteador pontua cada solicitação em 7 dimensões: contagem de tokens, presença de código, marcadores de
          raciocínio, termos técnicos, indicadores simples, padrões multietapas e complexidade da pergunta. A pontuação
          ponderada determina o nível:
        </Text>
        <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20, fontSize: 13, color: "rgba(0, 0, 0, 0.45)" }}>
          <li>
            <strong>SIMPLE</strong>: Score &lt; 0.15
          </li>
          <li>
            <strong>MEDIUM</strong>: Score 0.15 - 0.35
          </li>
          <li>
            <strong>COMPLEX</strong>: Score 0.35 - 0.60
          </li>
          <li>
            <strong>REASONING</strong>: Score &gt; 0.60 (or 2+ reasoning markers)
          </li>
        </ul>
      </Card>
    </>
  );
};

export default ClassificationMethodConfig;
