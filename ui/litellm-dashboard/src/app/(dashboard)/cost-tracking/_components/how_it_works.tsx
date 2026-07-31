import React, { useState, useMemo } from "react";
import { Text, TextInput } from "@tremor/react";
import CodeBlock from "@/components/CodeBlock";

const HowItWorks: React.FC = () => {
  const [responseCost, setResponseCost] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");

  const calculatedDiscount = useMemo(() => {
    const cost = parseFloat(responseCost);
    const discount = parseFloat(discountAmount);

    if (isNaN(cost) || isNaN(discount) || cost === 0 || discount === 0) {
      return null;
    }

    const originalCost = cost + discount;
    const discountPercentage = (discount / originalCost) * 100;

    return {
      originalCost: originalCost.toFixed(10),
      finalCost: cost.toFixed(10),
      discountAmount: discount.toFixed(10),
      discountPercentage: discountPercentage.toFixed(2),
    };
  }, [responseCost, discountAmount]);

  return (
    <div className="space-y-4 pt-2">
      <div>
        <Text className="font-medium text-gray-900 text-sm mb-1">Cálculo de Custos</Text>
        <Text className="text-xs text-gray-600">
          Os descontos são aplicados aos custos dos provedores:{" "}
          <code className="bg-gray-100 px-1.5 py-0.5 rounded-sm text-xs">
            custo_final = custo_base × (1 - desconto%/100)
          </code>
        </Text>
      </div>
      <div>
        <Text className="font-medium text-gray-900 text-sm mb-1">Exemplo</Text>
        <Text className="text-xs text-gray-600">
          Um desconto de 5% em uma requisição de R$ 10,00 resulta em: R$ 10,00 × (1 - 0.05) = R$ 9,50
        </Text>
      </div>
      <div>
        <Text className="font-medium text-gray-900 text-sm mb-1">Intervalo Válido</Text>
        <Text className="text-xs text-gray-600">As porcentagens de desconto devem estar entre 0% e 100%</Text>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <Text className="font-medium text-gray-900 text-sm mb-2">Validando Descontos</Text>
        <Text className="text-xs text-gray-600 mb-3">
          Faça uma requisição de teste e verifique os cabeçalhos de resposta para confirmar que os descontos estão sendo aplicados:
        </Text>
        <CodeBlock
          language="bash"
          code={`curl -X POST -i http://your-proxy:4000/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer sk-1234" \\
  -d '{
    "model": "gemini/gemini-2.5-pro",
    "messages": [{"role": "user", "content": "Hello"}]
  }'`}
        />
        <Text className="text-xs text-gray-600 mt-3 mb-2">Procure estes cabeçalhos na resposta:</Text>
        <div className="space-y-1.5">
          <div className="flex items-start gap-3">
            <code className="bg-gray-100 px-2 py-1 rounded-sm text-xs font-mono text-gray-800 whitespace-nowrap">
              x-litellm-response-cost
            </code>
            <Text className="text-xs text-gray-600">Custo final após desconto</Text>
          </div>
          <div className="flex items-start gap-3">
            <code className="bg-gray-100 px-2 py-1 rounded-sm text-xs font-mono text-gray-800 whitespace-nowrap">
              x-litellm-response-cost-original
            </code>
            <Text className="text-xs text-gray-600">Custo original antes do desconto</Text>
          </div>
          <div className="flex items-start gap-3">
            <code className="bg-gray-100 px-2 py-1 rounded-sm text-xs font-mono text-gray-800 whitespace-nowrap">
              x-litellm-response-cost-discount-amount
            </code>
            <Text className="text-xs text-gray-600">Valor descontado</Text>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <Text className="font-medium text-gray-900 text-sm mb-3">Calculadora de Desconto</Text>
        <Text className="text-xs text-gray-600 mb-3">
          Informe os valores dos seus cabeçalhos de resposta para verificar o desconto:
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Custo da Resposta (x-litellm-response-cost)
            </label>
            <TextInput
              placeholder="0.0171938125"
              value={responseCost}
              onValueChange={setResponseCost}
              className="text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Valor do Desconto (x-litellm-response-cost-discount-amount)
            </label>
            <TextInput
              placeholder="0.0009049375"
              value={discountAmount}
              onValueChange={setDiscountAmount}
              className="text-sm"
            />
          </div>
        </div>

        {calculatedDiscount && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <Text className="text-sm font-medium text-blue-900 mb-2">Resultados Calculados</Text>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Text className="text-xs text-blue-800">Custo Original:</Text>
                <code className="text-xs font-mono text-blue-900">${calculatedDiscount.originalCost}</code>
              </div>
              <div className="flex items-center justify-between">
                <Text className="text-xs text-blue-800">Custo Final:</Text>
                <code className="text-xs font-mono text-blue-900">${calculatedDiscount.finalCost}</code>
              </div>
              <div className="flex items-center justify-between">
                <Text className="text-xs text-blue-800">Valor do Desconto:</Text>
                <code className="text-xs font-mono text-blue-900">${calculatedDiscount.discountAmount}</code>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-blue-300">
                <Text className="text-xs font-semibold text-blue-900">Desconto Aplicado:</Text>
                <Text className="text-sm font-bold text-blue-900">{calculatedDiscount.discountPercentage}%</Text>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HowItWorks;
