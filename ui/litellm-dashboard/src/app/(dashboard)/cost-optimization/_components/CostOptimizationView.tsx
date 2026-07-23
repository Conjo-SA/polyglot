"use client";

import React from "react";
import { PiggyBank } from "lucide-react";
import { Alert, Tabs } from "antd";

import UsageTab from "./UsageTab";
import PromptCompressionTab from "./PromptCompressionTab";
import AutorouterTab from "./AutorouterTab";
import PromptCachingTab from "./PromptCachingTab";

interface CostOptimizationViewProps {
  accessToken: string | null;
  userId: string | null;
  userRole: string;
}

const CostOptimizationView: React.FC<CostOptimizationViewProps> = ({ accessToken, userId, userRole }) => {
  const items = [
    {
      key: "usage",
      label: "Uso",
      children: <UsageTab accessToken={accessToken} userId={userId} userRole={userRole} />,
    },
    {
      key: "compression",
      label: "Compressão de Prompt",
      children: <PromptCompressionTab accessToken={accessToken} />,
    },
    {
      key: "autorouter",
      label: "Autorroteador",
      children: <AutorouterTab accessToken={accessToken} userId={userId} userRole={userRole} />,
    },
    {
      key: "caching",
      label: "Cache de Prompt",
      children: <PromptCachingTab accessToken={accessToken} />,
    },
  ];

  return (
    <div className="w-full space-y-6 p-6">
      <div>
        <div className="flex items-center gap-2">
          <PiggyBank className="size-6 text-emerald-600" strokeWidth={1.75} />
          <h1 className="text-xl font-semibold text-foreground">Otimização de Custos</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitore e configure os mecanismos que economizam seu dinheiro: compressão de prompt, cache de prompt e roteamento automático
        </p>
      </div>

      <Alert
        type="info"
        showIcon
        message="Este é um painel experimental"
        description={
          <span>
            Tem feedback? Participe da discussão{" "}
            <a
              href="https://github.com/BerriAI/litellm/discussions/32172"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              here
            </a>
          </span>
        }
      />

      <Tabs defaultActiveKey="usage" items={items} />
    </div>
  );
};

export default CostOptimizationView;
