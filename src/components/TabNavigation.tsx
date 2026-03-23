import {
  Kanban,
  BookOpen,
  StickyNote,
  CalendarDays,
  CircleDot,
  Settings2,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  LucideIcon,
} from "lucide-react";
import { useWorkspaceStore, type NavTabId } from "@/store/workspaceStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const tabMeta: Record<NavTabId, { label: string; icon: LucideIcon }> = {
  board: { label: "Kanban", icon: Kanban },
  wiki: { label: "Wiki", icon: BookOpen },
  memo: { label: "Memo", icon: StickyNote },
  issues: { label: "Issues", icon: CircleDot },
  calendar: { label: "Calendar", icon: CalendarDays },
};

export function TabNavigation() {
  const { activeTab, setActiveTab, tabOrder, moveTab, resetTabOrder } =
    useWorkspaceStore();

  return (
    <div className="border-b border-border bg-background">
      <div className="flex items-center px-6 gap-1">
        {tabOrder.map((tabId) => {
          const meta = tabMeta[tabId];
          const Icon = meta.icon;
          const resolvedTabId = tabId === "board" ? "kanban" : tabId;
          const isActive = activeTab === resolvedTabId;

          return (
            <Button
              key={tabId}
              onClick={() => setActiveTab(resolvedTabId)}
              className={cn(
                "h-auto gap-2 px-4 py-2.5",
                isActive && "text-primary border-primary",
              )}
              variant="tab"
              size="sm"
            >
              <Icon className="w-4 h-4" />
              <span>{meta.label}</span>
            </Button>
          );
        })}

        <div className="ml-auto">
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <Settings2 className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Customize tab order</p>
              </TooltipContent>
            </Tooltip>

            <PopoverContent align="end" className="w-56 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">
                  Tab Order
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      onClick={resetTabOrder}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Reset to default</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="space-y-1">
                {tabOrder.map((tabId, idx) => {
                  const meta = tabMeta[tabId];
                  const Icon = meta.icon;
                  const isFirst = idx === 0;
                  const isLast = idx === tabOrder.length - 1;

                  return (
                    <div
                      key={tabId}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                    >
                      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="flex-1 text-foreground">
                        {meta.label}
                      </span>
                      <div className="flex items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground disabled:opacity-30"
                          disabled={isFirst}
                          onClick={() => moveTab(tabId, "up")}
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground disabled:opacity-30"
                          disabled={isLast}
                          onClick={() => moveTab(tabId, "down")}
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
