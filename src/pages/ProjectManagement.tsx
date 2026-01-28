import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AppInput } from "@/components/ui/app-input";
import { Project } from "@/types/workspace";
import { PrimaryColorSetting } from "@/components/settings/PrimaryColorSetting";

const DELETE_PASSWORD = "86748";

export default function ProjectManagement() {
  const { projects, deleteProject, hydrate, isHydrated } = useWorkspaceStore();
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isHydrated) {
      void hydrate();
    }
  }, [hydrate, isHydrated]);

  const closeDialog = () => {
    setDeleteTarget(null);
    setPassword("");
    setPasswordError("");
    setIsDeleting(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) {
      return;
    }
    if (password !== DELETE_PASSWORD) {
      setPasswordError("Incorrect password.");
      return;
    }
    setIsDeleting(true);
    await deleteProject(deleteTarget.id);
    closeDialog();
  };

  return (
    <MainLayout>
      <div className={cn("h-screen flex flex-col")}>
        <header className={cn("flex items-center justify-between px-6 py-4 border-b border-border bg-background")}>
          <div>
            <h1 className={cn("font-mono text-lg font-bold text-primary")}>Project Management</h1>
            <p className={cn("text-sm text-muted-foreground")}>
              Manage projects and permanently remove unused workspaces.
            </p>
          </div>
        </header>

        <div className={cn("flex-1 min-h-0 p-6")}>
          <div className={cn("h-full flex flex-col gap-4")}>
            <Card className={cn("flex-shrink-0")}>
              <CardHeader className={cn("pb-4")}>
                <CardTitle className={cn("font-mono text-lg font-bold text-primary")}>
                  Appearance
                </CardTitle>
                <CardDescription>
                  Customize the app’s primary color.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PrimaryColorSetting />
              </CardContent>
            </Card>

            <Card className={cn("flex-1 min-h-0 flex flex-col")}>
              <CardHeader className={cn("pb-4")}>
                <CardTitle className={cn("font-mono text-lg font-bold text-primary")}>
                  Project List
                </CardTitle>
                <CardDescription>
                  Deletions are permanent. Enter the password to confirm removal.
                </CardDescription>
              </CardHeader>
              <CardContent className={cn("flex-1 min-h-0")}>
                <div className={cn("h-full overflow-y-auto scrollbar-thin pr-2")}>
                  <div className={cn("space-y-2")}>
                    {projects.length === 0 ? (
                      <div
                        className={cn(
                          "rounded-lg border border-dashed border-border bg-muted/30 p-6",
                          "text-center text-sm text-muted-foreground"
                        )}
                      >
                        No projects available.
                      </div>
                    ) : (
                      projects.map((project) => (
                        <div
                          key={project.id}
                          className={cn(
                            "flex items-center justify-between rounded-lg border bg-card text-card-foreground px-4 py-3",
                            "transition-all duration-200 hover:bg-muted/40"
                          )}
                        >
                          <div className={cn("min-w-0")}>
                            <p className={cn("font-medium text-foreground truncate")}>{project.name}</p>
                            <p className={cn("text-xs text-muted-foreground truncate")}>
                              {project.description || "No description"}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className={cn("transition-all duration-200")}
                            onClick={() => setDeleteTarget(project)}
                          >
                            <Trash2 className={cn("h-4 w-4")} />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            closeDialog();
          }
        }}
      >
        <DialogContent className={cn("bg-popover border-border")}>
          <DialogHeader>
            <DialogTitle className={cn("font-mono text-lg font-bold text-primary")}>
              Delete Project
            </DialogTitle>
            <DialogDescription>
              Enter the password to permanently delete {deleteTarget?.name ?? "this project"}.
            </DialogDescription>
          </DialogHeader>
          <div className={cn("space-y-2")}>
            <AppInput
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (passwordError) {
                  setPasswordError("");
                }
              }}
            />
            {passwordError ? (
              <p className={cn("text-xs text-destructive")}>{passwordError}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              className={cn("transition-all duration-200")}
              onClick={closeDialog}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className={cn("transition-all duration-200")}
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              Delete Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
