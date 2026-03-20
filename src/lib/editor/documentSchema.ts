import type { JSONContent } from "@tiptap/core";
import type { DocumentMetadata, WorkspaceDocument } from "@/types/document";

const BLOCK_NODE_TYPES = new Set([
  "paragraph",
  "heading",
  "bulletList",
  "orderedList",
  "taskList",
  "taskItem",
  "blockquote",
  "codeBlock",
  "listItem",
]);

function createBlockId() {
  return `blk_${Math.random().toString(36).slice(2, 10)}`;
}

function isNonEmptyTag(tag: unknown): tag is string {
  return typeof tag === "string" && tag.trim().length > 0;
}

function cloneNode(node: JSONContent): JSONContent {
  const attrs = node.attrs ? { ...node.attrs } : undefined;
  const content = node.content?.map(cloneNode);
  const marks = node.marks?.map((mark) => ({
    ...mark,
    attrs: mark.attrs ? { ...mark.attrs } : undefined,
  }));

  return {
    ...node,
    attrs,
    content,
    marks,
  };
}

function ensureBlockIds(node: JSONContent): JSONContent {
  const nextNode = cloneNode(node);
  if (nextNode.type && BLOCK_NODE_TYPES.has(nextNode.type)) {
    nextNode.attrs = {
      ...(nextNode.attrs ?? {}),
      blockId:
        typeof nextNode.attrs?.blockId === "string" &&
        nextNode.attrs.blockId.trim().length > 0
          ? nextNode.attrs.blockId
          : createBlockId(),
    };
  }

  if (nextNode.content) {
    nextNode.content = nextNode.content.map(ensureBlockIds);
  }

  return nextNode;
}

function normalizeMetadata(
  metadata?: Partial<DocumentMetadata> | null,
): DocumentMetadata {
  return {
    tags: Array.isArray(metadata?.tags)
      ? metadata.tags.filter(isNonEmptyTag)
      : [],
    properties: metadata?.properties ? { ...metadata.properties } : undefined,
    careerSignals: metadata?.careerSignals
      ? metadata.careerSignals.map((signal) => ({
        ...signal,
        evidenceBlockIds: [...signal.evidenceBlockIds],
        skills: signal.skills ? [...signal.skills] : undefined,
        metrics: signal.metrics
          ? signal.metrics.map((metric) => ({ ...metric }))
          : undefined,
        period: signal.period ? { ...signal.period } : undefined,
      }))
      : undefined,
    source: metadata?.source,
  };
}

function createParagraphNode(text = ""): JSONContent {
  return {
    type: "paragraph",
    attrs: { blockId: createBlockId() },
    content: text ? [{ type: "text", text }] : [],
  };
}

function normalizeDoc(doc?: JSONContent | null): JSONContent {
  if (!doc || doc.type !== "doc") {
    return {
      type: "doc",
      content: [createParagraphNode()],
    };
  }

  const nextDoc = ensureBlockIds(doc);
  if (!nextDoc.content || nextDoc.content.length === 0) {
    nextDoc.content = [createParagraphNode()];
  }

  return nextDoc;
}

export function createWorkspaceDocument(
  doc?: JSONContent | null,
  metadata?: Partial<DocumentMetadata> | null,
): WorkspaceDocument {
  return {
    schemaVersion: 1,
    editor: "tiptap",
    doc: normalizeDoc(doc),
    metadata: normalizeMetadata(metadata),
  };
}

export function createEmptyWorkspaceDocument(): WorkspaceDocument {
  return createWorkspaceDocument();
}

export function areWorkspaceDocumentsEqual(
  left: WorkspaceDocument,
  right: WorkspaceDocument,
) {
  return JSON.stringify(left) === JSON.stringify(right);
}
