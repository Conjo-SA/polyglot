"use client";

import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { getBreadcrumb } from "@/components/leftnav";
import { BlogDropdown } from "@/components/Navbar/BlogDropdown/BlogDropdown";
import { CommunityEngagementButtons } from "@/components/Navbar/CommunityEngagementButtons/CommunityEngagementButtons";
import { NotificationsBell } from "@/components/Navbar/NotificationsBell/NotificationsBell";
import ViewSwitcher from "@/components/Navbar/ViewSwitcher";
import WorkerDropdown from "@/components/Navbar/WorkerDropdown/WorkerDropdown";
import { useWorker } from "@/hooks/useWorker";
import { useDisableShowPrompts } from "@/app/(dashboard)/hooks/useDisableShowPrompts";
import { clearTokenCookies } from "@/utils/cookieUtils";
import { clearStoredReturnUrl, getLoginUrl } from "@/utils/returnUrlUtils";
import { useTranslation } from "react-i18next";
import { useCurrency } from "@/contexts/CurrencyContext";

interface DashboardHeaderProps {
  page: string;
}

// Top bar for the dashboard shell. Sits only over the content column (the brand
// lives in the sidebar header); mirrors the design's breadcrumb-left / tools-right layout.
export function DashboardHeader({ page }: DashboardHeaderProps) {
  const { t } = useTranslation();
  const { title } = getBreadcrumb(page, t);
  const { isControlPlane, selectedWorker } = useWorker();
  const showWorkerSwitch = isControlPlane && selectedWorker !== null;
  const hideCommunityLinks = useDisableShowPrompts();
  const { currency, setCurrency } = useCurrency();

  const handleWorkerSwitch = (workerId: string) => {
    clearTokenCookies();
    clearStoredReturnUrl();
    localStorage.removeItem("litellm_selected_worker_id");
    localStorage.removeItem("litellm_worker_url");
    window.location.href = `${getLoginUrl()}?worker=${encodeURIComponent(workerId)}`;
  };

  return (
    <header className="flex h-14 flex-none items-center justify-between gap-4 border-b border-border bg-background px-4">
      <Breadcrumb className="min-w-0">
        <BreadcrumbList className="flex-nowrap">
          <BreadcrumbItem className="flex-none">
            <ViewSwitcher />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem className="min-w-0">
            <BreadcrumbPage className="truncate">{title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-none items-center gap-1">
        {showWorkerSwitch && (
          <>
            <WorkerDropdown onWorkerSwitch={handleWorkerSwitch} />
            <Separator orientation="vertical" className="mx-1.5 h-5" />
          </>
        )}
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<a href="https://docs.litellm.ai/docs/" target="_blank" rel="noopener noreferrer" />}
          className="text-muted-foreground"
        >
          {t("common.docs")}
        </Button>
        <BlogDropdown />
        {!hideCommunityLinks && <CommunityEngagementButtons />}
        <Separator orientation="vertical" className="mx-1.5 h-5" />
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">USD</span>
          <button
            onClick={() => {
              if (setCurrency) {
                const newCurrency = currency === 'USD' ? 'BRL' : 'USD';
                setCurrency(newCurrency);
              }
            }}
            className="relative rounded-full w-10 h-5 bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200 ${
                currency === 'BRL' ? 'left-5' : 'left-0.5'
              }`}
            />
          </button>
          <span className="text-sm text-muted-foreground">BRL</span>
        </div>
        <Separator orientation="vertical" className="mx-1.5 h-5" />
        <NotificationsBell />
      </div>
    </header>
  );
}

export default DashboardHeader;
