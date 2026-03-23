import { useEffect, useMemo, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { cn } from "@/lib/utils";
import { createWorkspaceDocument } from "@/lib/editor/documentSchema";
import { createWorkspaceTiptapExtensions } from "@/lib/editor/tiptapExtensions";
import { handleBlockEditorKeydown } from "@/components/editor/blockEditorKeydown";
import type { WorkspaceDocument } from "@/types/document";

type BlockEditorProps = {
  value: WorkspaceDocument;
  editable?: boolean;
  autofocus?: boolean;
  className?: string;
  onChange?: (document: WorkspaceDocument) => void;
};

export function BlockEditor({
  value,
  editable = false,
  autofocus = false,
  className,
  onChange,
}: BlockEditorProps) {
  const extensions = useMemo(() => createWorkspaceTiptapExtensions(), []);
  const metadataRef = useRef(value.metadata);

  useEffect(() => {
    metadataRef.current = value.metadata;
  }, [value.metadata]);

  const editor = useEditor(
    {
      extensions,
      content: value.doc,
      editable,
      autofocus,
      onUpdate: ({ editor: nextEditor }) => {
        onChange?.(
          createWorkspaceDocument(nextEditor.getJSON(), metadataRef.current),
        );
      },
    },
    [editable, autofocus],
  );

  useEffect(() => {
    if (!editor) {
      return;
    }
    editor.setEditable(editable);
  }, [editable, editor]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const currentDoc = editor.getJSON();
    if (JSON.stringify(currentDoc) === JSON.stringify(value.doc)) {
      return;
    }

    editor.commands.setContent(value.doc, { emitUpdate: false });
  }, [editor, value]);

  if (!editor) {
    return (
      <div className={cn("h-full w-full rounded-lg border border-border", className)} />
    );
  }

  return (
    <EditorContent
      editor={editor}
      className={cn(
        "h-full w-full overflow-y-auto scrollbar-thin prose max-w-none dark:prose-invert",
        "[&_.ProseMirror]:min-h-full [&_.ProseMirror]:outline-none [&_.ProseMirror]:px-4 [&_.ProseMirror]:py-4",
        "[&_.ProseMirror_*]:break-words [&_.ProseMirror_*]:text-foreground",
        "[&_.ProseMirror_h1]:mb-4 [&_.ProseMirror_h1]:text-3xl [&_.ProseMirror_h1]:font-semibold",
        "[&_.ProseMirror_h2]:mb-3 [&_.ProseMirror_h2]:text-2xl [&_.ProseMirror_h2]:font-semibold",
        "[&_.ProseMirror_h3]:mb-2 [&_.ProseMirror_h3]:text-xl [&_.ProseMirror_h3]:font-medium",
        "[&_.ProseMirror_p]:my-2 [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-border [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:text-muted-foreground",
        "[&_.ProseMirror_pre]:overflow-x-auto [&_.ProseMirror_pre]:rounded-lg [&_.ProseMirror_pre]:border [&_.ProseMirror_pre]:border-border [&_.ProseMirror_pre]:bg-muted [&_.ProseMirror_pre]:p-4",
        "[&_.ProseMirror_ul:not([data-type='taskList'])]:my-3 [&_.ProseMirror_ul:not([data-type='taskList'])]:list-disc [&_.ProseMirror_ul:not([data-type='taskList'])]:pl-6",
        "[&_.ProseMirror_ul:not([data-type='taskList'])_ul]:my-1 [&_.ProseMirror_ul:not([data-type='taskList'])_ul]:list-[circle] [&_.ProseMirror_ul:not([data-type='taskList'])_ul]:pl-6",
        "[&_.ProseMirror_ul:not([data-type='taskList'])_ul_ul]:list-[square]",
        "[&_.ProseMirror_ol]:my-3 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6",
        "[&_.ProseMirror_li]:my-1 [&_.ProseMirror_li>p]:my-1 [&_.ProseMirror_li::marker]:text-muted-foreground",
        "[&_.ProseMirror_ul[data-type='taskList']]:list-none [&_.ProseMirror_ul[data-type='taskList']]:pl-0",
        "[&_.ProseMirror_ul[data-type='taskList']_li]:my-2",
        "[&_.ProseMirror_ul[data-type='taskList']_li>label]:mr-2 [&_.ProseMirror_ul[data-type='taskList']_li>div]:inline-block [&_.ProseMirror_ul[data-type='taskList']_li_p]:my-0",
        !editable &&
          "[&_.ProseMirror]:cursor-default [&_.ProseMirror]:select-text",
        className,
      )}
      onKeyDown={(event) => {
        handleBlockEditorKeydown(editor, editable, event);
      }}
    />
  );
}
