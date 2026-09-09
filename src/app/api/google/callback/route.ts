import { NextResponse } from "next/server";
import {
  GOOGLE_TOKEN_COOKIE,
  decodeOAuthState,
  getGoogleOAuthConfig,
  googleCallbackUri,
} from "@/lib/google-oauth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const returnTo = decodeOAuthState(url.searchParams.get("state"));
  const code = url.searchParams.get("code");
  const config = getGoogleOAuthConfig();

  if (!config || !code) {
    const flag = code ? "error" : "denied";
    return NextResponse.redirect(
      new URL(`${returnTo}?google_calendar=${flag}`, url.origin),
    );
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: googleCallbackUri(url.origin),
      grant_type: "authorization_code",
    }),
  });

  const tokenJson = (await tokenResponse.json()) as {
    access_token?: string;
    expires_in?: number;
  };

  if (!tokenJson.access_token) {
    return NextResponse.redirect(
      new URL(`${returnTo}?google_calendar=error`, url.origin),
    );
  }

  const response = NextResponse.redirect(
    new URL(`${returnTo}?google_calendar=1`, url.origin),
  );
  response.cookies.set(GOOGLE_TOKEN_COOKIE, tokenJson.access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: url.protocol === "https:",
    path: "/",
    maxAge: Math.min(tokenJson.expires_in ?? 1800, 1800),
  });
  return response;
}
