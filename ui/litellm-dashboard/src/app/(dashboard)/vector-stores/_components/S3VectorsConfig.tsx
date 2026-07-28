import React, { useState, useEffect } from "react";
import { Alert, Form, Input, Select, Tooltip } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { fetchAvailableModels, ModelGroup } from "@/components/llm_calls/fetch_models";

interface S3VectorsConfigProps {
  accessToken: string | null;
  providerParams: Record<string, any>;
  onParamsChange: (params: Record<string, any>) => void;
}

const S3VectorsConfig: React.FC<S3VectorsConfigProps> = ({ accessToken, providerParams, onParamsChange }) => {
  const [embeddingModels, setEmbeddingModels] = useState<ModelGroup[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  useEffect(() => {
    if (!accessToken) return;

    const loadModels = async () => {
      setIsLoadingModels(true);
      try {
        const models = await fetchAvailableModels(accessToken);
        // Filter for embedding models only
        const embeddingOnly = models.filter((model) => model.mode === "embedding");
        setEmbeddingModels(embeddingOnly);
      } catch (error) {
        console.error("Error fetching embedding models:", error);
      } finally {
        setIsLoadingModels(false);
      }
    };

    loadModels();
  }, [accessToken]);

  const handleFieldChange = (fieldName: string, value: string) => {
    onParamsChange({
      ...providerParams,
      [fieldName]: value,
    });
  };

  return (
    <>
      {/* S3 Vectors Setup Instructions */}
      <Alert
        message="Configuração de Vetores AWS S3"
        description={
          <div>
            <p>O AWS S3 Vectors permite que você armazene e consulte embeddings vetoriais diretamente no S3:</p>
            <ul style={{ marginLeft: "16px", marginTop: "8px" }}>
              <li>Buckets e índices vetoriais serão criados automaticamente se não existirem</li>
              <li>As dimensões vetoriais são detectadas automaticamente a partir do seu modelo de embedding selecionado</li>
              <li>Certifique-se de que suas credenciais AWS tenham permissões para operações de S3 Vectors</li>
              <li>
                Saiba mais:{" "}
                <a
                  href="https://docs.aws.amazon.com/AmazonS3/latest/userguide/s3-vector-buckets.html"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Documentação do AWS S3 Vectors
                </a>
              </li>
            </ul>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: "16px" }}
      />

      {/* Vector Bucket Name */}
      <Form.Item
        label={
          <span>
            Nome do Bucket Vetorial{" "}
            <Tooltip title="Nome do bucket S3 para armazenamento vetorial (deve ter pelo menos 3 caracteres, letras minúsculas, números, hífens e pontos apenas)">
              <InfoCircleOutlined style={{ marginLeft: "4px" }} />
            </Tooltip>
          </span>
        }
        required
        validateStatus={
          providerParams.vector_bucket_name && providerParams.vector_bucket_name.length < 3 ? "error" : undefined
        }
        help={
          providerParams.vector_bucket_name && providerParams.vector_bucket_name.length < 3
            ? "O nome do bucket deve ter pelo menos 3 caracteres"
            : undefined
        }
      >
        <Input
          value={providerParams.vector_bucket_name || ""}
          onChange={(e) => handleFieldChange("vector_bucket_name", e.target.value)}
          placeholder="meu-bucket-vetorial (mínimo 3 caracteres)"
          size="large"
          className="rounded-md"
        />
      </Form.Item>

      {/* Index Name (Optional) */}
      <Form.Item
        label={
          <span>
            Nome do Índice{" "}
            <Tooltip title="Nome para o índice vetorial (opcional, será gerado automaticamente se não for fornecido). Se fornecido, deve ter pelo menos 3 caracteres.">
              <InfoCircleOutlined style={{ marginLeft: "4px" }} />
            </Tooltip>
          </span>
        }
        validateStatus={
          providerParams.index_name && providerParams.index_name.length > 0 && providerParams.index_name.length < 3
            ? "error"
            : undefined
        }
        help={
          providerParams.index_name && providerParams.index_name.length > 0 && providerParams.index_name.length < 3
            ? "O nome do índice deve ter pelo menos 3 caracteres se fornecido"
            : undefined
        }
      >
        <Input
          value={providerParams.index_name || ""}
          onChange={(e) => handleFieldChange("index_name", e.target.value)}
          placeholder="meu-indice-vetorial (opcional, mínimo 3 caracteres)"
          size="large"
          className="rounded-md"
        />
      </Form.Item>

      {/* AWS Region */}
      <Form.Item
        label={
          <span>
            Região AWS{" "}
            <Tooltip title="Região AWS onde o bucket S3 está localizado (ex.: us-west-2)">
              <InfoCircleOutlined style={{ marginLeft: "4px" }} />
            </Tooltip>
          </span>
        }
        required
      >
        <Input
          value={providerParams.aws_region_name || ""}
          onChange={(e) => handleFieldChange("aws_region_name", e.target.value)}
          placeholder="us-west-2"
          size="large"
          className="rounded-md"
        />
      </Form.Item>

      {/* Embedding Model */}
      <Form.Item
        label={
          <span>
            Modelo de Embedding{" "}
            <Tooltip title="Selecione o modelo de embedding para uso na geração de vetores">
              <InfoCircleOutlined style={{ marginLeft: "4px" }} />
            </Tooltip>
          </span>
        }
        required
      >
        <Select
          value={providerParams.embedding_model || undefined}
          onChange={(value) => handleFieldChange("embedding_model", value)}
          placeholder="Selecione um modelo de embedding"
          size="large"
          showSearch
          loading={isLoadingModels}
          filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
          options={embeddingModels.map((model) => ({
            value: model.model_group,
            label: model.model_group,
          }))}
          style={{ width: "100%" }}
        />
      </Form.Item>
    </>
  );
};

export default S3VectorsConfig;
