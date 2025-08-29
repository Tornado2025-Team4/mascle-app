import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { ContentfulStatusCode } from "hono/utils/http-status";

const app = new Hono();

app.get("/", (c) => {
  return c.json({ message: "Hello, World!" });
});

/**
 * POST https://auth.epsonconnect.com/auth/token の実装
 * Cookie内のリフレッシュトークンを使い、手動でトークンを更新するAPI
 */
app.get("/auth/refresh", async (c) => {
  const clientId = process.env.EPSON_CLIENT_ID!;
  const clientSecret = process.env.EPSON_CLIENT_SECRET!;
  const credentials = btoa(`${clientId}:${clientSecret}`);
  const refreshToken = process.env.EPSON_REFRESH_TOKEN!;

  const response = await fetch("https://auth.epsonconnect.com/auth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-w-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify({
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

  return c.json(await response.json());
});

/**
 * GET https://api.epsonconnect.com/api/2/printing/capability/document の実装
 */

app.get("/capability", async (c) => {
  const accessToken = process.env.EPSON_ACCESS_TOKEN!;
  const apiKey = process.env.EPSON_API_KEY!;

  if (!accessToken) {
    throw new HTTPException(401, { message: "Not authenticated" });
  }

  const apiResponse = await fetch(
    "https://api.epsonconnect.com/api/2/printing/capability/document",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "x-api-key": apiKey,
      },
    }
  );

  return c.json(await apiResponse.json());
});

app.post("/print/job", async (c) => {
  const accessToken = process.env.EPSON_ACCESS_TOKEN!;
  const apiKey = process.env.EPSON_API_KEY!;

  // リクエストボディから印刷設定を取得
  const printSettings = await c.req.json();

  const apiResponse = await fetch(
    "https://api.epsonconnect.com/api/2/printing/jobs",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "x-api-key": apiKey,
      },
      body: printSettings,
    }
  );

  if (!apiResponse.ok) {
    const errorBody = await apiResponse.json();
    console.error("Print API failed:", errorBody);
    throw new HTTPException(apiResponse.status as ContentfulStatusCode, { 
      message: errorBody.message || "印刷に失敗しました" 
    });
  }

  return c.json(await apiResponse.json());
});

app.post("/print/:jobId", async (c) => {
  const jobId = c.req.param("jobId");
  const accessToken = process.env.EPSON_ACCESS_TOKEN!;
  const apiKey = process.env.EPSON_API_KEY!;

  const apiResponse = await fetch(
    `https://api.epsonconnect.com/api/2/printing/jobs/${jobId}/print`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "x-api-key": apiKey,
      },
    }
  );

  if (!apiResponse.ok) {
    const errorBody = await apiResponse.json();
    console.error("Print API failed:", errorBody);
    throw new HTTPException(apiResponse.status as ContentfulStatusCode, { 
      message: errorBody.message || "印刷に失敗しました" 
    });
  }

  return c.json(await apiResponse.json());
});
export default app;
