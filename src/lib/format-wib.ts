const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * Formats an ISO timestamp as `YYYY-MM-DD HH:MM[:SS] WIB` without relying on the browser locale.
 * Returns "-" for a missing value and the raw text when it is not a valid date.
 */
export function formatWib(value: string | null | undefined, options: { seconds?: boolean } = {}): string {
  if (!value) return "-";
  const time = Date.parse(value);
  if (Number.isNaN(time)) return value;
  const iso = new Date(time + WIB_OFFSET_MS).toISOString();
  const clock = options.seconds ? iso.slice(11, 19) : iso.slice(11, 16);
  return `${iso.slice(0, 10)} ${clock} WIB`;
}
