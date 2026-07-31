import React from "react";
import { UiLoadingSpinner } from "../ui/ui-loading-spinner";

interface ChartLoaderProps {
  isDateChanging?: boolean;
}

export const ChartLoader: React.FC<ChartLoaderProps> = ({ isDateChanging = false }) => (
  <div className="flex items-center justify-center h-40">
    <div className="flex items-center justify-center gap-3">
      <UiLoadingSpinner className="size-5" />
      <div className="flex flex-col">
        <span className="text-gray-600 text-sm font-medium">
          {isDateChanging ? "Processando seleção de data..." : "Carregando dados do gráfico..."}
        </span>
        <span className="text-gray-400 text-xs mt-1">
          {isDateChanging ? "Isso levará apenas um instante" : "Buscando seus dados"}
        </span>
      </div>
    </div>
  </div>
);

export default ChartLoader;
