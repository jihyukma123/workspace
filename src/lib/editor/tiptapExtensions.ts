import { UniqueID } from "@tiptap/extension-unique-id";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import StarterKit from "@tiptap/starter-kit";

export function createWorkspaceTiptapExtensions() {
  return [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3],
      },
    }),
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    UniqueID.configure({
      attributeName: "blockId",
      types: [
        "paragraph",
        "heading",
        "bulletList",
        "orderedList",
        "taskList",
        "taskItem",
        "blockquote",
        "codeBlock",
        "listItem",
      ],
    }),
  ];
}
