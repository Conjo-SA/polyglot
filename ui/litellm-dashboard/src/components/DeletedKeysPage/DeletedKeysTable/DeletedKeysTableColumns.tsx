"use client";

import { ColumnDef } from "@tanstack/react-table";

import { DataTableSortHeader } from "@/components/shared/DataTable";
import { DateCell, IdCell, MoneyCell } from "@/components/shared/table_cells";
import { DeletedKeyResponse } from "@/app/(dashboard)/hooks/keys/useKeys";

function TruncatedTextCell({ value }: { value: string | null | undefined }) {
  if (!value) {
    return <span className="text-muted-foreground">-</span>;
  }
  return (
    <span className="block max-w-60 truncate" title={value}>
      {value}
    </span>
  );
}

export const getDeletedKeysTableColumns = (): ColumnDef<DeletedKeyResponse>[] => [
  {
    id: "token",
    accessorKey: "token",
    meta: { title: "ID da Chave" },
    header: "ID da Chave",
    size: 150,
    enableSorting: false,
    cell: ({ row }) => <IdCell value={row.original.token} variant="plain" />,
  },
  {
    id: "key_alias",
    accessorKey: "key_alias",
    meta: { title: "Apelido da Chave" },
    header: "Apelido da Chave",
    size: 150,
    enableSorting: false,
    cell: ({ row }) => {
      const value = row.original.key_alias;
      if (!value) {
        return <span className="text-muted-foreground">-</span>;
      }
      return (
        <span className="block max-w-60 truncate font-mono text-xs" title={value}>
          {value}
        </span>
      );
    },
  },
  {
    id: "team_alias",
    accessorKey: "team_alias",
    meta: { title: "Apelido da Equipe" },
    header: "Apelido da Equipe",
    size: 120,
    enableSorting: false,
    cell: ({ row }) => <TruncatedTextCell value={row.original.team_alias} />,
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
    id: "user_email",
    accessorKey: "user_email",
    meta: { title: "Email do Usuário" },
    header: "Email do Usuário",
    size: 160,
    enableSorting: false,
    cell: ({ row }) => <TruncatedTextCell value={row.original.user_email} />,
  },
  {
    id: "user_id",
    accessorKey: "user_id",
    meta: { title: "ID do Usuário" },
    header: "ID do Usuário",
    size: 120,
    enableSorting: false,
    cell: ({ row }) => <IdCell value={row.original.user_id} variant="plain" />,
  },
  {
    id: "created_at",
    accessorKey: "created_at",
    meta: { title: "Criado Em" },
    header: ({ column }) => <DataTableSortHeader column={column} title="Criado Em" />,
    size: 120,
    enableSorting: true,
    cell: ({ row }) => <DateCell value={row.original.created_at} precision="date" />,
  },
  {
    id: "created_by",
    accessorKey: "created_by",
    meta: { title: "Criado Por" },
    header: "Criado Por",
    size: 120,
    enableSorting: false,
    cell: ({ row }) => <TruncatedTextCell value={row.original.created_by} />,
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
    cell: ({ row }) => <TruncatedTextCell value={row.original.deleted_by} />,
  },
];
