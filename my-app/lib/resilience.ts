export const DEFAULT_ROOMS = ["CE-401", "CE-402"];

export const DEFAULT_SYSTEM_SETTINGS: Record<string, string> = {
  auto_approve_enabled: "0",
  auto_approve_start_time: "09:00",
  auto_approve_end_time: "16:00",
  auto_approve_days: "1,2,3,4,5",
  discord_webhook_register: "",
  discord_webhook_approve: "",
  discord_webhook_logs: "",
  auto_fill_enabled: "1",
  auto_fill_mode: "auto",
  configured_rooms: DEFAULT_ROOMS.join(","),
  "room_ip_CE-401": "192.168.1.100",
  "room_ip_CE-402": "192.168.1.101",
  "room_webhook_register_CE-401": "",
  "room_webhook_approve_CE-401": "",
  "room_webhook_logs_CE-401": "",
  student_id_display_mode: "full",
};

export type DependencyState = "online" | "degraded" | "offline";

export function parseConfiguredRooms(settings: Record<string, string>): string[] {
  const raw = settings.configured_rooms || DEFAULT_SYSTEM_SETTINGS.configured_rooms;
  const rooms = raw
    .split(",")
    .map((room) => room.trim())
    .filter(Boolean);
  return rooms.length > 0 ? rooms : DEFAULT_ROOMS;
}

export function getFallbackSettings(): Record<string, string> {
  return { ...DEFAULT_SYSTEM_SETTINGS };
}

export function getDependencyState(states: boolean[]): DependencyState {
  const onlineCount = states.filter(Boolean).length;
  if (onlineCount === states.length) return "online";
  if (onlineCount === 0) return "offline";
  return "degraded";
}
