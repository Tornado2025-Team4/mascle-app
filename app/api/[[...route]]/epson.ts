import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { getCookie, setCookie } from "hono/cookie";
import { ContentfulStatusCode } from "hono/utils/http-status";

const app = new Hono();

const refreshAccessToken = async (refreshToken: string) => {
  const clientId = process.env.EPSON_CLIENT_ID!;
  const clientSecret = process.env.EPSON_CLIENT_SECRET!;
  const credentials = btoa(`${clientId}:${clientSecret}`);

  const response = await fetch("https://auth.epsonconnect.com/auth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-w-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  console.log(response);

  if (!response.ok) {
    const errorBody = await response.json();
    console.error("Token refresh failed:", errorBody);
    throw new Error("Failed to refresh token");
  }

  return await response.json();
};

/**
 * POST https://auth.epsonconnect.com/auth/token の実装
 * Cookie内のリフレッシュトークンを使い、手動でトークンを更新するAPI
 */
app.post("/auth/refresh", async (c) => {
  const refreshToken = getCookie(c, "epson_refresh_token");
  if (!refreshToken) {
    throw new HTTPException(401, { message: "No refresh token found" });
  }

  try {
    const newTokens = await refreshAccessToken(refreshToken);

    // 新しいトークンをCookieに保存
    setCookie(c, "epson_access_token", newTokens.access_token, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: newTokens.expires_in,
    });
    setCookie(c, "epson_refresh_token", newTokens.refresh_token, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 60 * 60 * 24 * 30, // 30日
    });

    return c.json({ message: "Tokens refreshed successfully" });
  } catch (error) {
    throw new HTTPException(500, { message: "Failed to refresh tokens" });
  }
});

/**
 * GET https://api.epsonconnect.com/api/2/printing/capability/document の実装
 */
app.get("/capability", async (c) => {
  let accessToken = getCookie(c, "epson_access_token");
  const apiKey = process.env.EPSON_API_KEY!;

  if (!accessToken) {
    throw new HTTPException(401, { message: "Not authenticated" });
  }

  // 1. まず現在のアクセストークンでAPIを叩いてみる
  let apiResponse = await fetch(
    "https://api.epsonconnect.com/api/2/printing/capability/document",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "x-api-key": apiKey,
      },
    }
  );

  // 2. もし401エラー（トークン切れ）だったら、更新して再試行
  if (apiResponse.status === 401) {
    console.log("Access token expired. Attempting to refresh...");
    const refreshToken = getCookie(c, "epson_refresh_token");
    if (!refreshToken) {
      throw new HTTPException(401, { message: "Refresh token not found." });
    }

    try {
      const newTokens = await refreshAccessToken(refreshToken);

      // 新しいトークンをCookieにセット
      setCookie(c, "epson_access_token", newTokens.access_token, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Lax",
        maxAge: newTokens.expires_in,
      });
      setCookie(c, "epson_refresh_token", newTokens.refresh_token, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Lax",
        maxAge: 60 * 60 * 24 * 30, // 30日
      });

      accessToken = newTokens.access_token; // 新しいトークンをセット

      console.log("Token refreshed. Retrying API call...");
      // 新しいトークンでもう一度APIを叩く
      apiResponse = await fetch(
        "https://api.epsonconnect.com/api/2/printing/capability/document",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "x-api-key": apiKey,
          },
        }
      );
    } catch (error) {
      throw new HTTPException(401, {
        message: "Failed to refresh token and retry.",
      });
    }
  }

  // 3. 最終的な結果を返す
  if (!apiResponse.ok) {
    throw new HTTPException(apiResponse.status as ContentfulStatusCode, {
      message: "Failed to fetch capability",
    });
  }

  const data = await apiResponse.json();
  return c.json(data);
});

app.post("/auth/refresh", () => {
  const refreshToken = process.env.EPSON_REFRESH_TOKEN!;

  return refreshAccessToken(refreshToken);
});

export default app;