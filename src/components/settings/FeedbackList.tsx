import { useEffect, useState } from "react";
import { Copy, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import type { FeedbackRecord } from "@/types/ipc";

const DEFAULT_LIMIT = 200;

const formatFeedbackDate = (timestamp: number) => {
  try {
    return format(new Date(timestamp), "yy.MM.dd");
  } catch {
    return "Invalid date";
  }
};

const copyToClipboard = async (value: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
};

export function FeedbackList() {
  const api = window.workspaceApi?.feedback ?? null;
  const [items, setItems] = useState<FeedbackRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string>("");

  const refresh = async () => {
    if (!api?.list) {
      setItems([]);
      setLoadError("Feedback service is unavailable.");
      return;
    }

    setIsLoading(true);
    setLoadError("");
    try {
      const result = await api.list({ limit: DEFAULT_LIMIT });
      if (result.ok === false) {
        setItems([]);
        setLoadError(result.error.message || "Failed to load feedback.");
        return;
      }
      setItems(result.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load feedback.";
      setItems([]);
      setLoadError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={cn("space-y-3")}>
      <div className={cn("flex items-center justify-between gap-3")}>
        <div className={cn("text-xs text-muted-foreground")}>
          {isLoading ? "Loading..." : `${items.length} saved`}
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => void refresh()}
          disabled={!api?.list || isLoading}
        >
          <RotateCcw className={cn("w-4 h-4 mr-2")} />
          Refresh
        </Button>
      </div>

      <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden")}>
        {loadError ? (
          <div className={cn("p-4 text-sm text-destructive")}>{loadError}</div>
        ) : items.length === 0 ? (
          <div className={cn("p-4 text-sm text-muted-foreground")}>
            No feedback yet. Use <span className={cn("font-medium text-foreground")}>Send Feedback</span> to save one.
          </div>
        ) : (
          <div className={cn("max-h-[40vh] overflow-y-auto scrollbar-thin divide-y divide-border")}>
            {items.map((item) => (
              <div key={item.id} className={cn("p-4 space-y-2")}>
                <div className={cn("flex items-start justify-between gap-3")}>
                  <span className={cn("text-xs text-muted-foreground font-mono")}>
                    {formatFeedbackDate(item.createdAt)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={cn("h-7 px-2 text-muted-foreground hover:text-foreground")}
                    onClick={() => {
                      void (async () => {
                        try {
                          await copyToClipboard(item.body);
                          toast({ title: "Copied", description: "Feedback copied to clipboard." });
                        } catch (error) {
                          const message =
                            error instanceof Error ? error.message : "Failed to copy.";
                          toast({
                            title: "Copy failed",
                            description: message,
                            variant: "destructive",
                          });
                        }
                      })();
                    }}
                  >
                    <Copy className={cn("w-4 h-4 mr-2")} />
                    Copy
                  </Button>
                </div>
                <div className={cn("text-sm text-foreground whitespace-pre-wrap break-words")}>
                  {item.body}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
