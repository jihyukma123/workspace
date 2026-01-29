import { Kanban, BookOpen, StickyNote, CalendarDays } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const tabs = [
  { id: 'kanban' as const, label: 'Kanban', icon: Kanban },
  { id: 'wiki' as const, label: 'Wiki', icon: BookOpen },
  { id: 'memo' as const, label: 'Memo', icon: StickyNote },
  { id: 'calendar' as const, label: 'Calendar', icon: CalendarDays },
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
            <Button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'h-auto gap-2 px-4 py-2.5',
                isActive && 'text-primary border-primary'
              )}
              variant="tab"
              size="sm"
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
