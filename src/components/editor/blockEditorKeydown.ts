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

function handleListIndentShortcut(
  editor: Editor,
  event: BlockEditorKeydownEvent,
) {
  if (event.key !== "Tab") {
    return false;
  }

  const listItemTypeName = getActiveListItemTypeName(editor);
  if (!listItemTypeName) {
    return false;
  }

  if (event.shiftKey) {
    if (!editor.can().liftListItem(listItemTypeName)) {
      return false;
    }

    event.preventDefault();
    return editor.commands.liftListItem(listItemTypeName);
  }

  if (!editor.can().sinkListItem(listItemTypeName)) {
    return false;
  }

  event.preventDefault();
  return editor.commands.sinkListItem(listItemTypeName);
}

export function handleBlockEditorKeydown(
  editor: Editor,
  editable: boolean,
  event: BlockEditorKeydownEvent,
) {
  if (!editable) {
    return false;
  }

  if (handleListIndentShortcut(editor, event)) {
    return true;
  }

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
