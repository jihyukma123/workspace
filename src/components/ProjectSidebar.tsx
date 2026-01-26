import { Plus, FolderKanban, ChevronRight } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AppInput } from '@/components/ui/app-input';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';

export function ProjectSidebar() {
  const { projects, selectedProjectId, setSelectedProject, addProject } = useWorkspaceStore();
  const [isOpen, setIsOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  const handleAddProject = async () => {
    if (newProjectName.trim()) {
      const created = await addProject({
        id: Date.now().toString(),
        name: newProjectName,
        description: newProjectDesc,
        createdAt: new Date(),
      });
      if (created) {
        setNewProjectName('');
        setNewProjectDesc('');
        setIsOpen(false);
      }
    }
  };

  return (
    <aside className="w-64 min-h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center neon-border">
            <FolderKanban className="w-4 h-4 text-primary" />
          </div>
          <h1 className="font-mono text-lg font-bold neon-text-cyan">WORKSPACE</h1>
        </div>
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="flex items-center justify-between px-2 py-2 mb-2">
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
            Projects
          </span>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-primary hover:bg-primary/10"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent
              className="bg-card border-border"
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
                <DialogTitle className="font-mono neon-text-cyan">New Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <AppInput
                  placeholder="Project name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                />
                <Textarea
                  placeholder="Description (optional)"
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="bg-input border-border focus:border-primary"
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

        <div className="space-y-1">
          {projects.map((project) => (
            <Button
              key={project.id}
              type="button"
              onClick={() => void setSelectedProject(project.id)}
              className={cn(
                'w-full h-auto justify-start gap-2 px-3 py-2.5 rounded-lg text-left',
                'hover:bg-sidebar-accent group',
                selectedProjectId === project.id
                  ? 'bg-primary/10 border border-primary/30'
                  : 'border border-transparent'
              )}
              variant="outline"
              size="sm"
            >
              <ChevronRight
                className={cn(
                  'w-4 h-4 transition-transform duration-200',
                  selectedProjectId === project.id
                    ? 'text-primary rotate-90'
                    : 'text-muted-foreground group-hover:text-primary'
                )}
              />
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'font-medium truncate transition-colors',
                    selectedProjectId === project.id
                      ? 'text-primary'
                      : 'text-sidebar-foreground group-hover:text-primary'
                  )}
                >
                  {project.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {project.description}
                </p>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="text-xs text-muted-foreground font-mono">
          <span className="neon-text-cyan animate-pulse-glow">●</span> SYSTEM ONLINE
        </div>
      </div>
    </aside>
  );
}
