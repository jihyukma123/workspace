import { useEffect, useMemo, useState } from "react";
import { Trash2, RotateCcw, AlertTriangle } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppInput } from "@/components/ui/app-input";
import { Button, buttonVariants } from "@/components/ui/button";
import { RelativeTime } from "@/components/ui/relative-time";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { TrashItemRecord, TrashItemType } from "@/types/ipc";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const DAY_MS = 24 * 60 * 60 * 1000;
const TRASH_RETENTION_MS = 30 * DAY_MS;

const typeLabels: Record<TrashItemType, string> = {
  wiki: "Wiki",
  memo: "Memo",
  issue: "Issue",
};

type TrashFilterType = TrashItemType | "all";

const filterLabels: Record<TrashFilterType, string> = {
  all: "All",
  wiki: "Wiki",
  memo: "Memo",
  issue: "Issue",
};

const pluralLabel = (value: number, singular: string, plural: string) =>
  value === 1 ? singular : plural;

export default function Trash() {
  const { selectedProjectId, setSelectedProject } = useWorkspaceStore();
  const [type, setType] = useState<TrashFilterType>("all");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<TrashItemRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPurging, setIsPurging] = useState(false);

  const api = window.workspaceApi?.trash ?? null;

  const trimmedQuery = useMemo(() => query.trim(), [query]);

  const refresh = async () => {
    if (!api || !selectedProjectId) {
      setItems([]);
      return;
    }

    setIsLoading(true);
    const result = await api.list({
      projectId: selectedProjectId,
      type: type === "all" ? undefined : type,
      query: trimmedQuery.length ? trimmedQuery : undefined,
    });
    setIsLoading(false);

    if (result.ok === false) {
      setItems([]);
      toast({
        title: "Failed to load Trash",
        description: result.error.message,
        variant: "destructive",
      });
      return;
    }
    setItems(result.data);
  };

  useEffect(() => {
    if (!selectedProjectId) {
      setItems([]);
      return;
    }
    const timeout = window.setTimeout(() => {
      void refresh();
    }, 200);
    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId, type, trimmedQuery]);

  const handleRestore = async (item: TrashItemRecord) => {
    if (!api) return;
    const result = await api.restore({ type: item.type, id: item.id });
    if (result.ok === false) {
      toast({
        title: "Restore failed",
        description: result.error.message,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Restored",
      description: `${typeLabels[item.type]} restored.`,
    });
    if (selectedProjectId) {
      await setSelectedProject(selectedProjectId);
    }
    await refresh();
  };

  const handleDeletePermanent = async (item: TrashItemRecord) => {
    if (!api) return;
    const result = await api.deletePermanent({ type: item.type, id: item.id });
    if (result.ok === false) {
      toast({
        title: "Delete failed",
        description: result.error.message,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Deleted permanently",
      description: `${typeLabels[item.type]} removed.`,
    });
    await refresh();
  };

  const handlePurgeExpired = async () => {
    if (!api || isPurging) return;
    setIsPurging(true);
    try {
      const result = await api.emptyExpired({
        olderThan: Date.now() - TRASH_RETENTION_MS,
      });
      if (result.ok === false) {
        toast({
          title: "Purge failed",
          description: result.error.message,
          variant: "destructive",
        });
        return;
      }
      const { memoDeleted, issueDeleted, wikiDeleted } = result.data;
      const total = memoDeleted + issueDeleted + wikiDeleted;
      toast({
        title: "Expired items removed",
        description:
          total === 0
            ? "No expired items found."
            : `${total} ${pluralLabel(total, "item", "items")} removed.`,
      });
      await refresh();
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <MainLayout>
      <div className={cn("flex flex-1 min-h-0 flex-col")}>
        <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-background">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-mono text-lg font-bold text-primary">
                Trash
              </h1>
              <p className="text-xs text-muted-foreground">
                Deleted items are kept for 30 days.
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handlePurgeExpired}
            disabled={!selectedProjectId || !api || isPurging}
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Purge expired
          </Button>
        </header>

        {!selectedProjectId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="rounded-lg border bg-card text-card-foreground p-10 text-center max-w-sm">
              <h3 className="font-mono text-lg font-bold text-primary">
                Select a project
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                Choose a project in the top bar to manage its Trash.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Tabs
                value={type}
                onValueChange={(value) => setType(value as TrashFilterType)}
              >
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="wiki">Wiki</TabsTrigger>
                  <TabsTrigger value="memo">Memo</TabsTrigger>
                  <TabsTrigger value="issue">Issue</TabsTrigger>
                </TabsList>
              </Tabs>
              <AppInput
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search deleted items..."
                className="max-w-sm"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void refresh()}
                disabled={!api || isLoading}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>

            <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <span className="font-mono text-sm text-foreground">
                  {filterLabels[type]}
                </span>
                <span className="text-xs text-muted-foreground">
                  {isLoading ? "Loading..." : `${items.length} items`}
                </span>
              </div>
              <div className="max-h-[70vh] overflow-y-auto scrollbar-thin">
                {items.length === 0 ? (
                  <div className="p-6 text-sm text-muted-foreground">
                    No deleted items found.
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {items.map((item) => {
                      const deletedDate = new Date(item.deletedAt);
                      const wikiCount =
                        item.type === "wiki"
                          ? (item.meta?.descendantCount ?? 0)
                          : 0;
                      return (
                        <div
                          key={`${item.type}:${item.id}`}
                          className={cn(
                            "flex items-center justify-between gap-4 px-4 py-3",
                            "hover:bg-muted/30 transition-all duration-200",
                          )}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm text-foreground truncate">
                                {item.title || "Untitled"}
                              </span>
                              {item.type === "wiki" && wikiCount > 0 && (
                                <span className="text-[10px] text-muted-foreground rounded-full bg-muted px-2 py-0.5 font-mono">
                                  {wikiCount}{" "}
                                  {pluralLabel(wikiCount, "subpage", "subpages")}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Deleted <RelativeTime date={deletedDate} />
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => void handleRestore(item)}
                              disabled={!api}
                            >
                              Restore
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  aria-label="Delete permanently"
                                  title="Delete permanently"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-popover border-border">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Permanently delete this item?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This cannot be undone. The item will be
                                    removed from your database.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      void handleDeletePermanent(item)
                                    }
                                    className={buttonVariants({
                                      variant: "destructive",
                                    })}
                                  >
                                    Delete permanently
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
