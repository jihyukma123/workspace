import type { JSONContent } from "@tiptap/core";

export type CareerSignalKind =
  | "achievement"
  | "impact"
  | "skill"
  | "responsibility"
  | "learning";

export type CareerSignalMetric = {
  name: string;
  value: string;
};

export type CareerSignalPeriod = {
  from?: string;
  to?: string;
};

export type CareerSignal = {
  id: string;
  kind: CareerSignalKind;
  label: string;
  evidenceBlockIds: string[];
  skills?: string[];
  metrics?: CareerSignalMetric[];
  period?: CareerSignalPeriod;
  confidence?: "draft" | "reviewed";
};

export type DocumentMetadataValue = string | number | boolean | null;

export type DocumentMetadata = {
  tags: string[];
  properties?: Record<string, DocumentMetadataValue>;
  careerSignals?: CareerSignal[];
  source?: "user" | "migrated";
};

export type WorkspaceDocument = {
  schemaVersion: 1;
  editor: "tiptap";
  doc: JSONContent;
  metadata: DocumentMetadata;
};
