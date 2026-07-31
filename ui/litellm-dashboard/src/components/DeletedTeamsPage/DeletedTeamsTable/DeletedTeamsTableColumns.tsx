"use client";

import { ColumnDef } from "@tanstack/react-table";

import { DataTableSortHeader } from "@/components/shared/DataTable";
import { DateCell, IdCell, ModelsCell, MoneyCell } from "@/components/shared/table_cells";
import { DeletedTeam } from "@/app/(dashboard)/hooks/teams/useTeams";

export const getDeletedTeamsTableColumns = (): ColumnDef<DeletedTeam>[] => [
  {
    id: "team_alias",
    accessorKey: "team_alias",
    meta: { title: "Nome da Equipe" },
    header: "Nome da Equipe",
    size: 150,
    enableSorting: false,
    cell: ({ row }) => {
      const value = row.original.team_alias;
      if (!value) {
        return <span className="text-muted-foreground">-</span>;
      }
      return (
        <span className="block max-w-60 truncate font-medium" title={value}>
          {value}
        </span>
      );
    },
  },
  {
    id: "team_id",
    accessorKey: "team_id",
    meta: { title: "ID da Equipe" },
    header: "ID da Equipe",
    size: 150,
    enableSorting: false,
    cell: ({ row }) => <IdCell value={row.original.team_id} variant="plain" />,
  },
  {
    id: "created_at",
    accessorKey: "created_at",
    meta: { title: "Criado" },
    header: ({ column }) => <DataTableSortHeader column={column} title="Criado" />,
    size: 120,
    enableSorting: true,
    cell: ({ row }) => <DateCell value={row.original.created_at} precision="date" />,
  },
  {
    id: "spend",
    accessorKey: "spend",
    meta: { title: "Gasto (USD)", numeric: true },
    header: ({ column }) => <DataTableSortHeader column={column} title="Gasto (USD)" />,
    size: 100,
    enableSorting: true,
    cell: ({ row }) => <MoneyCell value={row.original.spend} decimals={4} />,
  },
  {
    id: "max_budget",
    accessorKey: "max_budget",
    meta: { title: "Orçamento (USD)", numeric: true },
    header: "Orçamento (USD)",
    size: 110,
    enableSorting: false,
    cell: ({ row }) => <MoneyCell value={row.original.max_budget} decimals={0} emptyText="Ilimitado" showZero />,
  },
  {
    id: "models",
    accessorKey: "models",
    meta: { title: "Modelos", skeleton: "chips" },
    header: "Modelos",
    size: 200,
    enableSorting: false,
    cell: ({ row }) => <ModelsCell models={row.original.models} />,
  },
  {
    id: "organization_id",
    accessorKey: "organization_id",
    meta: { title: "Organização" },
    header: "Organização",
    size: 150,
    enableSorting: false,
    cell: ({ row }) => <IdCell value={row.original.organization_id} variant="plain" />,
  },
  {
    id: "deleted_at",
    accessorKey: "deleted_at",
    meta: { title: "Excluído Em" },
    header: ({ column }) => <DataTableSortHeader column={column} title="Excluído Em" />,
    size: 120,
    enableSorting: true,
    cell: ({ row }) => <DateCell value={row.original.deleted_at} precision="date" />,
  },
  {
    id: "deleted_by",
    accessorKey: "deleted_by",
    meta: { title: "Excluído Por" },
    header: "Excluído Por",
    size: 120,
    enableSorting: false,
    cell: ({ row }) => {
      const value = row.original.deleted_by;
      if (!value) {
        return <span className="text-muted-foreground">-</span>;
      }
      return (
        <span className="block max-w-60 truncate" title={value}>
          {value}
        </span>
      );
    },
  },
];
