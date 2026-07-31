"use client";

import React, { useMemo, useState } from "react";
import { Collapse } from "antd";

import { AreaChart, DonutChart } from "@/components/shared/charts";
import AdvancedDatePicker from "@/components/shared/advanced_date_picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { userDailyActivityCall } from "@/components/networking";
import { DailyData, SpendMetrics } from "@/components/UsagePage/types";
import { formatNumberWithCommas } from "@/utils/dataUtils";
import { all_admin_roles } from "@/utils/roles";
import { usePaginatedDailyActivity } from "@/app/(dashboard)/usage/_components/hooks/usePaginatedDailyActivity";

interface UsageTabProps {
  accessToken: string | null;
  userId: string | null;
  userRole: string;
}

type DateRange = { from?: Date; to?: Date };

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const brl = (value: number): string => {
  const decimals = value > 0 && value < 1 ? 4 : 2;
  return `R$ ${formatNumberWithCommas(value, decimals, false, true, "pt-BR")}`;
};

const shortDate = (iso: string): string =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR", { month: "short", day: "numeric" });

const compressionOf = (m: SpendMetrics): number => m.compression_savings_spend ?? 0;
const cachingOf = (m: SpendMetrics): number => m.prompt_caching_savings_spend ?? 0;
const savedTokensOf = (m: SpendMetrics): number => m.compression_saved_tokens ?? 0;

const MethodologyNote = () => (
  <Collapse
    ghost
    items={[
      {
        key: "methodology",
        label: <span className="text-sm font-medium">Como as economias são calculadas</span>,
        children: (
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              As economias são calculadas para cada requisição quando ela é registrada, usando o uso informado pelo provedor e o
              preço do modelo, depois somadas em um registro diário. Os totais abaixo são lidos desse registro no
              período selecionado, então os números nunca exigem varredura dos registros brutos de requisições.
            </p>
            <p>
              As economias por compressão são os tokens removidos pelo Headroom antes da chamada, precificados pela taxa de entrada do modelo:
              <code>tokens_comprimidos * custo_por_token_de_entrada</code>
            </p>
            <p>
              As economias por cache de prompt são os tokens servidos pelo provedor a partir do cache (Anthropic{" "}
              <code>tokens_lidos_do_cache</code>, ou estilo OpenAI <code>detalhes_do_prompt.tokens_em_cache</code>),
              precificados com o desconto entre a taxa normal de entrada e a taxa de leitura do cache:{" "}
              <code>tokens_lidos_do_cache * max(custo_por_token_de_entrada - custo_do_token_de_leitura_do_cache, 0)</code>
            </p>
            <p>
              O total economizado é a soma de ambos os drivers. Modelos sem preço separado de leitura de cache no mapa de preços
              contribuem com zero economia por cache em vez de gerar erro.
            </p>
          </div>
        ),
      },
    ]}
  />
);

const SummaryCard = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-2xl font-semibold text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </CardContent>
  </Card>
);

const UsageTab: React.FC<UsageTabProps> = ({ accessToken, userId, userRole }) => {
  const initialFrom = useMemo(() => new Date(new Date().getTime() - THIRTY_DAYS_MS), []);
  const initialTo = useMemo(() => new Date(), []);
  const [dateValue, setDateValue] = useState<DateRange>({ from: initialFrom, to: initialTo });

  const startTime = dateValue.from ?? null;
  const endTime = dateValue.to ?? null;
  const isAdmin = all_admin_roles.includes(userRole);
  const effectiveUserId = isAdmin ? null : userId;

  const { data, loading, isFetchingMore } = usePaginatedDailyActivity({
    fetchFn: userDailyActivityCall,
    args: [accessToken, startTime, endTime, effectiveUserId],
    enabled: !!accessToken && !!startTime && !!endTime,
  });

  const results = data.results as DailyData[];

  const compressionTotal = useMemo(() => results.reduce((sum, d) => sum + compressionOf(d.metrics), 0), [results]);
  const cachingTotal = useMemo(() => results.reduce((sum, d) => sum + cachingOf(d.metrics), 0), [results]);
  const savedTokensTotal = useMemo(() => results.reduce((sum, d) => sum + savedTokensOf(d.metrics), 0), [results]);
  const totalSaved = compressionTotal + cachingTotal;

  const overTime = useMemo(
    () =>
      results.map((d) => ({
        date: shortDate(d.date),
        Compression: compressionOf(d.metrics),
        "Prompt caching": cachingOf(d.metrics),
      })),
    [results],
  );

  const byDriver = useMemo(
    () =>
      [
        { driver: "Compression", usd: compressionTotal },
        { driver: "Prompt caching", usd: cachingTotal },
      ].filter((d) => d.usd > 0),
    [compressionTotal, cachingTotal],
  );

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <MethodologyNote />
        <AdvancedDatePicker value={dateValue} onValueChange={(v) => setDateValue(v)} />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          label="Total economizado"
          value={brl(totalSaved)}
          hint={loading || isFetchingMore ? "Carregando..." : "Compressão + cache de prompt"}
        />
        <SummaryCard
          label="Economia por compressão"
          value={brl(compressionTotal)}
          hint={`${formatNumberWithCommas(savedTokensTotal)} tokens comprimidos`}
        />
        <SummaryCard label="Economia por cache de prompt" value={brl(cachingTotal)} hint="Desconto na leitura do cache" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Economias ao longo do tempo</CardTitle>
          </CardHeader>
          <CardContent>
            <AreaChart
              data={overTime}
              index="date"
              categories={["Compression", "Prompt caching"]}
              colors={["emerald", "blue"]}
              valueFormatter={brl}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Economias por driver</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart
              className="h-80"
              data={byDriver}
              index="driver"
              category="usd"
              colors={["emerald", "blue"]}
              valueFormatter={brl}
              showLabel
              label={brl(totalSaved)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UsageTab;
