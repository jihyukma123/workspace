export const PRIMARY_COLOR_STORAGE_KEY = "workspace.primaryColor" as const;

export const PRIMARY_COLOR_OPTIONS = [
  {
    id: "default",
    label: "Default (Teal)",
    cssVar: "--primary",
  },
  {
    id: "pantone-2025",
    label: "2025 · Mocha Mousse",
    cssVar: "--pantone-2025",
  },
  {
    id: "pantone-2024",
    label: "2024 · Peach Fuzz",
    cssVar: "--pantone-2024",
  },
  {
    id: "pantone-2023",
    label: "2023 · Viva Magenta",
    cssVar: "--pantone-2023",
  },
  {
    id: "pantone-2022",
    label: "2022 · Very Peri",
    cssVar: "--pantone-2022",
  },
  {
    id: "pantone-2021",
    label: "2021 · Illuminating",
    cssVar: "--pantone-2021",
  },
  {
    id: "pantone-2020",
    label: "2020 · Classic Blue",
    cssVar: "--pantone-2020",
  },
  {
    id: "pantone-2019",
    label: "2019 · Living Coral",
    cssVar: "--pantone-2019",
  },
  {
    id: "pantone-2018",
    label: "2018 · Ultra Violet",
    cssVar: "--pantone-2018",
  },
  {
    id: "pantone-2017",
    label: "2017 · Greenery",
    cssVar: "--pantone-2017",
  },
  {
    id: "pantone-2016",
    label: "2016 · Rose Quartz",
    cssVar: "--pantone-2016",
  },
] as const;

export type PrimaryColorId = (typeof PRIMARY_COLOR_OPTIONS)[number]["id"];

const primaryColorIdSet = new Set<string>(
  PRIMARY_COLOR_OPTIONS.map((option) => option.id),
);

export function isPrimaryColorId(value: string): value is PrimaryColorId {
  return primaryColorIdSet.has(value);
}

export function getStoredPrimaryColor(): PrimaryColorId | null {
  try {
    const stored = localStorage.getItem(PRIMARY_COLOR_STORAGE_KEY);
    if (!stored) {
      return null;
    }
    return isPrimaryColorId(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function storePrimaryColor(primaryColorId: PrimaryColorId | null): void {
  try {
    if (!primaryColorId) {
      localStorage.removeItem(PRIMARY_COLOR_STORAGE_KEY);
      return;
    }
    localStorage.setItem(PRIMARY_COLOR_STORAGE_KEY, primaryColorId);
  } catch {
    // no-op (private mode / disabled storage)
  }
}

export function applyPrimaryColorToDocument(
  primaryColorId: PrimaryColorId | null,
): void {
  if (typeof document === "undefined") {
    return;
  }
  const root = document.documentElement;
  if (!primaryColorId) {
    delete root.dataset.primary;
    return;
  }
  root.dataset.primary = primaryColorId;
}
