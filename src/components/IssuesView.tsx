import { AlertCircle, Calendar, Trash2 } from "lucide-react";
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
  "in-progress": "bg-status-progress/20 text-status-progress border-status-progress/30",
  done: "bg-status-done/20 text-status-done border-status-done/30",
};

const priorityStyles: Record<Issue["priority"], string> = {
  low: "bg-muted text-muted-foreground border-border",
  medium: "bg-status-progress/20 text-status-progress border-status-progress/30",
  high: "bg-destructive/20 text-destructive border-destructive/30",
};

const formatDate = (date: Date) =>
  date.toLocaleDateString(undefined, { month: "short", day: "numeric" });

interface IssuesViewProps {
  onAddIssue?: () => void;
}

export function IssuesView({ onAddIssue }: IssuesViewProps) {
  const { issues, selectedProjectId, deleteIssue } = useWorkspaceStore();
  const projectIssues = issues.filter((issue) => issue.projectId === selectedProjectId);

  if (!projectIssues.length) {
    return (
      <div className="h-full flex items-center justify-center py-12">
        <div className="text-center max-w-sm px-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-mono text-lg font-bold text-primary">No issues yet</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Create your first issue to track bugs, tasks, and requests.
          </p>
          {onAddIssue && (
            <Button
              onClick={onAddIssue}
              className="mt-4"
            >
              Add Issue
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-6 overflow-y-auto scrollbar-thin">
      <div className="space-y-4">
        {projectIssues.map((issue) => (
          <Card
            key={issue.id}
            className={cn(
              "transition-all duration-200 hover:border-primary/30",
              "bg-card text-card-foreground"
            )}
          >
            <CardHeader className="p-4 pb-2">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">
                      ISSUE-{issue.id}
                    </span>
                    <Badge className={cn("border", statusStyles[issue.status])}>
                      {statusLabels[issue.status]}
                    </Badge>
                  </div>
                  <h4 className="text-base font-semibold text-foreground mt-2">
                    {issue.title}
                  </h4>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-7 w-7"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-popover border-border">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this issue?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. The issue will be permanently removed.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => void deleteIssue(issue.id)}
                        className={buttonVariants({ variant: "destructive" })}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {issue.description && (
                <p className="text-sm text-muted-foreground">
                  {issue.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <Badge className={cn("border", priorityStyles[issue.priority])}>
                  {issue.priority}
                </Badge>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(issue.createdAt)}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
