"use client";

import { useCallback, useMemo, useState } from "react";

export function useSelection() {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);

  const ids = useMemo(() => Array.from(selected), [selected]);

  return {
    selectedIds: selected,
    ids,
    count: selected.size,
    isActive: selected.size > 0,
    toggle,
    clear,
    isSelected: (id: string) => selected.has(id),
  };
}
