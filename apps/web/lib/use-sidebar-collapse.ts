"use client";
import { useEffect, useState } from "react";

/** Replié/déplié persisté en local — pas de mismatch d'hydratation : on démarre déplié puis on lit le localStorage après le mount. */
export function useSidebarCollapse(key: string) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(key) === "1") setCollapsed(true);
  }, [key]);

  function toggle() {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem(key, next ? "1" : "0");
      return next;
    });
  }

  return { collapsed, toggle };
}
