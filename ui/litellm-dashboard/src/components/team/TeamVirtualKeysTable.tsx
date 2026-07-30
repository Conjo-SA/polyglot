"use client";
import { useKeys } from "@/app/(dashboard)/hooks/keys/useKeys";
import { DateCell, IdCell, MoneyCell } from "@/components/shared/table_cells";
import {
  DataTable,
  DataTableFilterDrawer,
  DataTableFilterField,
  DataTableSortHeader,
  DataTableToolbar,
} from "@/components/shared/DataTable";
import { Input } from "@/components/ui/input";
import { DEBOUNCE_WAIT_MS } from "@/utils/debounceConstants";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/outline";
import { useDebouncedValue } from "@tanstack/react-pacer/debouncer";
import { ColumnDef, ColumnFiltersState, OnChangeFn, PaginationState, SortingState } from "@tanstack/react-table";
import { Badge, Icon, Text } from "@tremor/react";
import { Popover, Tooltip, Typography } from "antd";
import DefaultProxyAdminTag from "../common_components/DefaultProxyAdminTag";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getModelDisplayName } from "../key_team_helpers/fetch_available_models_team_key";
import { deriveKeyModelScope } from "../key_scope";
import { KeyResponse, Team } from "../key_team_helpers/key_list";
import { Organization } from "../networking";
import KeyInfoView from "../templates/key_info_view";

interface TeamVirtualKeysTableProps {
  teamId: string;
  teamAlias?: string;
  organization: Organization | null;
}

/**
 * TeamVirtualKeysTable – variante de VirtualKeysTable restrita a uma única equipe.
 * Exibe todas as chaves virtuais pertencentes à equipe com o mesmo formato e estilo.
 */
const DEFAULT_SORTING: SortingState = [{ id: "created_at", desc: true }];

export function TeamVirtualKeysTable({ teamId, teamAlias, organization }: TeamVirtualKeysTableProps) {
  const [selectedKey, setSelectedKey] = useState<KeyResponse | null>(null);
  const [sorting, setSorting] = useState<SortingState>(DEFAULT_SORTING);
  const [tablePagination, setTablePagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery] = useDebouncedValue(searchInput, { wait: DEBOUNCE_WAIT_MS });

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    setTablePagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  const getFilterValue = useCallback(
    (columnId: string): string | undefined => {
      const entry = columnFilters.find((filter) => filter.id === columnId);
      return typeof entry?.value === "string" && entry.value.trim() ? entry.value.trim() : undefined;
    },
    [columnFilters],
  );

  const sortBy = sorting.length > 0 ? sorting[0].id : "created_at";
  const sortOrder = sorting.length > 0 ? (sorting[0].desc ? "desc" : "asc") : "desc";

  const pageIndex = tablePagination.pageIndex;
  const pageSize = tablePagination.pageSize;

  const {
    data: keys,
    isPending: isLoading,
    isFetching,
    refetch,
  } = useKeys(pageIndex + 1, pageSize, {
    teamID: teamId,
    selectedKeyAlias: searchQuery.trim() || undefined,
    userID: getFilterValue("user_id"),
    sortBy: sortBy || undefined,
    sortOrder: sortOrder || undefined,
    expand: "user",
  });

  const displayKeys = useMemo(() => {
    const kList = keys?.keys || [];
    const orgId = organization?.organization_id;
    if (!orgId) return kList;
    return kList.map((k: KeyResponse) => ({
      ...k,
      organization_id: (k.organization_id ?? k.org_id) || orgId,
    }));
  }, [keys?.keys, organization?.organization_id]);

  const rowCount = keys?.total_count ?? 0;
  const [expandedAccordions, setExpandedAccordions] = useState<Record<string, boolean>>({});

  const currentTeam: Team = useMemo(
    () => ({
      team_id: teamId,
      team_alias: teamAlias || teamId,
      models: [],
      max_budget: null,
      budget_duration: null,
      tpm_limit: null,
      rpm_limit: null,
      organization_id: organization?.organization_id || "",
      created_at: "",
      keys: [],
      members_with_roles: [],
      spend: 0,
    }),
    [teamId, teamAlias, organization],
  );

  const handleStorageChange = useCallback(() => {
    refetch?.();
  }, [refetch]);

  useEffect(() => {
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [handleStorageChange]);

  const handleColumnFiltersChange = useCallback<OnChangeFn<ColumnFiltersState>>((updaterOrValue) => {
    setColumnFilters(updaterOrValue);
    setTablePagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  const columns: ColumnDef<KeyResponse>[] = useMemo(
    () => [
      {
        id: "token",
        accessorKey: "token",
        meta: { title: "ID da Chave" },
        header: ({ column }) => <DataTableSortHeader column={column} title="ID da Chave" variant="header-cycle" />,
        size: 120,
        enableSorting: true,
        cell: (info) => (
          <IdCell value={info.getValue() as string | null} onClick={() => setSelectedKey(info.row.original)} />
        ),
      },
      {
        id: "key_alias",
        accessorKey: "key_alias",
        meta: { title: "Apelido da Chave" },
        header: ({ column }) => <DataTableSortHeader column={column} title="Apelido da Chave" variant="header-cycle" />,
        size: 150,
        enableSorting: true,
        cell: (info) => {
          const value = info.getValue() as string;
          const width = info.cell.column.getSize();
          return (
            <Tooltip title={value}>
              <span className="font-mono text-xs truncate block" style={{ maxWidth: width, overflow: "hidden" }}>
                {value ?? "-"}
              </span>
            </Tooltip>
          );
        },
      },
      {
        id: "key_name",
        accessorKey: "key_name",
        header: "Chave Secreta",
        size: 120,
        enableSorting: false,
        cell: (info) => <span className="font-mono text-xs">{info.getValue() as string}</span>,
      },
      {
        id: "organization_id",
        accessorKey: "organization_id",
        header: "ID da Organização",
        size: 140,
        enableSorting: false,
        cell: (info) => (info.getValue() ? info.renderValue() : "-"),
      },
      {
        id: "user_email",
        accessorKey: "user",
        header: "E-mail do Usuário",
        size: 160,
        enableSorting: false,
        cell: (info) => {
          const user = info.getValue() as { user_email?: string } | undefined;
          const value = user?.user_email;
          const width = info.cell.column.getSize();
          return (
            <Tooltip title={value}>
              <span className="font-mono text-xs truncate block" style={{ maxWidth: width, overflow: "hidden" }}>
                {value ?? "-"}
              </span>
            </Tooltip>
          );
        },
      },
      {
        id: "user_id",
        accessorKey: "user_id",
        header: "ID do Usuário",
        size: 70,
        enableSorting: false,
        cell: (info) => {
          const userId = info.getValue() as string | null;
          const displayValue = userId === "default_user_id" ? "Default Proxy Admin" : userId;
          const width = info.cell.column.getSize();
          return (
            <Tooltip title={displayValue}>
              <span className="font-mono text-xs truncate block" style={{ maxWidth: width, overflow: "hidden" }}>
                {displayValue ?? "-"}
              </span>
            </Tooltip>
          );
        },
      },
      {
        id: "created_at",
        accessorKey: "created_at",
        meta: { title: "Criado Em" },
        header: ({ column }) => <DataTableSortHeader column={column} title="Criado Em" variant="header-cycle" />,
        size: 120,
        enableSorting: true,
        cell: (info) => <DateCell value={info.getValue() as string | null} precision="date" />,
      },
      {
        id: "created_by",
        accessorKey: "created_by",
        header: "Criado Por",
        size: 130,
        enableSorting: false,
        cell: (info) => {
          const userId = info.getValue() as string | null;
          if (!userId) return "-";
          const { created_by_user } = info.row.original;
          const userAlias = created_by_user?.user_alias ?? null;
          const userEmail = created_by_user?.user_email ?? null;
          const isDefaultAdmin = userId === "default_user_id";
          const displayValue = userAlias || userEmail || userId;
          const width = info.cell.column.getSize();

          const popoverContent = (
            <div className="flex flex-col gap-2 text-xs min-w-[200px] max-w-[300px]">
              {[
                { label: "User Alias", value: userAlias },
                { label: "User Email", value: userEmail },
                { label: "User ID", value: userId },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col min-w-0">
                  <span className="text-gray-400">{label}</span>
                  {value ? (
                    <Typography.Text className="font-mono text-xs" ellipsis={{ tooltip: value }} copyable>
                      {value}
                    </Typography.Text>
                  ) : (
                    <span className="font-mono">-</span>
                  )}
                </div>
              ))}
            </div>
          );

          if (isDefaultAdmin && !userAlias && !userEmail) {
            return (
              <Popover content={popoverContent} trigger="hover" placement="bottomLeft">
                <span className="cursor-default">
                  <DefaultProxyAdminTag userId={userId} />
                </span>
              </Popover>
            );
          }

          return (
            <Popover content={popoverContent} trigger="hover" placement="bottomLeft">
              <span
                className="font-mono text-xs truncate block cursor-default"
                style={{ maxWidth: width, overflow: "hidden" }}
              >
                {displayValue}
              </span>
            </Popover>
          );
        },
      },
      {
        id: "updated_at",
        accessorKey: "updated_at",
        meta: { title: "Atualizado Em" },
        header: ({ column }) => <DataTableSortHeader column={column} title="Atualizado Em" variant="header-cycle" />,
        size: 120,
        enableSorting: true,
        cell: (info) => <DateCell value={info.getValue() as string | null} precision="date" fallback="Never" />,
      },
      {
        id: "last_active",
        accessorKey: "last_active",
        header: "Última Atividade",
        size: 130,
        enableSorting: false,
        cell: (info) => <DateCell value={info.getValue() as string | null} precision="date" fallback="Unknown" />,
      },
      {
        id: "expires",
        accessorKey: "expires",
        header: "Expira",
        size: 120,
        enableSorting: false,
        cell: (info) => <DateCell value={info.getValue() as string | null} precision="date" fallback="Never" />,
      },
      {
        id: "spend",
        accessorKey: "spend",
        meta: { title: "Gasto (USD)" },
        header: ({ column }) => <DataTableSortHeader column={column} title="Gasto (USD)" variant="header-cycle" />,
        size: 100,
        enableSorting: true,
        cell: (info) => <MoneyCell value={info.getValue() as number | null} decimals={4} />,
      },
      {
        id: "max_budget",
        accessorKey: "max_budget",
        meta: { title: "Orçamento (USD)" },
        header: ({ column }) => <DataTableSortHeader column={column} title="Orçamento (USD)" variant="header-cycle" />,
        size: 110,
        enableSorting: true,
        cell: (info) => (
          <MoneyCell value={info.getValue() as number | null} decimals={0} emptyText="Unlimited" showZero />
        ),
      },
      {
        id: "budget_reset_at",
        accessorKey: "budget_reset_at",
        header: "Reinicialização do Orçamento",
        size: 130,
        enableSorting: false,
        cell: (info) => <DateCell value={info.getValue() as string | null} fallback="Never" />,
      },
      {
        id: "models",
        accessorKey: "models",
        header: "Modelos",
        size: 200,
        enableSorting: false,
        cell: (info) => {
          const models = info.getValue() as string[];
          const scope = deriveKeyModelScope(info.row.original.allowed_routes, info.row.original.key_type);
          const emptyModelsBadge = !scope.hasModelAccess ? (
            <Tooltip title={`Scoped to ${scope.label} routes; this key cannot call any models`}>
              <Badge size="xs" className="mb-1" color="gray">
                <Text>Sem acesso ao modelo</Text>
              </Badge>
            </Tooltip>
          ) : (
            <Badge size="xs" className="mb-1" color="red">
              <Text>Todos os Modelos do Proxy</Text>
            </Badge>
          );
          return (
            <div className="flex flex-col py-2">
              {Array.isArray(models) ? (
                <div className="flex flex-col">
                  {models.length === 0 ? (
                    emptyModelsBadge
                  ) : (
                    <>
                      <div className="flex items-start">
                        {models.length > 3 && (
                          <div>
                            <Icon
                              icon={expandedAccordions[info.row.id] ? ChevronDownIcon : ChevronRightIcon}
                              className="cursor-pointer"
                              size="xs"
                              onClick={() =>
                                setExpandedAccordions((prev) => ({
                                  ...prev,
                                  [info.row.id]: !prev[info.row.id],
                                }))
                              }
                            />
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {models.slice(0, 3).map((model, index) =>
                            model === "all-proxy-models" ? (
                              <Badge key={index} size="xs" color="red">
                                <Text>All Proxy Models</Text>
                              </Badge>
                            ) : (
                              <Badge key={index} size="xs" color="blue">
                                <Text>
                                  {model.length > 30
                                    ? `${getModelDisplayName(model).slice(0, 30)}...`
                                    : getModelDisplayName(model)}
                                </Text>
                              </Badge>
                            ),
                          )}
                          {models.length > 3 && !expandedAccordions[info.row.id] && (
                            <Badge size="xs" color="gray" className="cursor-pointer">
                              <Text>
                                +{models.length - 3} {models.length - 3 === 1 ? "more model" : "more models"}
                              </Text>
                            </Badge>
                          )}
                          {expandedAccordions[info.row.id] && (
                            <div className="flex flex-wrap gap-1">
                              {models.slice(3).map((model, index) =>
                                model === "all-proxy-models" ? (
                                  <Badge key={index + 3} size="xs" color="red">
                                    <Text>All Proxy Models</Text>
                                  </Badge>
                                ) : (
                                  <Badge key={index + 3} size="xs" color="blue">
                                    <Text>
                                      {model.length > 30
                                        ? `${getModelDisplayName(model).slice(0, 30)}...`
                                        : getModelDisplayName(model)}
                                    </Text>
                                  </Badge>
                                ),
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "rate_limits",
        header: "Limites de Taxa",
        size: 140,
        enableSorting: false,
        cell: ({ row }) => {
          const key = row.original;
          return (
            <div>
              <div>TPM: {key.tpm_limit !== null ? key.tpm_limit : "Ilimitado"}</div>
              <div>RPM: {key.rpm_limit !== null ? key.rpm_limit : "Ilimitado"}</div>
            </div>
          );
        },
      },
    ],
    [expandedAccordions],
  );

  const handleSortingChange = useCallback((updaterOrValue: React.SetStateAction<SortingState>) => {
    setSorting(updaterOrValue);
    setTablePagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  return (
    <div className="w-full h-full overflow-hidden">
      {selectedKey ? (
        <KeyInfoView
          keyId={selectedKey.token}
          onClose={() => setSelectedKey(null)}
          keyData={selectedKey}
          teams={[currentTeam]}
          onDelete={refetch}
        />
      ) : (
        <div className="py-4 flex-1 overflow-hidden">
          <DataTable
            data={displayKeys}
            columns={columns}
            sortingMode="server"
            sorting={sorting}
            onSortingChange={handleSortingChange}
            paginationMode="server"
            pagination={tablePagination}
            onPaginationChange={setTablePagination}
            rowCount={rowCount}
            filterMode="server"
            columnFilters={columnFilters}
            onColumnFiltersChange={handleColumnFiltersChange}
            enableColumnResizing
            columnResizeMode="onChange"
            isLoading={isLoading || isFetching}
            loadingMessage="Carregando chaves..."
            maxBodyHeight="75vh"
            size="compact"
            toolbar={(table) => (
              <>
                <DataTableToolbar
                  table={table}
                  searchValue={searchInput}
                  onSearchChange={handleSearchChange}
                  searchPlaceholder="Pesquisar pelo apelido da chave…"
                  onRefresh={() => refetch?.()}
                  isRefreshing={isFetching}
                  onOpenFilters={() => setFiltersOpen(true)}
                  filterLabels={{ user_id: "ID do Usuário" }}
                />
                <DataTableFilterDrawer
                  table={table}
                  open={filtersOpen}
                  onOpenChange={setFiltersOpen}
                  title="Filtros"
                  description={`Reduzir as chaves para ${teamAlias ?? "esta equipe"}`}
                >
                  {({ get, set }) => (
                    <DataTableFilterField label="ID do Usuário">
                      <Input
                        value={(get("user_id") as string) ?? ""}
                        onChange={(event) => set("user_id", event.target.value)}
                        placeholder="Filtrar pelo ID do usuário…"
                      />
                    </DataTableFilterField>
                  )}
                </DataTableFilterDrawer>
              </>
            )}
          />
        </div>
      )}
    </div>
  );
}
