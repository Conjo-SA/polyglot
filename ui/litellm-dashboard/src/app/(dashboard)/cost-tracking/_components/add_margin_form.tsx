import React from "react";
import { TextInput, Button } from "@tremor/react";
import { Select as AntdSelect, Form, Tooltip, Radio } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { Providers, provider_map, providerLogoMap } from "@/components/provider_info_helpers";
import { resolveLogoSrc } from "@/lib/assetPaths";
import { MarginConfig } from "./types";
import { handleImageError } from "./provider_display_helpers";
import { CurrencyMoneyInput } from "@/components/shared/CurrencyMoneyInput";


interface AddMarginFormProps {
  marginConfig: MarginConfig;
  selectedProvider: string | undefined;
  marginType: "percentage" | "fixed";
  percentageValue: string;
  fixedAmountValue: string;
  onProviderChange: (provider: string | undefined) => void;
  onMarginTypeChange: (type: "percentage" | "fixed") => void;
  onPercentageChange: (value: string) => void;
  onFixedAmountChange: (value: string) => void;
  onAddProvider: () => void;
}

const AddMarginForm: React.FC<AddMarginFormProps> = ({
  marginConfig,
  selectedProvider,
  marginType,
  percentageValue,
  fixedAmountValue,
  onProviderChange,
  onMarginTypeChange,
  onPercentageChange,
  onFixedAmountChange,
  onAddProvider,
}) => {
  return (
    <div className="space-y-6">
      <Form.Item
        label={
          <span className="text-sm font-medium text-gray-700 flex items-center">
            Provedor
            <Tooltip title="Selecione 'Global' para aplicar margem a todos os provedores, ou selecione um provedor específico">
              <InfoCircleOutlined className="ml-2 text-blue-400 hover:text-blue-600 cursor-help" />
            </Tooltip>
          </span>
        }
        rules={[{ required: true, message: "Por favor selecione um provedor" }]}
      >
        <AntdSelect
          showSearch
          placeholder="Selecione o provedor ou 'Global'"
          value={selectedProvider}
          onChange={onProviderChange}
          style={{ width: "100%" }}
          size="large"
          optionFilterProp="children"
          filterOption={(input, option) =>
            String(option?.label ?? "")
              .toLowerCase()
              .includes(input.toLowerCase())
          }
        >
          <AntdSelect.Option key="global" value="global" label="Global (Todos os Provedores)">
            <div className="flex items-center space-x-2">
              <span className="font-medium">Global (Todos os Provedores)</span>
            </div>
          </AntdSelect.Option>
          {Object.entries(Providers).map(([providerEnum, providerDisplayName]) => {
            const providerValue = provider_map[providerEnum as keyof typeof provider_map];
            // Only show providers that don't already have a margin configured
            if (providerValue && marginConfig[providerValue]) {
              return null;
            }
            return (
              <AntdSelect.Option key={providerEnum} value={providerEnum} label={providerDisplayName}>
                <div className="flex items-center space-x-2">
                  <img
                    src={resolveLogoSrc(providerLogoMap[providerDisplayName])}
                    alt={`${providerEnum} logo`}
                    className="w-5 h-5"
                    onError={(e) => handleImageError(e, providerDisplayName)}
                  />
                  <span>{providerDisplayName}</span>
                </div>
              </AntdSelect.Option>
            );
          })}
        </AntdSelect>
      </Form.Item>

      <Form.Item
        label={
          <span className="text-sm font-medium text-gray-700 flex items-center">
            Tipo de Margem
            <Tooltip title="Escolha como aplicar a margem: baseada em porcentagem ou valor fixo">
              <InfoCircleOutlined className="ml-2 text-blue-400 hover:text-blue-600 cursor-help" />
            </Tooltip>
          </span>
        }
        rules={[{ required: true, message: "Por favor selecione um tipo de margem" }]}
      >
        <Radio.Group value={marginType} onChange={(e) => onMarginTypeChange(e.target.value)} className="w-full">
          <Radio value="percentage">Baseada em Porcentagem</Radio>
          <Radio value="fixed">Valor Fixo</Radio>
        </Radio.Group>
      </Form.Item>

      {marginType === "percentage" && (
        <Form.Item
          label={
            <span className="text-sm font-medium text-gray-700 flex items-center">
              Porcentagem da Margem
              <Tooltip title="Informe um valor percentual (ex: 10 para 10% de margem)">
                <InfoCircleOutlined className="ml-2 text-blue-400 hover:text-blue-600 cursor-help" />
              </Tooltip>
            </span>
          }
          rules={[
            { required: true, message: "Por favor informe uma porcentagem de margem" },
            {
              validator: (_, value) => {
                if (!value) {
                  return Promise.reject(new Error("Por favor informe uma porcentagem de margem"));
                }
                const numValue = parseFloat(value);
                if (isNaN(numValue) || numValue < 0 || numValue > 1000) {
                  return Promise.reject(new Error("A porcentagem deve estar entre 0 e 1000"));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <div className="flex items-center gap-2">
            <TextInput
              placeholder="10"
              value={percentageValue}
              onValueChange={onPercentageChange}
              className="rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 flex-1"
            />
            <span className="text-gray-600">%</span>
          </div>
        </Form.Item>
      )}

      {marginType === "fixed" && (
        <Form.Item
          label={
            <span className="text-sm font-medium text-gray-700 flex items-center">
              Valor Fixo da Margem
              <Tooltip title="Informe um valor fixo em USD (ex: 0.001 para $0.001 por requisição)">
                <InfoCircleOutlined className="ml-2 text-blue-400 hover:text-blue-600 cursor-help" />
              </Tooltip>
            </span>
          }
          rules={[
            { required: true, message: "Por favor informe um valor fixo" },
          ]}
        >
          <CurrencyMoneyInput
            value={fixedAmountValue !== "" ? parseFloat(fixedAmountValue) : undefined}
            onChange={(value) => onFixedAmountChange(value !== null ? value.toString() : '')}
            min={0}
          />
        </Form.Item>
      )}

      <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-100">
        <Button
          variant="primary"
          onClick={onAddProvider}
          disabled={
            !selectedProvider ||
            (marginType === "percentage" && !percentageValue) ||
            (marginType === "fixed" && (!fixedAmountValue || isNaN(parseFloat(fixedAmountValue))))
          }
        >
          Adicionar Margem por Provedor
        </Button>
      </div>
    </div>
  );
};

export default AddMarginForm;
