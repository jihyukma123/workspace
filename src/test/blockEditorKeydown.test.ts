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
}: {
  textBefore?: string;
  depth?: number;
  ancestorTypeNames?: string[];
}) {
  const chain = wireChain(createChain());

  const updateAttributes = vi.fn();

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
    commands: {
      updateAttributes,
    },
  };

  return { editor, chain, updateAttributes };
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

  it("leaves Tab indentation to the TipTap list keymap", () => {
    const { editor } = createEditor({
      depth: 1,
      ancestorTypeNames: ["listItem"],
    });
    const preventDefault = vi.fn();

    const handled = handleBlockEditorKeydown(
      editor as never,
      true,
      { key: "Tab", preventDefault },
    );

    expect(handled).toBe(false);
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it("leaves Shift+Tab indentation to the TipTap list keymap", () => {
    const { editor } = createEditor({
      depth: 1,
      ancestorTypeNames: ["listItem"],
    });
    const preventDefault = vi.fn();

    const handled = handleBlockEditorKeydown(
      editor as never,
      true,
      { key: "Tab", shiftKey: true, preventDefault },
    );

    expect(handled).toBe(false);
    expect(preventDefault).not.toHaveBeenCalled();
  });
});
