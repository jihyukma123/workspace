import type { Editor } from "@tiptap/core";

export type BlockEditorKeydownEvent = {
  key: string;
  shiftKey?: boolean;
  preventDefault: () => void;
};

function isTaskShortcut(text: string) {
  const trimmed = text.trim();
  return (
    /^\[(?: |x|X)?\]$/.test(trimmed) ||
    /^-\s\[(?: |x|X)?\]$/.test(trimmed)
  );
}

function isCheckedTaskShortcut(text: string) {
  return /\[(x|X)\]$/.test(text.trim());
}

function isBulletShortcut(text: string) {
  return /^[-+*]$/.test(text.trim());
}

function getActiveListItemTypeName(editor: Editor) {
  const { $from } = editor.state.selection;

  for (let depth = $from.depth; depth > 0; depth -= 1) {
    const typeName = $from.node(depth).type.name;
    if (typeName === "taskItem" || typeName === "listItem") {
      return typeName;
    }
  }

  return null;
}

export function handleBlockEditorKeydown(
  editor: Editor,
  editable: boolean,
  event: BlockEditorKeydownEvent,
) {
  if (!editable) {
    return false;
  }

  // TipTap's list extensions already own Tab / Shift+Tab indentation.
  // Handling those keys here as well causes a single keystroke to lift/sink
  // the current list item twice.
  if (event.key !== " ") {
    return false;
  }

  const { state } = editor;
  const { $from, empty } = state.selection;
  if (!empty || $from.parent.type.name !== "paragraph") {
    return false;
  }

  const textBefore = $from.parent.textBetween(
    0,
    $from.parentOffset,
    undefined,
    "\ufffc",
  );

  if (isTaskShortcut(textBefore)) {
    event.preventDefault();

    const checked = isCheckedTaskShortcut(textBefore);
    editor
      .chain()
      .focus()
      .deleteRange({
        from: $from.start(),
        to: $from.pos,
      })
      .toggleTaskList()
      .run();

    editor.commands.updateAttributes("taskItem", { checked });
    return true;
  }

  if (getActiveListItemTypeName(editor) || !isBulletShortcut(textBefore)) {
    return false;
  }

  event.preventDefault();
  editor
    .chain()
    .focus()
    .deleteRange({
      from: $from.start(),
      to: $from.pos,
    })
    .toggleBulletList()
    .run();

  return true;
}
