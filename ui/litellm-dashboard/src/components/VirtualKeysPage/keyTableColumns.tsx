"use client";

import { InfoCircleOutlined } from "@ant-design/icons";
import { ColumnDef } from "@tanstack/react-table";
import { Popover, Typography } from "antd";
import type { TFunction } from "i18next";

import { DataTableMultiSortHeader, DataTableSortHeader, type DataTableSortField } from "@/components/shared/DataTable";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DateCell,
  IdCell,
  IdentityCell,
  ModelsCell,
  SpendBudgetCell,
  StatusBadge,
  type StatusTone,
} from "@/components/shared/table_cells";

import DefaultProxyAdminTag from "../common_components/DefaultProxyAdminTag";
import { KeyResponse, Team } from "../key_team_helpers/key_list";
import { Organization } from "../networking";

interface KeyStatus {
  tone: StatusTone;
  label: string;
  tooltip?: string;
}

const getSpendBudgetSortFields = (t: TFunction): DataTableSortField[] => [
  { id: "spend", label: t("virtualKeysTable.spend") },
  { id: "max_budget", label: t("virtualKeysTable.budget") },
];

const getKeyStatus = (key: KeyResponse, t: TFunction): KeyStatus => {
  if (key.blocked === true) {
    const isScimBlocked = (key.metadata as Record<string, unknown> | null | undefined)?.scim_blocked === true;
    return {
      tone: "error",
      label: t("virtualKeysTable.status.blocked"),
      tooltip: isScimBlocked
        ? t("virtualKeysTable.status.blockedByScimTooltip")
        : t("virtualKeysTable.status.blockedTooltip"),
    };
  }
  const expiresAt = key.expires ? Date.parse(key.expires) : Number.NaN;
  if (!Number.isNaN(expiresAt) && expiresAt < Date.now()) {
    return {
      tone: "warning",
      label: t("virtualKeysTable.status.expired"),
      tooltip: t("virtualKeysTable.status.expiredTooltip"),
    };
  }
  return { tone: "success", label: t("virtualKeysTable.status.active") };
};

const UserPopoverCell = ({
  userAlias,
  userEmail,
  userId,
  width,
  t,
}: {
  userAlias: string | null;
  userEmail: string | null;
  userId: string | null;
  width: number;
  t: TFunction;
}) => {
  const displayValue = userAlias || userEmail || userId;
  const isDefaultAdmin = userId === "default_user_id";

  const popoverContent = (
    <div className="flex flex-col gap-2 text-xs min-w-[200px] max-w-[300px]">
      {[
        { label: t("virtualKeysTable.userAlias"), value: userAlias },
        { label: t("virtualKeysTable.userEmail"), value: userEmail },
        { label: t("virtualKeysTable.userId"), value: userId },
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
      <span className="font-mono text-xs truncate block cursor-default" style={{ maxWidth: width, overflow: "hidden" }}>
        {displayValue || "-"}
      </span>
    </Popover>
  );
};

const InfoHeader = ({ label, tooltip }: { label: string; tooltip: string }) => (
  <span className="flex items-center gap-1">
    {label}
    <Popover content={tooltip} trigger="hover">
      <InfoCircleOutlined className="text-gray-400 text-xs cursor-help" />
    </Popover>
  </span>
);

interface KeyTableColumnsDeps {
  allTeams: Team[];
  organizations: Organization[];
  onSelectKey: (key: KeyResponse) => void;
  t: TFunction;
}

export const getKeyTableColumns = ({
  allTeams,
  organizations,
  onSelectKey,
  t,
}: KeyTableColumnsDeps): ColumnDef<KeyResponse>[] => [
  {
    id: "key_alias",
    accessorKey: "key_alias",
    meta: {
      title: t("virtualKeysTable.columns.key"),
      renderSkeleton: () => (
        <div className="flex flex-col gap-1 py-1">
          <Skeleton className="h-4 w-32" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      ),
    },
    header: ({ column }) => (
      <DataTableSortHeader column={column} title={t("virtualKeysTable.columns.key")} variant="header-cycle" />
    ),
    size: 260,
    enableSorting: true,
    cell: ({ row }) => {
      const status = getKeyStatus(row.original, t);
      return (
        <IdentityCell
          title={row.original.key_alias || "-"}
          subtitle={row.original.key_name}
          badge={
            <StatusBadge
              tone={status.tone}
              label={status.label}
              tooltip={status.tooltip}
              dataTestId={`key-status-${row.original.token_id}`}
            />
          }
          onClick={() => onSelectKey(row.original)}
        />
      );
    },
  },
  {
    id: "token",
    accessorKey: "token",
    meta: { title: t("virtualKeysTable.columns.keyId") },
    header: ({ column }) => (
      <DataTableSortHeader column={column} title={t("virtualKeysTable.columns.keyId")} variant="header-cycle" />
    ),
    size: 120,
    enableSorting: true,
    cell: (info) => <IdCell value={info.getValue() as string | null} onClick={() => onSelectKey(info.row.original)} />,
  },
  {
    id: "team_alias",
    accessorKey: "team_id",
    meta: { title: t("virtualKeysTable.columns.team") },
    header: t("virtualKeysTable.columns.team"),
    size: 120,
    enableSorting: false,
    cell: (info) => {
      const teamId = info.getValue() as string | null;
      if (!teamId) return "-";
      const team = allTeams.find((team) => team.team_id === teamId);
      const displayValue = team?.team_alias || teamId;
      const width = info.cell.column.getSize();
      return (
        <span className="font-mono text-xs truncate block" style={{ maxWidth: width, overflow: "hidden" }}>
          {displayValue}
        </span>
      );
    },
  },
  {
    id: "organization_alias",
    accessorKey: "org_id",
    meta: { title: t("virtualKeysTable.columns.organization") },
    header: t("virtualKeysTable.columns.organization"),
    size: 140,
    enableSorting: false,
    cell: (info) => {
      const orgId = info.getValue() as string | null;
      if (!orgId) return "-";
      const org = organizations.find((o) => o.organization_id === orgId);
      const displayValue = org?.organization_alias || orgId;
      const width = info.cell.column.getSize();
      return (
        <span className="font-mono text-xs truncate block" style={{ maxWidth: width, overflow: "hidden" }}>
          {displayValue}
        </span>
      );
    },
  },
  {
    id: "user",
    accessorKey: "user",
    meta: { title: t("virtualKeysTable.columns.user") },
    header: () => (
      <InfoHeader label={t("virtualKeysTable.columns.user")} tooltip={t("virtualKeysTable.userTooltip")} />
    ),
    size: 160,
    enableSorting: false,
    cell: ({ row }) => {
      const key = row.original;
      return (
        <UserPopoverCell
          userAlias={key.user?.user_alias ?? null}
          userEmail={key.user?.user_email ?? key.user_email ?? null}
          userId={key.user_id ?? null}
          width={160}
          t={t}
        />
      );
    },
  },
  {
    id: "created_at",
    accessorKey: "created_at",
    meta: { title: t("virtualKeysTable.columns.createdAt") },
    header: ({ column }) => (
      <DataTableSortHeader column={column} title={t("virtualKeysTable.columns.createdAt")} variant="header-cycle" />
    ),
    size: 120,
    enableSorting: true,
    cell: (info) => <DateCell value={info.getValue() as string | null} precision="date" />,
  },
  {
    id: "created_by",
    accessorKey: "created_by",
    meta: { title: t("virtualKeysTable.columns.createdBy") },
    header: t("virtualKeysTable.columns.createdBy"),
    size: 160,
    enableSorting: false,
    cell: (info) => {
      const userId = info.getValue() as string | null;
      if (!userId) return "-";
      const createdByUser = info.row.original.created_by_user;
      return (
        <UserPopoverCell
          userAlias={createdByUser?.user_alias ?? null}
          userEmail={createdByUser?.user_email ?? null}
          userId={userId}
          width={160}
          t={t}
        />
      );
    },
  },
  {
    id: "updated_at",
    accessorKey: "updated_at",
    meta: { title: t("virtualKeysTable.columns.updatedAt") },
    header: ({ column }) => (
      <DataTableSortHeader column={column} title={t("virtualKeysTable.columns.updatedAt")} variant="header-cycle" />
    ),
    size: 120,
    enableSorting: true,
    cell: (info) => (
      <DateCell value={info.getValue() as string | null} precision="date" fallback={t("virtualKeysTable.never")} />
    ),
  },
  {
    id: "last_active",
    accessorKey: "last_active",
    meta: { title: t("virtualKeysTable.columns.lastActive") },
    header: () => (
      <InfoHeader
        label={t("virtualKeysTable.columns.lastActive")}
        tooltip={t("virtualKeysTable.lastActiveTooltip")}
      />
    ),
    size: 130,
    enableSorting: false,
    cell: (info) => (
      <DateCell
        value={info.getValue() as string | null}
        precision="date"
        fallback={t("virtualKeysTable.unknown")}
      />
    ),
  },
  {
    id: "expires",
    accessorKey: "expires",
    meta: { title: t("virtualKeysTable.columns.expires") },
    header: t("virtualKeysTable.columns.expires"),
    size: 120,
    enableSorting: false,
    cell: (info) => (
      <DateCell value={info.getValue() as string | null} precision="date" fallback={t("virtualKeysTable.never")} />
    ),
  },
  {
    id: "spend",
    accessorKey: "spend",
    meta: { title: t("virtualKeysTable.columns.spendBudget"), skeleton: "meter" },
    header: ({ table }) => <DataTableMultiSortHeader table={table} fields={getSpendBudgetSortFields(t)} />,
    size: 180,
    enableSorting: true,
    cell: ({ row }) => {
      const teamId = row.original.team_id;
      const team = allTeams.find((team) => team.team_id === teamId);
      return (
        <SpendBudgetCell
          spend={row.original.spend}
          maxBudget={row.original.max_budget}
          teamMaxBudget={team?.max_budget ?? null}
        />
      );
    },
  },
  {
    id: "budget_reset_at",
    accessorKey: "budget_reset_at",
    meta: { title: t("virtualKeysTable.columns.budgetReset") },
    header: t("virtualKeysTable.columns.budgetReset"),
    size: 130,
    enableSorting: false,
    cell: (info) => <DateCell value={info.getValue() as string | null} fallback={t("virtualKeysTable.never")} />,
  },
  {
    id: "models",
    accessorKey: "models",
    meta: { title: t("virtualKeysTable.columns.models"), skeleton: "chips" },
    header: t("virtualKeysTable.columns.models"),
    size: 220,
    enableSorting: false,
    cell: (info) => (
      <ModelsCell
        models={info.getValue() as string[] | null | undefined}
        allowedRoutes={info.row.original.allowed_routes}
        keyType={info.row.original.key_type}
      />
    ),
  },
  {
    id: "rate_limits",
    meta: { title: t("virtualKeysTable.columns.rateLimits") },
    header: t("virtualKeysTable.columns.rateLimits"),
    size: 140,
    enableSorting: false,
    cell: ({ row }) => {
      const key = row.original;
      return (
        <div className="text-xs">
          <div>TPM: {key.tpm_limit !== null ? key.tpm_limit : t("virtualKeysTable.unlimited")}</div>
          <div>RPM: {key.rpm_limit !== null ? key.rpm_limit : t("virtualKeysTable.unlimited")}</div>
        </div>
      );
    },
  },
];

export const KEY_TABLE_HIDDEN_COLUMNS: Record<string, boolean> = {
  token: false,
  organization_alias: false,
  created_by: false,
  updated_at: false,
  expires: false,
  budget_reset_at: false,
  rate_limits: false,
};
