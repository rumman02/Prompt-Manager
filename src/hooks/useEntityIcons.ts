import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { isIconName, type IconName } from "@/components/ui/icon";

interface EntityIcon {
  name: string;
  icon: string;
}

export function useEntityIcons(entityType: "category" | "tag") {
  const [icons, setIcons] = useState<Record<string, IconName>>({});

  const load = useCallback(async () => {
    try {
      const result = await invoke<EntityIcon[]>("get_entity_icons", { entityType });
      const record: Record<string, IconName> = {};
      for (const e of result) {
        if (isIconName(e.icon)) record[e.name] = e.icon;
      }
      setIcons(record);
    } catch (e) {
      console.error(`Failed to load ${entityType} icons:`, e);
    }
  }, [entityType]);

  useEffect(() => {
    load();
  }, [load]);

  const setIcon = useCallback(
    async (name: string, icon: IconName) => {
      try {
        await invoke("set_entity_icon", { entityType, entityName: name, icon });
        setIcons((prev) => ({ ...prev, [name]: icon }));
      } catch (e) {
        console.error(`Failed to set ${entityType} icon:`, e);
      }
    },
    [entityType],
  );

  const clearIcon = useCallback(
    async (name: string) => {
      try {
        await invoke("clear_entity_icon", { entityType, entityName: name });
        setIcons((prev) => {
          const next = { ...prev };
          delete next[name];
          return next;
        });
      } catch (e) {
        console.error(`Failed to clear ${entityType} icon:`, e);
      }
    },
    [entityType],
  );

  return { icons, load, setIcon, clearIcon };
}
