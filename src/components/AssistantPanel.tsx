import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { MessageSquare, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/store/workspaceStore";

type AssistantMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

interface AssistantPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function createMessage(role: AssistantMessage["role"], content: string): AssistantMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
  };
}

function getErrorMessage(details: unknown) {
  if (
    details &&
    typeof details === "object" &&
    "message" in details &&
    typeof (details as { message?: unknown }).message === "string"
  ) {
    return (details as { message: string }).message;
  }

  return null;
}

export function AssistantPanel({ open, onOpenChange }: AssistantPanelProps) {
  const { selectedProjectId, projects } = useWorkspaceStore();
  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );
  const [input, setInput] = useState("");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMessages([]);
    setThreadId(null);
    setInput("");
  }, [selectedProjectId]);

  useEffect(() => {
    const viewport = scrollViewportRef.current;
    if (!viewport) {
      return;
    }

    viewport.scrollTop = viewport.scrollHeight;
  }, [messages]);

  const submitMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || !selectedProjectId || isSubmitting) {
      return;
    }

    const userMessage = createMessage("user", trimmed);
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsSubmitting(true);

    try {
      const result = await window.workspaceApi.assistant.chatWeeklySummary({
        projectId: selectedProjectId,
        prompt: trimmed,
        threadId: threadId ?? undefined,
      });

      if (result.ok === false) {
        throw new Error(
          getErrorMessage(result.error.details) ??
            result.error.message ??
            "Assistant request failed.",
        );
      }

      setThreadId(result.data.threadId);
      setMessages((current) => [
        ...current,
        createMessage("assistant", result.data.response),
      ]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Assistant request failed.";
      toast({
        title: "Assistant error",
        description: message,
        variant: "destructive",
      });
      setMessages((current) => [
        ...current,
        createMessage(
          "assistant",
          `요청을 처리하지 못했습니다.\n\n${message}`,
        ),
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submitMessage();
  };

  const handleInputKeyDown = async (
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();
    await submitMessage();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn("flex h-full w-full flex-col gap-0 p-0 sm:max-w-xl")}
      >
        <SheetHeader className={cn("border-b border-border px-6 py-5")}>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/12 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <SheetTitle className={cn("font-mono text-lg text-primary")}>
                Workspace Assistant
              </SheetTitle>
              <SheetDescription>
                이번 주 Daily log 요약 프리뷰
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="border-b border-border px-6 py-3 text-sm text-muted-foreground">
          {selectedProject
            ? `${selectedProject.name} 프로젝트의 이번 주 Daily log만 읽을 수 있습니다.`
            : "프로젝트를 먼저 선택하면 이번 주 Daily log 요약을 요청할 수 있습니다."}
        </div>

        <ScrollArea className="flex-1" viewportRef={scrollViewportRef}>
          <div className="space-y-4 px-6 py-5">
            {messages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-5">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  추천 요청
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  이번 주 Daily log 쭉 정리해줘
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm",
                    message.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "border border-border bg-card text-card-foreground",
                  )}
                >
                  <div className="mb-1 text-[11px] uppercase tracking-[0.2em] opacity-70">
                    {message.role === "user" ? "You" : "Assistant"}
                  </div>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <form
          onSubmit={handleSubmit}
          className="border-t border-border bg-background px-6 py-5"
        >
          <div className="space-y-3">
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => void handleInputKeyDown(event)}
              placeholder="예: 이번 주 Daily log 쭉 정리해줘"
              disabled={!selectedProjectId || isSubmitting}
              className={cn("min-h-[110px] resize-none bg-input border-border")}
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Enter 전송, Shift+Enter 줄바꿈
              </p>
              <Button
                type="submit"
                disabled={!selectedProjectId || !input.trim() || isSubmitting}
              >
                {isSubmitting ? "Thinking..." : "Send"}
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
