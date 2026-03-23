// @vitest-environment jsdom

import { render } from "@testing-library/react";
import type { JSONContent } from "@tiptap/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BlockEditor } from "@/components/editor/BlockEditor";
import { createWorkspaceDocument } from "@/lib/editor/documentSchema";

const mockEditor = {
  commands: {
    setContent: vi.fn(),
  },
  getJSON: vi.fn<() => JSONContent>(),
  setEditable: vi.fn(),
};

vi.mock("@/lib/editor/tiptapExtensions", () => ({
  createWorkspaceTiptapExtensions: () => [],
}));

vi.mock("@/components/editor/blockEditorKeydown", () => ({
  handleBlockEditorKeydown: () => false,
}));

vi.mock("@tiptap/react", () => ({
  EditorContent: ({ className }: { className?: string }) => (
    <div data-testid="editor-content" className={className} />
  ),
  useEditor: () => mockEditor,
}));

describe("BlockEditor", () => {
  beforeEach(() => {
    mockEditor.commands.setContent.mockReset();
    mockEditor.setEditable.mockReset();
    mockEditor.getJSON.mockReset();
  });

  it("syncs incoming value changes into the editor without emitting updates", () => {
    const firstValue = createWorkspaceDocument({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "alpha" }],
        },
      ],
    });
    const nextValue = createWorkspaceDocument({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "beta" }],
        },
      ],
    });

    mockEditor.getJSON.mockReturnValue(firstValue.doc);

    const { rerender } = render(<BlockEditor value={firstValue} editable />);

    mockEditor.getJSON.mockReturnValue(firstValue.doc);
    rerender(<BlockEditor value={nextValue} editable />);

    expect(mockEditor.commands.setContent).toHaveBeenCalledWith(nextValue.doc, {
      emitUpdate: false,
    });
  });

  it("does not rewrite editor content when the incoming value matches", () => {
    const value = createWorkspaceDocument({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "same" }],
        },
      ],
    });

    mockEditor.getJSON.mockReturnValue(value.doc);

    render(<BlockEditor value={value} editable />);

    expect(mockEditor.commands.setContent).not.toHaveBeenCalled();
  });

  it("does not rewrite editor content when attrs have the same values in a different order", () => {
    const value = createWorkspaceDocument({
      type: "doc",
      content: [
        {
          type: "taskList",
          attrs: {
            checked: false,
            blockId: "blk_task_list",
          },
          content: [
            {
              type: "taskItem",
              attrs: {
                checked: false,
                blockId: "blk_task_item",
              },
              content: [
                {
                  type: "paragraph",
                  attrs: {
                    blockId: "blk_paragraph",
                  },
                  content: [{ type: "text", text: "same item" }],
                },
              ],
            },
          ],
        },
      ],
    });

    mockEditor.getJSON.mockReturnValue({
      type: "doc",
      content: [
        {
          type: "taskList",
          attrs: {
            blockId: "blk_task_list",
            checked: false,
          },
          content: [
            {
              type: "taskItem",
              attrs: {
                blockId: "blk_task_item",
                checked: false,
              },
              content: [
                {
                  type: "paragraph",
                  attrs: {
                    blockId: "blk_paragraph",
                  },
                  content: [{ type: "text", text: "same item" }],
                },
              ],
            },
          ],
        },
      ],
    });

    render(<BlockEditor value={value} editable />);

    expect(mockEditor.commands.setContent).not.toHaveBeenCalled();
  });
});
