import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  MessageSquarePlus,
  Trash2,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { Issue } from "@/types/workspace";

const statusLabels: Record<Issue["status"], string> = {
  todo: "Todo",
  "in-progress": "In Progress",
  done: "Done",
};

const statusStyles: Record<Issue["status"], string> = {
  todo: "bg-status-todo/20 text-status-todo border-status-todo/30",
  "in-progress":
    "bg-status-progress/20 text-status-progress border-status-progress/30",
  done: "bg-status-done/20 text-status-done border-status-done/30",
};

const priorityStyles: Record<Issue["priority"], string> = {
  low: "bg-muted text-muted-foreground border-border",
  medium:
    "bg-status-progress/20 text-status-progress border-status-progress/30",
  high: "bg-destructive/20 text-destructive border-destructive/30",
};

const formatDate = (date: Date) =>
  date.toLocaleDateString(undefined, { month: "short", day: "numeric" });

interface IssuesViewProps {
  onAddIssue?: () => void;
}

export function IssuesView({ onAddIssue: _onAddIssue }: IssuesViewProps) {
  const {
    issues,
    selectedProjectId,
    deleteIssue,
    updateIssue,
    issueCommentsByIssueId,
    listIssueComments,
    addIssueComment,
    deleteIssueComment,
  } = useWorkspaceStore();
  void _onAddIssue;
  const [statusFilter, setStatusFilter] = useState<Issue["status"] | "all">(
    "all",
  );

  const [searchParams, setSearchParams] = useSearchParams();
  const selectedIssueId = searchParams.get("issue");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftComment, setDraftComment] = useState("");
  const [isSavingIssue, setIsSavingIssue] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const projectIssues = useMemo(
    () => issues.filter((issue) => issue.projectId === selectedProjectId),
    [issues, selectedProjectId],
  );

  const issueCounts = useMemo(() => {
    const todoCount = projectIssues.filter(
      (issue) => issue.status === "todo",
    ).length;
    const inProgressCount = projectIssues.filter(
      (issue) => issue.status === "in-progress",
    ).length;
    const doneCount = projectIssues.filter(
      (issue) => issue.status === "done",
    ).length;
    const total = projectIssues.length;

    return {
      total,
      todoCount,
      inProgressCount,
      doneCount,
      openCount: total - doneCount,
    };
  }, [projectIssues]);

  const filteredIssues = useMemo(() => {
    const statusFiltered =
      statusFilter === "all"
        ? projectIssues
        : projectIssues.filter((issue) => issue.status === statusFilter);

    return [...statusFiltered].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }, [projectIssues, statusFilter]);

  const selectedIssue = useMemo(() => {
    if (!selectedIssueId) {
      return null;
    }
    return projectIssues.find((issue) => issue.id === selectedIssueId) ?? null;
  }, [projectIssues, selectedIssueId]);

  const selectedIssueComments = useMemo(() => {
    if (!selectedIssueId) {
      return [];
    }
    return issueCommentsByIssueId[selectedIssueId] ?? [];
  }, [issueCommentsByIssueId, selectedIssueId]);

  useEffect(() => {
    if (!selectedIssueId) {
      return;
    }
    void listIssueComments(selectedIssueId);
  }, [listIssueComments, selectedIssueId]);

  useEffect(() => {
    if (!selectedIssue) {
      return;
    }
    setDraftDescription(selectedIssue.description ?? "");
  }, [selectedIssue]);

  const isDetailView = Boolean(selectedIssueId);

  if (isDetailView) {
    return (
      <div className="h-full p-6 overflow-y-auto scrollbar-thin">
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => {
                    setSearchParams((prev) => {
                      const next = new URLSearchParams(prev);
                      next.delete("issue");
                      return next;
                    });
                    setDraftComment("");
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
                <h2 className="font-mono text-lg font-bold text-primary">
                  Issue
                </h2>
              </div>
              {selectedIssue ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  ISSUE-{selectedIssue.id} • Created{" "}
                  {formatDate(selectedIssue.createdAt)}
                </p>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">
                  Loading issue…
                </p>
              )}
            </div>
          </div>

          {!selectedIssue ? (
            <div className="rounded-lg border bg-card text-card-foreground p-10">
              <div className="text-center max-w-sm mx-auto">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-mono text-lg font-bold text-primary">
                  Issue not found
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  It may have been deleted.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <Card className="bg-card border-border">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">
                          ISSUE-{selectedIssue.id}
                        </span>
                        <Badge
                          className={cn(
                            "border",
                            statusStyles[selectedIssue.status],
                          )}
                        >
                          {statusLabels[selectedIssue.status]}
                        </Badge>
                        <Badge
                          className={cn(
                            "border",
                            priorityStyles[selectedIssue.priority],
                          )}
                        >
                          {selectedIssue.priority}
                        </Badge>
                        {selectedIssue.dueDate && (
                          <Badge
                            className={cn(
                              "border flex items-center gap-1",
                              selectedIssue.dueDate < new Date() &&
                                selectedIssue.status !== "done"
                                ? "bg-destructive/20 text-destructive border-destructive/30"
                                : "bg-muted text-muted-foreground border-border",
                            )}
                          >
                            <Calendar className="w-3 h-3" />
                            {formatDate(selectedIssue.dueDate)}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-2 text-base font-semibold text-foreground">
                        {selectedIssue.title}
                      </div>
                    </div>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-popover border-border">
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Delete this issue?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. The issue will be
                            permanently removed.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              void deleteIssue(selectedIssue.id);
                              setSearchParams((prev) => {
                                const next = new URLSearchParams(prev);
                                next.delete("issue");
                                return next;
                              });
                            }}
                            className={buttonVariants({
                              variant: "destructive",
                            })}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <div className="text-xs font-mono text-muted-foreground">
                        Status
                      </div>
                      <Select
                        value={selectedIssue.status}
                        onValueChange={(value: Issue["status"]) =>
                          void updateIssue(selectedIssue.id, {
                            status: value,
                          })
                        }
                      >
                        <SelectTrigger className="h-9 bg-input border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todo">Todo</SelectItem>
                          <SelectItem value="in-progress">
                            In Progress
                          </SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs font-mono text-muted-foreground">
                        Priority
                      </div>
                      <Select
                        value={selectedIssue.priority}
                        onValueChange={(value: Issue["priority"]) =>
                          void updateIssue(selectedIssue.id, {
                            priority: value,
                          })
                        }
                      >
                        <SelectTrigger className="h-9 bg-input border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs font-mono text-muted-foreground">
                        Due Date (optional)
                      </div>
                      <input
                        type="date"
                        className={cn(
                          "flex h-9 w-full rounded-md border bg-input border-border px-3 py-1 text-sm",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          "disabled:cursor-not-allowed disabled:opacity-50",
                          selectedIssue.dueDate &&
                            selectedIssue.dueDate < new Date() &&
                            selectedIssue.status !== "done"
                            ? "text-destructive"
                            : "",
                        )}
                        value={
                          selectedIssue.dueDate
                            ? selectedIssue.dueDate.toISOString().split("T")[0]
                            : ""
                        }
                        onChange={(e) => {
                          void updateIssue(selectedIssue.id, {
                            dueDate: e.target.value
                              ? new Date(e.target.value)
                              : null,
                          });
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-mono text-muted-foreground">
                        Main content
                      </div>
                      <Button
                        size="sm"
                        disabled={isSavingIssue}
                        onClick={async () => {
                          setIsSavingIssue(true);
                          try {
                            await updateIssue(selectedIssue.id, {
                              description: draftDescription,
                            });
                          } finally {
                            setIsSavingIssue(false);
                          }
                        }}
                      >
                        Save
                      </Button>
                    </div>
                    <Textarea
                      value={draftDescription}
                      onChange={(e) => setDraftDescription(e.target.value)}
                      placeholder="Write the main issue notes here…"
                      className="min-h-[180px] bg-input border-border"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-mono text-muted-foreground">
                      Comments
                    </div>
                    <Badge className="border bg-muted text-muted-foreground">
                      {selectedIssueComments.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-4">
                  {selectedIssueComments.length > 0 && (
                    <div className="space-y-2">
                      {selectedIssueComments.map((comment) => (
                        <div
                          key={comment.id}
                          className="rounded-lg border bg-muted/50 p-3"
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="text-xs text-muted-foreground">
                              {comment.createdAt.toLocaleString()}
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() =>
                                void deleteIssueComment({
                                  issueId: selectedIssue.id,
                                  commentId: comment.id,
                                })
                              }
                            >
                              Delete
                            </Button>
                          </div>
                          <div className="text-sm text-foreground whitespace-pre-wrap">
                            {comment.body}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Textarea
                      value={draftComment}
                      onChange={(e) => setDraftComment(e.target.value)}
                      placeholder="Add a comment…"
                      className="min-h-[80px] bg-input border-border"
                    />
                    <Button
                      disabled={
                        isSubmittingComment || draftComment.trim().length === 0
                      }
                      onClick={async () => {
                        if (!draftComment.trim()) {
                          return;
                        }
                        setIsSubmittingComment(true);
                        try {
                          const created = await addIssueComment({
                            issueId: selectedIssue.id,
                            body: draftComment.trim(),
                          });
                          if (created) {
                            setDraftComment("");
                          }
                        } finally {
                          setIsSubmittingComment(false);
                        }
                      }}
                    >
                      <MessageSquarePlus className="h-4 w-4" />
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-6 overflow-y-auto scrollbar-thin">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-mono text-lg font-bold text-primary">Issues</h2>
            <p className="text-sm text-muted-foreground">
              Track bugs, tasks, and requests for this project.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-kanban-card border-border">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-muted-foreground">
                  Total
                </span>
                <Badge className="border bg-muted text-muted-foreground">
                  All
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="font-mono text-3xl font-bold text-foreground">
                {issueCounts.total}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {issueCounts.openCount} open • {issueCounts.doneCount} closed
              </div>
            </CardContent>
          </Card>

          <Card className="bg-kanban-card border-border">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-muted-foreground">
                  Open
                </span>
                <Badge className={cn("border", statusStyles["todo"])}>
                  Todo
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="font-mono text-3xl font-bold text-foreground">
                {issueCounts.openCount}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                todo + in progress
              </div>
            </CardContent>
          </Card>

          <Card className="bg-kanban-card border-border">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-muted-foreground">
                  In Progress
                </span>
                <Badge className={cn("border", statusStyles["in-progress"])}>
                  {statusLabels["in-progress"]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="font-mono text-3xl font-bold text-foreground">
                {issueCounts.inProgressCount}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                currently being worked on
              </div>
            </CardContent>
          </Card>

          <Card className="bg-kanban-card border-border">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-muted-foreground">
                  Closed
                </span>
                <Badge className={cn("border", statusStyles["done"])}>
                  {statusLabels.done}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="font-mono text-3xl font-bold text-foreground">
                {issueCounts.doneCount}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">done</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-mono text-sm font-semibold text-muted-foreground">
              Issue List
            </h3>
            <Badge className="border bg-muted text-muted-foreground">
              {filteredIssues.length}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={statusFilter === "all" ? "primary" : "secondary"}
              onClick={() => setStatusFilter("all")}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={statusFilter === "todo" ? "primary" : "secondary"}
              onClick={() => setStatusFilter("todo")}
            >
              Todo
            </Button>
            <Button
              size="sm"
              variant={statusFilter === "in-progress" ? "primary" : "secondary"}
              onClick={() => setStatusFilter("in-progress")}
            >
              In Progress
            </Button>
            <Button
              size="sm"
              variant={statusFilter === "done" ? "primary" : "secondary"}
              onClick={() => setStatusFilter("done")}
            >
              Done
            </Button>
          </div>
        </div>

        {!projectIssues.length ? (
          <div className="rounded-lg border bg-card text-card-foreground p-10">
            <div className="text-center max-w-sm mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-mono text-lg font-bold text-primary">
                No issues yet
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                Create your first issue to track bugs, tasks, and requests.
              </p>
            </div>
          </div>
        ) : filteredIssues.length ? (
          <div className="space-y-4">
            {filteredIssues.map((issue) => (
              <Card
                key={issue.id}
                className={cn(
                  "transition-all duration-200 hover:border-primary/30",
                  "bg-card text-card-foreground",
                )}
              >
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">
                          ISSUE-{issue.id}
                        </span>
                        <Badge
                          className={cn("border", statusStyles[issue.status])}
                        >
                          {statusLabels[issue.status]}
                        </Badge>
                        <Badge
                          className={cn(
                            "border",
                            priorityStyles[issue.priority],
                          )}
                        >
                          {issue.priority}
                        </Badge>
                        {issue.dueDate && (
                          <Badge
                            className={cn(
                              "border flex items-center gap-1",
                              issue.dueDate < new Date() &&
                                issue.status !== "done"
                                ? "bg-destructive/20 text-destructive border-destructive/30"
                                : "bg-muted text-muted-foreground border-border",
                            )}
                          >
                            <Calendar className="w-3 h-3" />
                            {formatDate(issue.dueDate)}
                          </Badge>
                        )}
                      </div>
                      <h4 className="mt-1 text-sm font-semibold text-foreground truncate">
                        {issue.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          setSearchParams((prev) => {
                            const next = new URLSearchParams(prev);
                            next.set("issue", issue.id);
                            return next;
                          });
                        }}
                        aria-label="Open issue details"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-7 w-7"
                            aria-label="Delete issue"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-popover border-border">
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete this issue?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. The issue will be
                              permanently removed.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => void deleteIssue(issue.id)}
                              className={buttonVariants({
                                variant: "destructive",
                              })}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(issue.createdAt)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border bg-card text-card-foreground p-10">
            <div className="text-center max-w-sm mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-mono text-lg font-bold text-primary">
                No issues in this status
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                Switch the status filter to see other issues.
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setStatusFilter("all");
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
