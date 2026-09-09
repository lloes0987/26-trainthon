import { NextResponse } from "next/server";
import {
  GOOGLE_FREEBUSY_SCOPE,
  encodeOAuthState,
  getGoogleOAuthConfig,
  googleCallbackUri,
} from "@/lib/google-oauth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const returnTo = url.searchParams.get("returnTo") || "/";
  const safeReturnTo =
    returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/";
  const config = getGoogleOAuthConfig();

  if (!config) {
    return NextResponse.redirect(
      new URL(`${safeReturnTo}?google_calendar=missing`, url.origin),
    );
  }

  const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  auth.searchParams.set("client_id", config.clientId);
  auth.searchParams.set("redirect_uri", googleCallbackUri(url.origin));
  auth.searchParams.set("response_type", "code");
  auth.searchParams.set("scope", GOOGLE_FREEBUSY_SCOPE);
  auth.searchParams.set("access_type", "online");
  auth.searchParams.set("prompt", "select_account");
  auth.searchParams.set("include_granted_scopes", "true");
  auth.searchParams.set("state", encodeOAuthState(safeReturnTo));

  return NextResponse.redirect(auth);
}
