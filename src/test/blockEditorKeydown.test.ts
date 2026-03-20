// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { handleBlockEditorKeydown } from "@/components/editor/blockEditorKeydown";

function createChain() {
  return {
    focus: vi.fn(),
    deleteRange: vi.fn(),
    toggleBulletList: vi.fn(),
    toggleTaskList: vi.fn(),
    run: vi.fn(() => true),
  };
}

function wireChain(chain: ReturnType<typeof createChain>) {
  chain.focus.mockReturnValue(chain);
  chain.deleteRange.mockReturnValue(chain);
  chain.toggleBulletList.mockReturnValue(chain);
  chain.toggleTaskList.mockReturnValue(chain);
  return chain;
}

function createEditor({
  textBefore = "",
  depth = 0,
  ancestorTypeNames = [],
  canSinkListItem = false,
  canLiftListItem = false,
}: {
  textBefore?: string;
  depth?: number;
  ancestorTypeNames?: string[];
  canSinkListItem?: boolean;
  canLiftListItem?: boolean;
}) {
  const chain = wireChain(createChain());

  const updateAttributes = vi.fn();
  const sinkListItem = vi.fn(() => true);
  const liftListItem = vi.fn(() => true);

  const editor = {
    state: {
      selection: {
        empty: true,
        $from: {
          depth,
          parentOffset: textBefore.length,
          pos: 10,
          start: vi.fn(() => 5),
          node: vi.fn((requestedDepth: number) => ({
            type: { name: ancestorTypeNames[requestedDepth - 1] ?? "paragraph" },
          })),
          parent: {
            type: { name: "paragraph" },
            textBetween: vi.fn(() => textBefore),
          },
        },
      },
    },
    chain: vi.fn(() => chain),
    can: vi.fn(() => ({
      sinkListItem: vi.fn(() => canSinkListItem),
      liftListItem: vi.fn(() => canLiftListItem),
    })),
    commands: {
      updateAttributes,
      sinkListItem,
      liftListItem,
    },
  };

  return { editor, chain, updateAttributes, sinkListItem, liftListItem };
}

describe("handleBlockEditorKeydown", () => {
  it("turns '- ' into a bullet list instead of leaving an empty paragraph", () => {
    const { editor, chain } = createEditor({ textBefore: "-" });
    const preventDefault = vi.fn();

    const handled = handleBlockEditorKeydown(
      editor as never,
      true,
      { key: " ", preventDefault },
    );

    expect(handled).toBe(true);
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(chain.deleteRange).toHaveBeenCalledWith({ from: 5, to: 10 });
    expect(chain.toggleBulletList).toHaveBeenCalledOnce();
  });

  it("turns '- [x] ' into a checked task item", () => {
    const { editor, chain, updateAttributes } = createEditor({
      textBefore: "- [x]",
    });
    const preventDefault = vi.fn();

    const handled = handleBlockEditorKeydown(
      editor as never,
      true,
      { key: " ", preventDefault },
    );

    expect(handled).toBe(true);
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(chain.toggleTaskList).toHaveBeenCalledOnce();
    expect(updateAttributes).toHaveBeenCalledWith("taskItem", { checked: true });
  });

  it("uses Tab to nest a bullet list item", () => {
    const { editor, sinkListItem } = createEditor({
      depth: 1,
      ancestorTypeNames: ["listItem"],
      canSinkListItem: true,
    });
    const preventDefault = vi.fn();

    const handled = handleBlockEditorKeydown(
      editor as never,
      true,
      { key: "Tab", preventDefault },
    );

    expect(handled).toBe(true);
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(sinkListItem).toHaveBeenCalledWith("listItem");
  });

  it("uses Shift+Tab to lift a nested list item", () => {
    const { editor, liftListItem } = createEditor({
      depth: 1,
      ancestorTypeNames: ["listItem"],
      canLiftListItem: true,
    });
    const preventDefault = vi.fn();

    const handled = handleBlockEditorKeydown(
      editor as never,
      true,
      { key: "Tab", shiftKey: true, preventDefault },
    );

    expect(handled).toBe(true);
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(liftListItem).toHaveBeenCalledWith("listItem");
  });
});
