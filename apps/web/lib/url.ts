import { headers } from "next/headers";

export function baseUrl() {
  const h = headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${h.get("host")}`;
}
