import { useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutGrid, 
  BookOpen, 
  StickyNote, 
  AlertCircle, 
  CalendarDays,
  ChevronDown,
  FolderKanban,
  Check,
  Plus,
  MessageSquare,
  Settings
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AppInput } from "@/components/ui/app-input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const menuItems = [
  { id: "board", label: "Kanban Board", icon: LayoutGrid, path: "/" },
  { id: "wiki", label: "Wiki", icon: BookOpen, path: "/wiki" },
  { id: "memo", label: "Memo", icon: StickyNote, path: "/memo" },
  { id: "issues", label: "Issues", icon: AlertCircle, path: "/issues" },
  { id: "calendar", label: "Calendar", icon: CalendarDays, path: "/calendar" },
];

const getProjectColor = (index: number) => {
  const colors = ["bg-primary", "bg-status-progress", "bg-status-done"];
  return colors[index % colors.length];
};

export function AppSidebar() {
  const { projects, selectedProjectId, setSelectedProject, addProject } = useWorkspaceStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackError, setFeedbackError] = useState("");
  const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState(false);

  const feedbackLimit = 1000;

  const getFeedbackId = () => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const handleAddProject = async () => {
    if (newProjectName.trim()) {
      const created = await addProject({
        id: Date.now().toString(),
        name: newProjectName,
        description: newProjectDesc,
        createdAt: new Date(),
      });
      if (created) {
        setNewProjectName("");
        setNewProjectDesc("");
        setIsOpen(false);
      }
    }
  };

  const handleSubmitFeedback = async () => {
    if (isFeedbackSubmitting) {
      return;
    }
    const trimmed = feedbackText.trim();
    if (!trimmed) {
      setFeedbackError("Please enter your feedback.");
      return;
    }
    if (!window.workspaceApi?.feedback?.create) {
      setFeedbackError("Feedback service is unavailable.");
      return;
    }
    setFeedbackError("");
    setIsFeedbackSubmitting(true);
    try {
      const result = await window.workspaceApi.feedback.create({
        id: getFeedbackId(),
        body: trimmed,
        createdAt: Date.now(),
      });
      if (!result.ok) {
        setFeedbackError(result.error.message || "Failed to save feedback.");
        return;
      }
      setFeedbackText("");
      setIsFeedbackOpen(false);
      toast({
        title: "Thanks for the feedback.",
        description: "Your note was saved locally.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save feedback.";
      setFeedbackError(message);
    } finally {
      setIsFeedbackSubmitting(false);
    }
  };

  const handleFeedbackOpenChange = (nextOpen: boolean) => {
    setIsFeedbackOpen(nextOpen);
    if (!nextOpen) {
      setFeedbackError("");
      setIsFeedbackSubmitting(false);
    }
  };

  return (
    <aside className={cn("w-64 h-screen bg-sidebar flex flex-col border-r border-sidebar-border scrollbar-thin")}>
      {/* Logo */}
      <div className={cn("p-4 border-b border-sidebar-border")}>
        <div className={cn("flex items-center gap-2")}>
          <div className={cn("w-8 h-8 rounded-lg bg-primary flex items-center justify-center")}>
            <FolderKanban className={cn("w-4 h-4 text-primary-foreground")} />
          </div>
          <span className={cn("text-lg font-semibold text-sidebar-accent-foreground")}>
            Workspace
          </span>
        </div>
      </div>

      {/* Project Selector */}
      <div className={cn("p-3")}>
        <div className={cn("flex items-center justify-between mb-2")}>
          <span className={cn("text-xs font-medium text-sidebar-muted uppercase tracking-wider")}>
            Projects
          </span>
          <div className={cn("flex items-center gap-1")}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                "h-6 w-6 text-sidebar-muted transition-all duration-200",
                "hover:text-sidebar-foreground hover:bg-sidebar-accent"
              )}
              onClick={() => navigate("/projects")}
            >
              <Settings className={cn("h-4 w-4")} />
            </Button>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-6 w-6 text-sidebar-muted transition-all duration-200",
                    "hover:text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <Plus className={cn("h-4 w-4")} />
                </Button>
              </DialogTrigger>
              <DialogContent
                className={cn("bg-popover border-border")}
                onKeyDown={(e) => {
                  if (e.defaultPrevented) {
                    return;
                  }
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void handleAddProject();
                  }
                }}
              >
                <DialogHeader>
                  <DialogTitle>New Project</DialogTitle>
                </DialogHeader>
                <div className={cn("space-y-4 pt-4")}>
                  <AppInput
                    placeholder="Project name"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                  />
                  <Textarea
                    placeholder="Description (optional)"
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    className={cn("bg-input border-border")}
                  />
                  <Button
                    onClick={handleAddProject}
                    className={cn("w-full bg-primary text-primary-foreground hover:bg-primary/90")}
                  >
                    Create Project
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="sidebar"
              className={cn("w-full h-auto justify-between px-3 py-2.5 rounded-lg group")}
            >
              <div className={cn("flex items-center gap-3 min-w-0")}>
                {selectedProject && (
                  <>
                    <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", getProjectColor(projects.indexOf(selectedProject)))} />
                    <span className={cn("text-sm font-medium text-sidebar-accent-foreground truncate")}>
                      {selectedProject.name}
                    </span>
                  </>
                )}
              </div>
              <ChevronDown className={cn("w-4 h-4 text-sidebar-muted group-hover:text-sidebar-foreground transition-colors flex-shrink-0")} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            className={cn("w-56 bg-popover border border-border shadow-lg")} 
            align="start"
            sideOffset={4}
          >
            {projects.map((project) => (
              <DropdownMenuItem
                key={project.id}
                onClick={() => void setSelectedProject(project.id)}
                className={cn("flex items-center justify-between cursor-pointer")}
              >
                <div className={cn("flex items-center gap-3")}>
                  <div className={cn("w-2.5 h-2.5 rounded-full", getProjectColor(projects.indexOf(project)))} />
                  <span className={cn("text-sm")}>{project.name}</span>
                </div>
                {selectedProjectId === project.id && (
                  <Check className={cn("w-4 h-4 text-primary")} />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 px-3 py-2 overflow-y-auto scrollbar-thin")}>
        <div className={cn("space-y-1")}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={cn(
                  "w-full h-auto justify-start gap-3 px-3 py-2.5 rounded-lg relative",
                  isActive
                    ? "bg-sidebar-primary/10 text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
                variant="sidebarNav"
                size="sm"
              >
                {isActive && (
                  <div className={cn("absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full")} />
                )}
                <item.icon className={cn("w-4 h-4")} />
                <span>{item.label}</span>
              </Button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className={cn("p-4 border-t border-sidebar-border")}>
        <div className={cn("flex items-center gap-3")}>
          <div className={cn("w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center")}>
            <span className={cn("text-xs font-medium text-sidebar-accent-foreground")}>WS</span>
          </div>
          <div className={cn("flex-1 min-w-0")}>
            <p className={cn("text-sm font-medium text-sidebar-accent-foreground truncate")}>
              Workspace
            </p>
            <p className={cn("text-xs text-sidebar-muted truncate")}>
              {projects.length} project{projects.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Dialog open={isFeedbackOpen} onOpenChange={handleFeedbackOpenChange}>
          <DialogTrigger asChild>
            <Button
              variant="sidebar"
              size="sm"
              className={cn("mt-4 w-full justify-start gap-2")}
            >
              <MessageSquare className={cn("h-4 w-4")} />
              Send Feedback
            </Button>
          </DialogTrigger>
          <DialogContent
            className={cn("bg-popover border-border")}
            onKeyDown={(e) => {
              if (e.defaultPrevented) {
                return;
              }
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSubmitFeedback();
              }
            }}
          >
            <DialogHeader>
              <DialogTitle className={cn("font-mono text-lg font-bold text-primary")}>
                Service Feedback
              </DialogTitle>
            </DialogHeader>
            <div className={cn("space-y-4 pt-4")}>
              <Textarea
                placeholder="Share a bug, missing feature, or improvement idea..."
                value={feedbackText}
                maxLength={feedbackLimit}
                className={cn(feedbackError ? "border-destructive" : "")}
                onChange={(e) => {
                  setFeedbackText(e.target.value);
                  if (feedbackError) {
                    setFeedbackError("");
                  }
                }}
              />
              <div className={cn("flex items-center justify-between text-xs text-muted-foreground")}>
                <span>{feedbackText.length} / {feedbackLimit}</span>
                {feedbackError ? (
                  <span className={cn("text-destructive")}>{feedbackError}</span>
                ) : (
                  <span>Stored locally in your database.</span>
                )}
              </div>
              <Button
                onClick={handleSubmitFeedback}
                className={cn("w-full")}
                disabled={!feedbackText.trim() || isFeedbackSubmitting}
              >
                {isFeedbackSubmitting ? "Saving..." : "Submit Feedback"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </aside>
  );
}
