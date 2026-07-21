"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Copy, KeyRound, Layers, MoreHorizontal, Pencil, Trash2, Users } from "lucide-react";
import type { TFunction } from "i18next";

import { DataTableSortHeader } from "@/components/shared/DataTable";
import { DateCell, IdentityCell, SpendBudgetCell } from "@/components/shared/table_cells";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cva.config";
import { copyToClipboard, formatNumberWithCommas } from "@/utils/dataUtils";

import { Team } from "../key_team_helpers/key_list";
import { Organization } from "../networking";

interface ResourceTone {
  icon: typeof Users;
  className: string;
}

const RESOURCE_TONES: Record<"members" | "models" | "keys", ResourceTone> = {
  members: { icon: Users, className: "bg-violet-50 text-violet-700 ring-violet-600/20" },
  models: { icon: Layers, className: "bg-sky-50 text-sky-700 ring-sky-600/20" },
  keys: { icon: KeyRound, className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
};

const teamMemberCount = (team: Team): number => team.members_count ?? team.members_with_roles?.length ?? 0;
const teamModelCount = (team: Team): number => team.models?.length ?? 0;
const teamKeyCount = (team: Team): number => team.keys_count ?? team.keys?.length ?? 0;

function ResourcesCell({ team, t }: { team: Team; t: TFunction }) {
  const items = [
    { key: "members" as const, label: t("teamsTable.members"), count: teamMemberCount(team) },
    { key: "models" as const, label: t("teamsTable.models"), count: teamModelCount(team) },
    { key: "keys" as const, label: t("teamsTable.keys"), count: teamKeyCount(team) },
  ];

  return (
    <div className="flex items-center gap-1.5">
      {items.map((item) => {
        const tone = RESOURCE_TONES[item.key];
        const Icon = tone.icon;
        return (
          <span
            key={item.key}
            title={`${item.count} ${item.label}`}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset [&_svg]:size-3.5",
              tone.className,
            )}
          >
            <Icon />
            <span className="tabular-nums">{item.count}</span>
          </span>
        );
      })}
    </div>
  );
}

function RateLimitLine({ label, value, t }: { label: string; value: number | null; t: TFunction }) {
  return (
    <div>
      <span className="text-[10px] font-semibold text-muted-foreground">{label} </span>
      <span className="tabular-nums">{value != null ? formatNumberWithCommas(value) : t("virtualKeysTable.unlimited")}</span>
    </div>
  );
}

interface TeamRowActionsProps {
  team: Team;
  canManage: boolean;
  onEditTeam: (team: Team) => void;
  onDeleteTeam: (team: Team) => void;
  t: TFunction;
}

function TeamRowActions({ team, canManage, onEditTeam, onDeleteTeam, t }: TeamRowActionsProps) {
  const handleCopy = () => {
    void copyToClipboard(team.team_id, t("teamsTable.teamIdCopied"));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("teamsTable.openTeamActions")}
        data-testid={`team-actions-${team.team_id}`}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-muted-foreground")}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {canManage && (
          <DropdownMenuItem onClick={() => onEditTeam(team)} data-testid="team-action-edit">
            <Pencil />
            {t("teamsTable.editTeam")}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleCopy} data-testid="team-action-copy">
          <Copy />
          {t("teamsTable.copyTeamId")}
        </DropdownMenuItem>
        {canManage && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => onDeleteTeam(team)} data-testid="team-action-delete">
              <Trash2 />
              {t("teamsTable.deleteTeam")}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface TeamTableColumnsDeps {
  organizations: Organization[];
  userRole: string | null;
  onSelectTeam: (team: Team) => void;
  onEditTeam: (team: Team) => void;
  onDeleteTeam: (team: Team) => void;
  t: TFunction;
}

export const getTeamTableColumns = ({
  organizations,
  userRole,
  onSelectTeam,
  onEditTeam,
  onDeleteTeam,
  t,
}: TeamTableColumnsDeps): ColumnDef<Team>[] => {
  const canManage = userRole === "Admin";

  return [
    {
      id: "team_alias",
      accessorKey: "team_alias",
      meta: {
        title: t("teamsTable.team"),
        renderSkeleton: () => (
          <div className="flex flex-col gap-2 py-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3.5 w-24 opacity-65" />
          </div>
        ),
      },
      header: ({ column }) => <DataTableSortHeader column={column} title={t("teamsTable.team")} variant="header-cycle" />,
      size: 260,
      enableSorting: true,
      cell: ({ row }) => {
        const team = row.original;
        const hasAlias = Boolean(team.team_alias);
        return (
          <IdentityCell
            title={team.team_alias || team.team_id}
            subtitle={hasAlias ? team.team_id : undefined}
            onClick={() => onSelectTeam(team)}
          />
        );
      },
    },
    {
      id: "organization_alias",
      accessorKey: "organization_id",
      meta: { title: t("teamsTable.organization") },
      header: t("teamsTable.organization"),
      size: 160,
      enableSorting: false,
      cell: (info) => {
        const orgId = info.getValue() as string | null;
        if (!orgId) return <span className="text-muted-foreground">—</span>;
        const org = organizations.find((o) => o.organization_id === orgId);
        const displayValue = org?.organization_alias || orgId;
        const width = info.cell.column.getSize();
        return (
          <span className="block truncate text-sm" style={{ maxWidth: width }} title={displayValue}>
            {displayValue}
          </span>
        );
      },
    },
    {
      id: "resources",
      meta: {
        title: t("teamsTable.resources"),
        renderSkeleton: () => (
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-6 w-12 rounded-md" />
            <Skeleton className="h-6 w-12 rounded-md" />
            <Skeleton className="h-6 w-12 rounded-md opacity-65" />
          </div>
        ),
      },
      header: t("teamsTable.resources"),
      size: 210,
      enableSorting: false,
      cell: ({ row }) => <ResourcesCell team={row.original} t={t} />,
    },
    {
      id: "spend",
      accessorKey: "spend",
      meta: { title: t("teamsTable.spendBudget"), skeleton: "meter" },
      header: t("teamsTable.spendBudget"),
      size: 200,
      enableSorting: false,
      cell: ({ row }) => <SpendBudgetCell spend={row.original.spend} maxBudget={row.original.max_budget} />,
    },
    {
      id: "created_at",
      accessorKey: "created_at",
      meta: { title: t("teamsTable.created") },
      header: ({ column }) => <DataTableSortHeader column={column} title={t("teamsTable.created")} variant="header-cycle" />,
      size: 130,
      enableSorting: true,
      cell: (info) => <DateCell value={info.getValue() as string | null} precision="date" />,
    },
    {
      id: "members",
      meta: { title: t("teamsTable.members") },
      header: t("teamsTable.members"),
      size: 110,
      enableSorting: false,
      cell: ({ row }) => <span className="text-sm tabular-nums">{teamMemberCount(row.original)}</span>,
    },
    {
      id: "models",
      meta: { title: t("teamsTable.models") },
      header: t("teamsTable.models"),
      size: 100,
      enableSorting: false,
      cell: ({ row }) => <span className="text-sm tabular-nums">{teamModelCount(row.original)}</span>,
    },
    {
      id: "rate_limits",
      meta: { title: t("teamsTable.rateLimits"), skeleton: "twoLine" },
      header: t("teamsTable.rateLimits"),
      size: 140,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="text-xs leading-tight">
          <RateLimitLine label="TPM" value={row.original.tpm_limit} t={t} />
          <RateLimitLine label="RPM" value={row.original.rpm_limit} t={t} />
        </div>
      ),
    },
    {
      id: "updated_at",
      accessorKey: "updated_at",
      meta: { title: t("teamsTable.updated") },
      header: t("teamsTable.updated"),
      size: 130,
      enableSorting: false,
      cell: (info) => (
        <DateCell value={info.getValue() as string | null} precision="date" fallback={t("virtualKeysTable.never")} />
      ),
    },
    {
      id: "actions",
      meta: { className: "text-right", headerClassName: "text-right" },
      header: () => <span className="sr-only">{t("teamsTable.actions")}</span>,
      size: 60,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <TeamRowActions
            team={row.original}
            canManage={canManage}
            onEditTeam={onEditTeam}
            onDeleteTeam={onDeleteTeam}
            t={t}
          />
        </div>
      ),
    },
  ];
};

export const TEAM_TABLE_HIDDEN_COLUMNS: Record<string, boolean> = {
  members: false,
  models: false,
  rate_limits: false,
  updated_at: false,
};
