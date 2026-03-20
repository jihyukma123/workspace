import type { JSONContent } from "@tiptap/core";
import type { WorkspaceDocument } from "@/types/document";

function joinNonEmpty(parts: string[], separator: string) {
  return parts.filter((part) => part.length > 0).join(separator);
}

function getNodeText(node: JSONContent | null | undefined): string {
  if (!node) {
    return "";
  }

  if (node.type === "text") {
    return node.text ?? "";
  }

  if (node.type === "hardBreak") {
    return "\n";
  }

  const children = node.content?.map(getNodeText) ?? [];

  switch (node.type) {
    case "doc":
      return joinNonEmpty(children, "\n\n");
    case "paragraph":
    case "heading":
    case "blockquote":
    case "codeBlock":
      return children.join("").trim();
    case "bulletList":
    case "orderedList":
    case "taskList":
      return joinNonEmpty(children, "\n");
    case "listItem":
    case "taskItem":
      return children.join(" ").replace(/\s+\n/g, "\n").trim();
    default:
      return children.join("");
  }
}

export function getPlainTextFromWorkspaceDocument(document: WorkspaceDocument) {
  return getNodeText(document.doc).replace(/\n{3,}/g, "\n\n").trim();
}
