"use server";

import { headers } from "next/headers";
import { getAppBaseUrl } from "@/lib/share-url";

export async function getRequestBaseUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (configured && !configured.includes("localhost")) {
    return configured;
  }

  const headerList = await headers();
  const host =
    headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "https";

  if (host && !host.includes("localhost")) {
    return `${proto}://${host}`;
  }

  return getAppBaseUrl();
}
