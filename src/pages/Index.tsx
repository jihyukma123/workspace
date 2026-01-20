import { ProjectSidebar } from '@/components/ProjectSidebar';
import { TabNavigation } from '@/components/TabNavigation';
import { KanbanBoard } from '@/components/KanbanBoard';
import { WikiEditor } from '@/components/WikiEditor';
import { MemoEditor } from '@/components/MemoEditor';
import { useWorkspaceStore } from '@/store/workspaceStore';

const Index = () => {
  const { activeTab, selectedProjectId } = useWorkspaceStore();

  const renderContent = () => {
    if (!selectedProjectId) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center neon-border animate-pulse-glow">
              <span className="text-4xl">⚡</span>
            </div>
            <h2 className="font-mono text-2xl font-bold neon-text-cyan mb-2">
              Welcome to Workspace
            </h2>
            <p className="text-muted-foreground max-w-md">
              Select a project from the sidebar to view its Kanban board, Wiki, and Memo.
            </p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'kanban':
        return <KanbanBoard />;
      case 'wiki':
        return <WikiEditor />;
      case 'memo':
        return <MemoEditor />;
      default:
        return <KanbanBoard />;
    }
  };

  return (
    <div className="min-h-screen flex bg-background cyber-grid">
      <ProjectSidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {selectedProjectId && <TabNavigation />}
        
        <div className="flex-1 flex overflow-hidden">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Index;
