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

const joinNonEmpty = (parts, separator) =>
  parts.filter((part) => typeof part === "string" && part.length > 0).join(separator);

const createBlockId = () => `blk_${Math.random().toString(36).slice(2, 10)}`;

const cloneNode = (node) => ({
  ...node,
  attrs: node?.attrs ? { ...node.attrs } : undefined,
  marks: Array.isArray(node?.marks)
    ? node.marks.map((mark) => ({
        ...mark,
        attrs: mark?.attrs ? { ...mark.attrs } : undefined,
      }))
    : undefined,
  content: Array.isArray(node?.content)
    ? node.content.map((child) => cloneNode(child))
    : undefined,
});

const ensureBlockIds = (node) => {
  const nextNode = cloneNode(node);
  if (nextNode?.type && BLOCK_NODE_TYPES.has(nextNode.type)) {
    nextNode.attrs = {
      ...(nextNode.attrs ?? {}),
      blockId:
        typeof nextNode.attrs?.blockId === "string" && nextNode.attrs.blockId.trim().length > 0
          ? nextNode.attrs.blockId
          : createBlockId(),
    };
  }

  if (Array.isArray(nextNode.content)) {
    nextNode.content = nextNode.content.map((child) => ensureBlockIds(child));
  }

  return nextNode;
};

const normalizeMetadata = (metadata) => ({
  tags: Array.isArray(metadata?.tags)
    ? metadata.tags.filter((tag) => typeof tag === "string" && tag.trim().length > 0)
    : [],
  properties:
    metadata?.properties && typeof metadata.properties === "object"
      ? { ...metadata.properties }
      : undefined,
  careerSignals: Array.isArray(metadata?.careerSignals)
    ? metadata.careerSignals.map((signal) => ({
        ...signal,
        evidenceBlockIds: Array.isArray(signal?.evidenceBlockIds)
          ? [...signal.evidenceBlockIds]
          : [],
        skills: Array.isArray(signal?.skills) ? [...signal.skills] : undefined,
        metrics: Array.isArray(signal?.metrics)
          ? signal.metrics.map((metric) => ({ ...metric }))
          : undefined,
        period: signal?.period ? { ...signal.period } : undefined,
      }))
    : undefined,
  source: metadata?.source,
});

const createParagraphNode = (text = "") => ({
  type: "paragraph",
  attrs: { blockId: createBlockId() },
  content: text ? [{ type: "text", text }] : [],
});

export const createWorkspaceDocument = (doc, metadata) => {
  const root =
    doc && doc.type === "doc"
      ? ensureBlockIds(doc)
      : {
          type: "doc",
          content: [createParagraphNode()],
        };

  if (!Array.isArray(root.content) || root.content.length === 0) {
    root.content = [createParagraphNode()];
  }

  return {
    schemaVersion: 1,
    editor: "tiptap",
    doc: root,
    metadata: normalizeMetadata(metadata),
  };
};

const getNodeText = (node) => {
  if (!node) {
    return "";
  }

  if (node.type === "text") {
    return node.text ?? "";
  }

  if (node.type === "hardBreak") {
    return "\n";
  }

  const children = Array.isArray(node.content) ? node.content.map(getNodeText) : [];

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
};

export const getPlainTextFromWorkspaceDocument = (document) =>
  getNodeText(document.doc).replace(/\n{3,}/g, "\n\n").trim();

const makeTextNode = (text) => ({ type: "text", text });

const makeParagraphNode = (text) => ({
  type: "paragraph",
  attrs: { blockId: createBlockId() },
  content: text ? [makeTextNode(text)] : [],
});

const makeHeadingNode = (level, text) => ({
  type: "heading",
  attrs: { level, blockId: createBlockId() },
  content: text ? [makeTextNode(text)] : [],
});

const makeCodeBlockNode = (text) => ({
  type: "codeBlock",
  attrs: { blockId: createBlockId() },
  content: text ? [makeTextNode(text)] : [],
});

const makeBlockquoteNode = (text) => ({
  type: "blockquote",
  attrs: { blockId: createBlockId() },
  content: [makeParagraphNode(text)],
});

const makeBulletListNode = (items) => ({
  type: "bulletList",
  attrs: { blockId: createBlockId() },
  content: items.map((text) => ({
    type: "listItem",
    attrs: { blockId: createBlockId() },
    content: [makeParagraphNode(text)],
  })),
});

const makeOrderedListNode = (items) => ({
  type: "orderedList",
  attrs: { blockId: createBlockId() },
  content: items.map((text) => ({
    type: "listItem",
    attrs: { blockId: createBlockId() },
    content: [makeParagraphNode(text)],
  })),
});

const makeTaskListNode = (items) => ({
  type: "taskList",
  attrs: { blockId: createBlockId() },
  content: items.map((item) => ({
    type: "taskItem",
    attrs: {
      blockId: createBlockId(),
      checked: item.checked,
    },
    content: [makeParagraphNode(item.text)],
  })),
});

export const legacyMarkdownToWorkspaceDocument = (content) => {
  const lines = String(content ?? "").replace(/\r\n/g, "\n").split("\n");
  const nodes = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (trimmed === "```" || trimmed.startsWith("```")) {
      index += 1;
      const codeLines = [];
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) {
        index += 1;
      }
      nodes.push(makeCodeBlockNode(codeLines.join("\n")));
      continue;
    }

    if (line.startsWith("### ")) {
      nodes.push(makeHeadingNode(3, line.slice(4).trim()));
      index += 1;
      continue;
    }

    if (line.startsWith("## ")) {
      nodes.push(makeHeadingNode(2, line.slice(3).trim()));
      index += 1;
      continue;
    }

    if (line.startsWith("# ")) {
      nodes.push(makeHeadingNode(1, line.slice(2).trim()));
      index += 1;
      continue;
    }

    if (line.startsWith("> ")) {
      nodes.push(makeBlockquoteNode(line.slice(2).trim()));
      index += 1;
      continue;
    }

    if (/^(\- |\* )\[( |x|X)?\]\s*/.test(line) || /^\[( |x|X)?\]\s*/.test(line)) {
      const items = [];
      while (index < lines.length) {
        const currentLine = lines[index];
        const prefixedTaskMatch = currentLine.match(/^(\- |\* )\[( |x|X)?\]\s*(.*)$/);
        const plainTaskMatch = currentLine.match(/^\[( |x|X)?\]\s*(.*)$/);
        if (!prefixedTaskMatch && !plainTaskMatch) {
          break;
        }
        const checkedValue = prefixedTaskMatch
          ? prefixedTaskMatch[2]
          : plainTaskMatch?.[1];
        const textValue = prefixedTaskMatch
          ? prefixedTaskMatch[3]
          : plainTaskMatch?.[2];
        items.push({
          checked: checkedValue === "x" || checkedValue === "X",
          text: (textValue ?? "").trim(),
        });
        index += 1;
      }
      nodes.push(makeTaskListNode(items));
      continue;
    }

    if (/^(\- |\* )/.test(line)) {
      const items = [];
      while (index < lines.length) {
        const currentLine = lines[index];
        const bulletMatch = currentLine.match(/^(\- |\* )(.*)$/);
        if (!bulletMatch) {
          break;
        }
        items.push((bulletMatch[2] ?? "").trim());
        index += 1;
      }
      nodes.push(makeBulletListNode(items));
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (index < lines.length) {
        const currentLine = lines[index];
        const orderedMatch = currentLine.match(/^\d+\.\s+(.*)$/);
        if (!orderedMatch) {
          break;
        }
        items.push((orderedMatch[1] ?? "").trim());
        index += 1;
      }
      nodes.push(makeOrderedListNode(items));
      continue;
    }

    const paragraphLines = [trimmed];
    index += 1;
    while (index < lines.length) {
      const nextLine = lines[index];
      const nextTrimmed = nextLine.trim();
      if (
        !nextTrimmed ||
        nextLine.startsWith("# ") ||
        nextLine.startsWith("## ") ||
        nextLine.startsWith("### ") ||
        nextLine.startsWith("> ") ||
        /^(\- |\* )/.test(nextLine) ||
        /^\d+\.\s+/.test(nextLine) ||
        nextTrimmed.startsWith("```") ||
        /^\[( |x|X)?\]\s*/.test(nextLine)
      ) {
        break;
      }
      paragraphLines.push(nextTrimmed);
      index += 1;
    }
    nodes.push(makeParagraphNode(paragraphLines.join(" ")));
  }

  return createWorkspaceDocument(
    {
      type: "doc",
      content: nodes.length > 0 ? nodes : [createParagraphNode()],
    },
    { source: "migrated" },
  );
};

export const parseWorkspaceDocumentFromRow = (row) => {
  let parsedDocument = null;

  if (typeof row.content_json === "string" && row.content_json.trim().length > 0) {
    try {
      parsedDocument = JSON.parse(row.content_json);
    } catch {
      parsedDocument = null;
    }
  }

  const document = parsedDocument
    ? createWorkspaceDocument(parsedDocument.doc, parsedDocument.metadata)
    : legacyMarkdownToWorkspaceDocument(row.content ?? "");

  const contentText =
    typeof row.content_text === "string" && row.content_text.trim().length > 0
      ? row.content_text
      : getPlainTextFromWorkspaceDocument(document);

  return {
    document,
    contentText,
    contentSchemaVersion: Number.isFinite(row.content_schema_version)
      ? row.content_schema_version
      : 1,
  };
};

export const getDocumentStorageFields = (document) => {
  const normalized = createWorkspaceDocument(document?.doc, document?.metadata);
  const contentText = getPlainTextFromWorkspaceDocument(normalized);

  return {
    document: normalized,
    contentJson: JSON.stringify(normalized),
    contentText,
    contentSchemaVersion: normalized.schemaVersion,
  };
};

export const backfillLegacyDocumentColumns = (db) => {
  const selectWikiRows = db.prepare(
    `SELECT id, content, content_json, content_text, content_schema_version
     FROM wiki_pages
     WHERE content_json IS NULL OR TRIM(content_json) = ''`,
  );
  const selectMemoRows = db.prepare(
    `SELECT id, content, content_json, content_text, content_schema_version
     FROM memos
     WHERE content_json IS NULL OR TRIM(content_json) = ''`,
  );
  const selectDailyLogRows = db.prepare(
    `SELECT id, content, content_json, content_text, content_schema_version
     FROM daily_logs
     WHERE content_json IS NULL OR TRIM(content_json) = ''`,
  );

  const updateWikiRow = db.prepare(
    `UPDATE wiki_pages
     SET content = ?, content_json = ?, content_text = ?, content_schema_version = ?
     WHERE id = ?`,
  );
  const updateMemoRow = db.prepare(
    `UPDATE memos
     SET content = ?, content_json = ?, content_text = ?, content_schema_version = ?
     WHERE id = ?`,
  );
  const updateDailyLogRow = db.prepare(
    `UPDATE daily_logs
     SET content = ?, content_json = ?, content_text = ?, content_schema_version = ?
     WHERE id = ?`,
  );

  const transaction = db.transaction(() => {
    for (const row of selectWikiRows.all()) {
      const storage = getDocumentStorageFields(legacyMarkdownToWorkspaceDocument(row.content ?? ""));
      updateWikiRow.run(
        storage.contentText,
        storage.contentJson,
        storage.contentText,
        storage.contentSchemaVersion,
        row.id,
      );
    }

    for (const row of selectMemoRows.all()) {
      const storage = getDocumentStorageFields(legacyMarkdownToWorkspaceDocument(row.content ?? ""));
      updateMemoRow.run(
        storage.contentText,
        storage.contentJson,
        storage.contentText,
        storage.contentSchemaVersion,
        row.id,
      );
    }

    for (const row of selectDailyLogRows.all()) {
      const storage = getDocumentStorageFields(legacyMarkdownToWorkspaceDocument(row.content ?? ""));
      updateDailyLogRow.run(
        storage.contentText,
        storage.contentJson,
        storage.contentText,
        storage.contentSchemaVersion,
        row.id,
      );
    }
  });

  transaction();
};
