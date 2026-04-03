export type LogLevel = "info" | "warn" | "error" | "ok";

interface ActivityLogItemProps {
  timestamp: string;
  message: string;
  level?: LogLevel;
}

const LEVEL_STYLES: Record<LogLevel, string> = {
  info: "text-muted-foreground",
  warn: "text-[#f59e0b]",
  error: "text-[#dc2626]",
  ok: "text-[#00a2f4]",
};

const LEVEL_PREFIX: Record<LogLevel, string> = {
  info: "INFO",
  warn: "WARN",
  error: "ERR ",
  ok: "OK  ",
};

export function ActivityLogItem({ timestamp, message, level = "info" }: ActivityLogItemProps) {
  return (
    <div className="flex gap-3 border-b border-[#27272a]/40 py-2 last:border-0">
      <span className="shrink-0 font-mono text-[10px] text-muted-foreground/60">{timestamp}</span>
      <span className={`shrink-0 font-mono text-[10px] font-bold ${LEVEL_STYLES[level]}`}>
        [{LEVEL_PREFIX[level]}]
      </span>
      <span className="font-mono text-[11px] text-muted-foreground">{message}</span>
    </div>
  );
}
