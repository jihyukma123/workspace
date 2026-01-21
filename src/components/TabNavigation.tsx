import { Kanban, BookOpen, StickyNote } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'kanban' as const, label: 'Kanban', icon: Kanban },
  { id: 'wiki' as const, label: 'Wiki', icon: BookOpen },
  { id: 'memo' as const, label: 'Memo', icon: StickyNote },
];

export function TabNavigation() {
  const { activeTab, setActiveTab } = useWorkspaceStore();

  return (
    <div className="border-b border-border bg-background">
      <div className="flex px-6 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-150 relative',
                'border-b-2',
                isActive
                  ? 'text-primary border-primary'
                  : 'text-muted-foreground border-transparent hover:text-foreground hover:border-muted'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
