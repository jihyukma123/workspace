import { Kanban, BookOpen, StickyNote } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'kanban' as const, label: 'Kanban', icon: Kanban },
  { id: 'wiki' as const, label: 'Wiki', icon: BookOpen },
  { id: 'memo' as const, label: 'Memo', icon: StickyNote },
];

export function TabNavigation() {
  const { activeTab, setActiveTab, projects, selectedProjectId } = useWorkspaceStore();
  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h2 className="font-mono text-xl font-bold neon-text-cyan">
            {selectedProject?.name || 'Select a Project'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {selectedProject?.description}
          </p>
        </div>
      </div>
      
      <div className="flex px-6 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 font-mono text-sm transition-all duration-200 rounded-t-lg',
                'border-x border-t',
                isActive
                  ? 'bg-background border-primary/30 text-primary -mb-px'
                  : 'bg-transparent border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'
              )}
            >
              <Icon className={cn('w-4 h-4', isActive && 'animate-pulse-glow')} />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
