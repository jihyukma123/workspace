import { useCallback, useEffect, useState } from "react";
import {
  applyPrimaryColorToDocument,
  getStoredPrimaryColor,
  storePrimaryColor,
  type PrimaryColorId,
} from "@/lib/primary-color";

export function usePrimaryColor() {
  const [primaryColorId, setPrimaryColorId] = useState<PrimaryColorId | null>(
    () => {
      if (typeof window === "undefined") {
        return null;
      }
      return getStoredPrimaryColor();
    },
  );

  useEffect(() => {
    applyPrimaryColorToDocument(primaryColorId);
    storePrimaryColor(primaryColorId);
  }, [primaryColorId]);

  const resetPrimaryColor = useCallback(() => {
    setPrimaryColorId(null);
  }, []);

  const setPrimaryColor = useCallback((next: PrimaryColorId) => {
    setPrimaryColorId(next);
  }, []);

  return {
    primaryColorId,
    setPrimaryColor,
    resetPrimaryColor,
  };
}

