import React, { useState } from "react";
import { Modal, Form, Input, Select } from "antd";
import MessageManager from "@/components/molecules/message_manager";
import { Button } from "@tremor/react";
import { registerClaudeCodePlugin } from "@/components/networking";
import {
  validatePluginName,
  isValidSemanticVersion,
  isValidEmail,
  isValidUrl,
  parseKeywords,
  parseSkillSource,
  isValidSubPath,
  SkillSourcePreview,
} from "@/components/claude_code_plugins/helpers";
import { PluginAuthor, PluginSource, SkillRegisterRequest } from "@/components/claude_code_plugins/types";

const { TextArea } = Input;
const { Option } = Select;

interface AddPluginFormProps {
  visible: boolean;
  onClose: () => void;
  accessToken: string | null;
  onSuccess: () => void;
}

interface AddPluginFormValues {
  name: string;
  skillUrl?: string;
  subPath?: string;
  version?: string;
  description?: string;
  authorName?: string;
  authorEmail?: string;
  homepage?: string;
  category?: string;
  keywords?: string;
  domain?: string;
  namespace?: string;
}

const buildAuthor = (values: AddPluginFormValues): PluginAuthor | undefined => {
  const name = values.authorName?.trim();
  const email = values.authorEmail?.trim();
  if (!name) {
    return undefined;
  }
  return email ? { name, email } : { name };
};

const buildRegisterRequest = (values: AddPluginFormValues, source: PluginSource): SkillRegisterRequest => {
  const author = buildAuthor(values);
  return {
    name: values.name.trim(),
    source,
    ...(values.version ? { version: values.version.trim() } : {}),
    ...(values.description ? { description: values.description.trim() } : {}),
    ...(author ? { author } : {}),
    ...(values.homepage ? { homepage: values.homepage.trim() } : {}),
    ...(values.category ? { category: values.category } : {}),
    ...(values.keywords ? { keywords: parseKeywords(values.keywords) } : {}),
    ...(values.domain ? { domain: values.domain.trim() } : {}),
    ...(values.namespace ? { namespace: values.namespace.trim() } : {}),
  };
};

const PREDEFINED_CATEGORIES = [
  "Development",
  "Productivity",
  "Learning",
  "Security",
  "Data & Analytics",
  "Integration",
  "Testing",
  "Documentation",
];

const AddPluginForm: React.FC<AddPluginFormProps> = ({ visible, onClose, accessToken, onSuccess }) => {
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [urlPreview, setUrlPreview] = useState<SkillSourcePreview | null>(null);
  const [urlEncodesSubdir, setUrlEncodesSubdir] = useState(false);

  const recomputePreview = (skillUrl: string, subPath: string) => {
    const encodesSubdir = parseSkillSource(skillUrl)?.parsed.source === "git-subdir";
    setUrlEncodesSubdir(encodesSubdir);
    if (encodesSubdir && form.getFieldValue("subPath")) {
      form.setFieldsValue({ subPath: "" });
    }
    const preview = parseSkillSource(skillUrl, encodesSubdir ? undefined : subPath);
    setUrlPreview(preview);
    if (preview && !form.getFieldValue("name")) {
      form.setFieldsValue({ name: preview.suggestedName });
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    recomputePreview(e.target.value, form.getFieldValue("subPath") ?? "");
  };

  const handleSubPathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    recomputePreview(form.getFieldValue("skillUrl") ?? "", e.target.value);
  };

  const handleSubmit = async (values: AddPluginFormValues) => {
    if (!accessToken) {
      MessageManager.error("No access token available");
      return;
    }

    if (!urlPreview) {
      MessageManager.error("Please enter a valid repository URL");
      return;
    }

    if (!validatePluginName(values.name)) {
      MessageManager.error("Skill name must be kebab-case (lowercase letters, numbers, and hyphens only)");
      return;
    }

    if (values.version && !isValidSemanticVersion(values.version)) {
      MessageManager.error("Version must be in semantic versioning format (e.g., 1.0.0)");
      return;
    }

    if (values.authorEmail && !isValidEmail(values.authorEmail)) {
      MessageManager.error("Invalid email format");
      return;
    }

    if (values.homepage && !isValidUrl(values.homepage)) {
      MessageManager.error("Invalid homepage URL format");
      return;
    }

    setIsSubmitting(true);
    try {
      await registerClaudeCodePlugin(accessToken, buildRegisterRequest(values, urlPreview.parsed));
      MessageManager.success("Skill registered successfully");
      form.resetFields();
      setUrlPreview(null);
      setUrlEncodesSubdir(false);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error registering skill:", error);
      const reason = error instanceof Error && error.message ? error.message : "Failed to register skill";
      MessageManager.error(`Failed to register skill: ${reason}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setUrlPreview(null);
    setUrlEncodesSubdir(false);
    onClose();
  };

  return (
    <Modal title="Adicionar Nova Habilidade" open={visible} onCancel={handleCancel} footer={null} width={700} className="top-8">
      <Form form={form} layout="vertical" onFinish={handleSubmit} className="mt-4">
        {/* Smart URL Input */}
        <Form.Item
          label="URL do Repositório"
          name="skillUrl"
          rules={[{ required: true, message: "Por favor, insira uma URL do repositório" }]}
          tooltip="Cole uma URL de repositório git HTTPS do GitHub, GitLab, Bitbucket ou um host auto-hospedado. Ex.: github.com/org/repo, gitlab.com/org/repo, ou github.com/org/repo/tree/main/my-skill"
        >
          <Input
            placeholder="https://github.com/org/repo or https://gitlab.com/org/repo"
            className="rounded-lg"
            onChange={handleUrlChange}
          />
        </Form.Item>

        {/* Optional subfolder for monorepos */}
        <Form.Item
          label="Caminho da subpasta (Opcional)"
          name="subPath"
          rules={[
            {
              validator: (_, value) =>
                !value || isValidSubPath(value)
                  ? Promise.resolve()
                  : Promise.reject(
                      new Error(
                        "A subpasta deve ser um caminho relativo como plugins/my-skill (letras, números, pontos, hífens, underscores)",
                      ),
                    ),
            },
          ]}
          tooltip="Caminho dentro do repositório onde a habilidade reside (ex.: plugins/my-skill). Deixe vazio se a habilidade estiver na raiz do repositório."
          extra={urlEncodesSubdir ? "A URL já aponta para uma subpasta, então este campo está desativado" : undefined}
        >
          <Input
            placeholder="plugins/my-skill"
            className="rounded-lg"
            onChange={handleSubPathChange}
            disabled={urlEncodesSubdir}
          />
        </Form.Item>

        {/* Parsed preview */}
        {urlPreview && (
          <div className="mb-4 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
            Detectado: {urlPreview.label}
          </div>
        )}

        {/* Skill Name */}
        <Form.Item
          label="Nome da Habilidade"
          name="name"
          rules={[
            { required: true, message: "Por favor, insira o nome da habilidade" },
            {
              pattern: /^[a-z0-9-]+$/,
              message: "O nome deve estar no formato kebab-case (apenas letras minúsculas, números e hífens)",
            },
          ]}
          tooltip="Identificador único no formato kebab-case (ex.: my-skill)"
        >
          <Input placeholder="my-skill" className="rounded-lg" />
        </Form.Item>

        {/* Domain and Namespace — side by side */}
        <div className="flex gap-4">
          <Form.Item
            label="Domínio (Opcional)"
            name="domain"
            tooltip="Agrupamento de nível superior no Hub de Habilidades (ex.: Productivity)"
            className="flex-1"
          >
            <Input placeholder="Productivity" className="rounded-lg" />
          </Form.Item>
          <Form.Item
            label="Namespace (Opcional)"
            name="namespace"
            tooltip="Sub-agrupamento dentro do domínio (ex.: workflows)"
            className="flex-1"
          >
            <Input placeholder="workflows" className="rounded-lg" />
          </Form.Item>
        </div>

        {/* Description */}
        <Form.Item label="Descrição (Opcional)" name="description" tooltip="Breve descrição do que a habilidade faz">
          <TextArea rows={3} placeholder="Uma habilidade que ajuda com..." maxLength={500} className="rounded-lg" />
        </Form.Item>

        {/* Category */}
        <Form.Item label="Categoria (Opcional)" name="category" tooltip="Selecione uma categoria ou digite uma personalizada">
          <Select
            placeholder="Selecione ou digite uma categoria"
            allowClear
            showSearch
            optionFilterProp="children"
            className="rounded-lg"
          >
            {PREDEFINED_CATEGORIES.map((cat) => (
              <Option key={cat} value={cat}>
                {cat}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* Keywords */}
        <Form.Item label="Palavras-chave (Opcional)" name="keywords" tooltip="Lista de palavras-chave separadas por vírgula para busca">
          <Input placeholder="busca, web, api" className="rounded-lg" />
        </Form.Item>

        {/* Version */}
        <Form.Item label="Versão (Opcional)" name="version" tooltip="Versão semântica (ex.: 1.0.0)">
          <Input placeholder="1.0.0" className="rounded-lg" />
        </Form.Item>

        {/* Author Name */}
        <Form.Item label="Nome do Autor (Opcional)" name="authorName" tooltip="Nome do autor ou organização da habilidade">
          <Input placeholder="Seu Nome ou Organização" className="rounded-lg" />
        </Form.Item>

        {/* Author Email */}
        <Form.Item
          label="Email do Autor (Opcional)"
          name="authorEmail"
          rules={[{ type: "email", message: "Por favor, insira um email válido" }]}
          tooltip="Email de contato para o autor da habilidade"
        >
          <Input type="email" placeholder="author@example.com" className="rounded-lg" />
        </Form.Item>

        {/* Submit Buttons */}
        <Form.Item className="mb-0 mt-6">
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={handleCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {isSubmitting ? "Adicionando..." : "Adicionar Habilidade"}
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddPluginForm;
