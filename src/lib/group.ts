import { formatMonthYear } from "./format";
import type { SlotListItem } from "./types";

export function groupSlotsByMonth(slots: SlotListItem[]) {
  const map = new Map<string, SlotListItem[]>();
  for (const s of slots) {
    const key = s.date.slice(0, 7);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  }
  const keys = [...map.keys()].sort((a, b) => b.localeCompare(a));
  return keys.map((key) => ({
    key,
    label: formatMonthYear(key + "-01"),
    slots: map.get(key)!,
  }));
}
