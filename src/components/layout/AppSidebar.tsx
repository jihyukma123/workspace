import { useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutGrid, 
  BookOpen, 
  StickyNote, 
  AlertCircle, 
  ChevronDown,
  FolderKanban,
  Check,
  Plus
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const menuItems = [
  { id: "board", label: "Kanban Board", icon: LayoutGrid, path: "/" },
  { id: "wiki", label: "Wiki", icon: BookOpen, path: "/wiki" },
  { id: "memo", label: "Memo", icon: StickyNote, path: "/memo" },
  { id: "issues", label: "Issues", icon: AlertCircle, path: "/issues" },
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

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const handleAddProject = () => {
    if (newProjectName.trim()) {
      addProject({
        id: Date.now().toString(),
        name: newProjectName,
        description: newProjectDesc,
        createdAt: new Date(),
      });
      setNewProjectName("");
      setNewProjectDesc("");
      setIsOpen(false);
    }
  };

  return (
    <aside className="w-64 h-screen bg-sidebar flex flex-col border-r border-sidebar-border scrollbar-thin">
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <FolderKanban className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-sidebar-accent-foreground">
            Workspace
          </span>
        </div>
      </div>

      {/* Project Selector */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-sidebar-muted uppercase tracking-wider">
            Projects
          </span>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-popover border-border">
              <DialogHeader>
                <DialogTitle>New Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input
                  placeholder="Project name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                />
                <Textarea
                  placeholder="Description (optional)"
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                />
                <Button
                  onClick={handleAddProject}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Create Project
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="sidebar"
              className="w-full h-auto justify-between px-3 py-2.5 rounded-lg group"
            >
              <div className="flex items-center gap-3 min-w-0">
                {selectedProject && (
                  <>
                    <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", getProjectColor(projects.indexOf(selectedProject)))} />
                    <span className="text-sm font-medium text-sidebar-accent-foreground truncate">
                      {selectedProject.name}
                    </span>
                  </>
                )}
              </div>
              <ChevronDown className="w-4 h-4 text-sidebar-muted group-hover:text-sidebar-foreground transition-colors flex-shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            className="w-56 bg-popover border border-border shadow-lg" 
            align="start"
            sideOffset={4}
          >
            {projects.map((project) => (
              <DropdownMenuItem
                key={project.id}
                onClick={() => setSelectedProject(project.id)}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className={cn("w-2.5 h-2.5 rounded-full", getProjectColor(projects.indexOf(project)))} />
                  <span className="text-sm">{project.name}</span>
                </div>
                {selectedProjectId === project.id && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto scrollbar-thin">
        <div className="space-y-1">
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
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
                )}
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center">
            <span className="text-xs font-medium text-sidebar-accent-foreground">WS</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-accent-foreground truncate">
              Workspace
            </p>
            <p className="text-xs text-sidebar-muted truncate">
              {projects.length} project{projects.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
