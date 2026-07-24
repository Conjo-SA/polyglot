import React from "react";
import { Radio } from "antd";
import type { ExportScope, EntityType } from "./types";

interface ExportTypeSelectorProps {
  value: ExportScope;
  onChange: (value: ExportScope) => void;
  entityType: EntityType;
}

const ExportTypeSelector: React.FC<ExportTypeSelectorProps> = ({ value, onChange, entityType }) => {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 block mb-2">Tipo de Exportação</label>
      <Radio.Group value={value} onChange={(e) => onChange(e.target.value)} className="w-full">
        <div className="space-y-2">
          <label className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
            <Radio value="daily" className="mt-0.5" />
            <div className="ml-3 flex-1">
              <div className="font-medium text-sm">Detalhamento diário por {entityType}</div>
              <div className="text-xs text-gray-500 mt-0.5">Métricas diárias para cada {entityType}</div>
            </div>
          </label>

          <label className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
            <Radio value="daily_with_keys" className="mt-0.5" />
            <div className="ml-3 flex-1">
              <div className="font-medium text-sm">Detalhamento diário por {entityType} e chave</div>
              <div className="text-xs text-gray-500 mt-0.5">Métricas diárias para cada {entityType}, dividido por chave API</div>
            </div>
          </label>

          <label className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
            <Radio value="daily_with_models" className="mt-0.5" />
            <div className="ml-3 flex-1">
              <div className="font-medium text-sm">Diariamente por {entityType} e modelo</div>
              <div className="text-xs text-gray-500 mt-0.5">Métricas diárias divididas por modelo</div>
            </div>
          </label>
        </div>
      </Radio.Group>
    </div>
  );
};

export default ExportTypeSelector;
