import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { isIconName, type IconName } from "@/components/ui/icon";
import { isResourceColorKey, type ResourceColorKey } from "@/constants/colors";

interface EntityIcon {
  name: string;
  icon: string;
  color?: string | null;
}

export function useEntityIcons(entityType: "category" | "tag") {
  const [icons, setIcons] = useState<Record<string, IconName>>({});
  const [colors, setColors] = useState<Record<string, ResourceColorKey>>({});

  const load = useCallback(async () => {
    try {
      const result = await invoke<EntityIcon[]>("get_entity_icons", { entityType });
      const record: Record<string, IconName> = {};
      const colorRecord: Record<string, ResourceColorKey> = {};
      for (const e of result) {
        if (isIconName(e.icon)) record[e.name] = e.icon;
        if (isResourceColorKey(e.color)) colorRecord[e.name] = e.color;
      }
      setIcons(record);
      setColors(colorRecord);
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

  const setColor = useCallback(
    async (name: string, color: ResourceColorKey) => {
      try {
        await invoke("set_entity_color", { entityType, entityName: name, color });
        setColors((prev) => ({ ...prev, [name]: color }));
      } catch (e) {
        console.error(`Failed to set ${entityType} color:`, e);
      }
    },
    [entityType],
  );

  const clearColor = useCallback(
    async (name: string) => {
      try {
        await invoke("clear_entity_color", { entityType, entityName: name });
        setColors((prev) => {
          const next = { ...prev };
          delete next[name];
          return next;
        });
      } catch (e) {
        console.error(`Failed to clear ${entityType} color:`, e);
      }
    },
    [entityType],
  );

  return { icons, colors, load, setIcon, clearIcon, setColor, clearColor };
}
