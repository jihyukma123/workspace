import { useState } from 'react';
import { Plus, FileText, ChevronRight, Edit2, Save, X } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';

export function WikiEditor() {
  const { wikiPages, addWikiPage, updateWikiPage } = useWorkspaceStore();
  const [selectedPageId, setSelectedPageId] = useState<string | null>(wikiPages[0]?.id || null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');

  const selectedPage = wikiPages.find((p) => p.id === selectedPageId);

  const handleEdit = () => {
    if (selectedPage) {
      setEditContent(selectedPage.content);
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    if (selectedPageId) {
      updateWikiPage(selectedPageId, editContent);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditContent('');
  };

  const handleAddPage = () => {
    if (newPageTitle.trim()) {
      const newPage = {
        id: Date.now().toString(),
        title: newPageTitle,
        content: `# ${newPageTitle}\n\nStart writing your documentation here...`,
        parentId: null,
        children: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      addWikiPage(newPage);
      setSelectedPageId(newPage.id);
      setNewPageTitle('');
      setIsAddOpen(false);
    }
  };

  // Simple markdown rendering
  const renderMarkdown = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, index) => {
      if (line.startsWith('# ')) {
        return (
          <h1 key={index} className="text-2xl font-mono font-bold neon-text-cyan mb-4">
            {line.slice(2)}
          </h1>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h2 key={index} className="text-xl font-mono font-semibold text-secondary mt-6 mb-3">
            {line.slice(3)}
          </h2>
        );
      }
      if (line.startsWith('### ')) {
        return (
          <h3 key={index} className="text-lg font-mono font-medium text-accent mt-4 mb-2">
            {line.slice(4)}
          </h3>
        );
      }
      if (line.startsWith('- ')) {
        return (
          <li key={index} className="text-foreground ml-4 mb-1 list-disc">
            {line.slice(2)}
          </li>
        );
      }
      if (line.startsWith('- [ ] ')) {
        return (
          <li key={index} className="text-foreground ml-4 mb-1 flex items-center gap-2">
            <span className="w-4 h-4 border border-border rounded" />
            {line.slice(6)}
          </li>
        );
      }
      if (line.startsWith('- [x] ')) {
        return (
          <li key={index} className="text-muted-foreground ml-4 mb-1 flex items-center gap-2 line-through">
            <span className="w-4 h-4 border border-primary bg-primary/20 rounded flex items-center justify-center text-primary text-xs">
              ✓
            </span>
            {line.slice(6)}
          </li>
        );
      }
      if (line.includes('**')) {
        const parts = line.split('**');
        return (
          <p key={index} className="text-foreground mb-2">
            {parts.map((part, i) => 
              i % 2 === 1 ? <strong key={i} className="font-bold text-primary">{part}</strong> : part
            )}
          </p>
        );
      }
      if (line.trim() === '') {
        return <br key={index} />;
      }
      return (
        <p key={index} className="text-foreground mb-2">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="flex-1 flex">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-card/30 flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-mono text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Pages
          </h3>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-primary"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="font-mono neon-text-cyan">New Wiki Page</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input
                  placeholder="Page title"
                  value={newPageTitle}
                  onChange={(e) => setNewPageTitle(e.target.value)}
                  className="bg-input border-border focus:border-primary"
                />
                <Button
                  onClick={handleAddPage}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Create Page
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {wikiPages.map((page) => (
              <button
                key={page.id}
                onClick={() => {
                  setSelectedPageId(page.id);
                  setIsEditing(false);
                }}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all duration-200',
                  'hover:bg-muted/50 group',
                  selectedPageId === page.id
                    ? 'bg-primary/10 border border-primary/30 text-primary'
                    : 'text-foreground border border-transparent'
                )}
              >
                <FileText className="w-4 h-4" />
                <span className="truncate text-sm">{page.title}</span>
                <ChevronRight
                  className={cn(
                    'w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity',
                    selectedPageId === page.id && 'opacity-100'
                  )}
                />
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        {selectedPage ? (
          <>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-mono text-lg font-semibold">{selectedPage.title}</h2>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancel}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      className="bg-success text-success-foreground hover:bg-success/90"
                    >
                      <Save className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEdit}
                    className="text-muted-foreground hover:text-primary"
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
            </div>

            <ScrollArea className="flex-1 p-6">
              {isEditing ? (
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[500px] font-mono text-sm bg-input border-border focus:border-primary resize-none"
                  placeholder="Write your documentation in Markdown..."
                />
              ) : (
                <div className="prose prose-invert max-w-none">
                  {renderMarkdown(selectedPage.content)}
                </div>
              )}
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a page or create a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
