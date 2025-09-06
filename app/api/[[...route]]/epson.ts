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
  try {
    console.log("Starting token refresh...");
    
    // 環境変数の確認
    const clientId = process.env.EPSON_CLIENT_ID;
    const clientSecret = process.env.EPSON_CLIENT_SECRET;
    const refreshToken = process.env.EPSON_REFRESH_TOKEN;
    
    console.log("Environment variables check:");
    console.log("CLIENT_ID exists:", !!clientId);
    console.log("CLIENT_SECRET exists:", !!clientSecret);
    console.log("REFRESH_TOKEN exists:", !!refreshToken);
    
    if (!clientId || !clientSecret || !refreshToken) {
      console.error("Missing environment variables");
      throw new HTTPException(500, { 
        message: "環境変数が設定されていません。EPSON_CLIENT_ID、EPSON_CLIENT_SECRET、EPSON_REFRESH_TOKENを確認してください。" 
      });
    }
    
    const credentials = btoa(`${clientId}:${clientSecret}`);
    console.log("Credentials created successfully");

    // URLエンコードされたフォームデータを作成
    const formData = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });

    console.log("Making request to Epson Connect...");
    const response = await fetch("https://auth.epsonconnect.com/auth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: formData.toString(),
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Token refresh failed:", errorBody);
      throw new HTTPException(response.status as ContentfulStatusCode, { 
        message: `Failed to refresh token: ${errorBody}` 
      });
    }

    const result = await response.json();
    console.log("Token refresh successful:", result);
    return c.json(result);
  } catch (error) {
    console.error("Error in /auth/refresh:", error);
    if (error instanceof HTTPException) {
      throw error;
    }
    throw new HTTPException(500, { 
      message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    });
  }
});

app.post("/print/job", async (c) => {
  try {
    console.log("Starting print job creation...");
    
    // 環境変数の確認
    const accessToken = process.env.EPSON_ACCESS_TOKEN;
    const apiKey = process.env.EPSON_API_KEY;
    
    console.log("Environment variables check:");
    console.log("ACCESS_TOKEN exists:", !!accessToken);
    console.log("API_KEY exists:", !!apiKey);
    
    if (!accessToken || !apiKey) {
      console.error("Missing environment variables");
      throw new HTTPException(500, { 
        message: "環境変数が設定されていません。EPSON_ACCESS_TOKEN、EPSON_API_KEYを確認してください。" 
      });
    }

    // リクエストボディから印刷設定を取得
    let printSettings;
    try {
      const contentType = c.req.header('content-type');
      console.log("Request content-type:", contentType);
      
      if (contentType?.includes('application/json')) {
        printSettings = await c.req.json();
        console.log("Print settings received:", printSettings);
      } else {
        console.log("No JSON body or wrong content-type, using defaults");
        printSettings = null;
      }
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      console.log("Using default print settings due to parse error");
      printSettings = null;
    }

    const requestBody = JSON.stringify(printSettings);
    console.log("Request body to Epson API:", requestBody);
    console.log("Request headers to Epson API:", {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken.substring(0, 20)}...`,
      "x-api-key": apiKey.substring(0, 10) + "...",
    });
    
    // Epson Connect APIの仕様を確認するための追加ログ
    console.log("Epson API URL:", "https://api.epsonconnect.com/api/2/printing/jobs");
    console.log("Final print settings structure:", JSON.stringify(printSettings, null, 2));

    const apiResponse = await fetch(
      "https://api.epsonconnect.com/api/2/printing/jobs",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "x-api-key": apiKey,
        },
        body: requestBody,
      }
    );

    console.log("Print API response status:", apiResponse.status);
    console.log("Print API response headers:", Object.fromEntries(apiResponse.headers.entries()));

    if (!apiResponse.ok) {
      const errorBody = await apiResponse.text();
      console.error("Print API failed:", errorBody);
      throw new HTTPException(apiResponse.status as ContentfulStatusCode, { 
        message: `印刷ジョブの作成に失敗しました: ${errorBody}` 
      });
    }

    const result = await apiResponse.json();
    console.log("Print job created successfully:", result);
    return c.json(result);
  } catch (error) {
    console.error("Error in /print/job:", error);
    if (error instanceof HTTPException) {
      throw error;
    }
    throw new HTTPException(500, { 
      message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    });
  }
});

/**
 * POST https://upload.epsonconnect.com/data の実装
 * ファイルアップロード用のAPIエンドポイント
 */
app.post("/upload", async (c) => {
  try {
    console.log("Starting file upload...");
    
    // 環境変数の確認
    const accessToken = process.env.EPSON_ACCESS_TOKEN;
    const apiKey = process.env.EPSON_API_KEY;
    const uploadUrl = process.env.EPSON_UPLOAD_URL;
    
    console.log("Environment variables check:");
    console.log("ACCESS_TOKEN exists:", !!accessToken);
    console.log("API_KEY exists:", !!apiKey);
    console.log("UPLOAD_URL exists:", !!uploadUrl);
    
    if (!accessToken || !apiKey || !uploadUrl) {
      console.error("Missing environment variables");
      throw new HTTPException(500, { 
        message: "環境変数が設定されていません。EPSON_ACCESS_TOKEN、EPSON_API_KEY、EPSON_UPLOAD_URLを確認してください。" 
      });
    }

    // リクエストボディからファイルアップロード情報を取得
    let uploadData;
    try {
      uploadData = await c.req.json();
      console.log("Upload data received:", uploadData);
    } catch (parseError) {
      console.error("Failed to parse upload data:", parseError);
      throw new HTTPException(400, { 
        message: "アップロードデータの解析に失敗しました。" 
      });
    }

    const { key, fileData, fileName } = uploadData;
    
    if (!key || !fileData || !fileName) {
      throw new HTTPException(400, { 
        message: "必須パラメータが不足しています。key、fileData、fileNameが必要です。" 
      });
    }

    // Base64データをバイナリに変換
    const binaryData = Buffer.from(fileData, 'base64');
    
    console.log("Upload parameters:", {
      key: key.substring(0, 20) + "...",
      fileName: fileName,
      fileSize: binaryData.length
    });

    // Epson Connectのアップロードエンドポイントにリクエスト
    console.log("Upload URL:", `${uploadUrl}&File=${encodeURIComponent(fileName)}`);

    const apiResponse = await fetch(`${uploadUrl}&File=${encodeURIComponent(fileName)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "x-api-key": apiKey,
        "Authorization": `Bearer ${accessToken}`,
      },
      body: binaryData,
    });

    console.log("Upload API response status:", apiResponse.status);
    console.log("Upload API response headers:", Object.fromEntries(apiResponse.headers.entries()));

    if (!apiResponse.ok) {
      const errorBody = await apiResponse.text();
      console.error("Upload API failed:", errorBody);
      throw new HTTPException(apiResponse.status as ContentfulStatusCode, { 
        message: `ファイルアップロードに失敗しました: ${errorBody}` 
      });
    }

    const result = await apiResponse.text();
    console.log("File upload successful:", result);
    return c.json({ success: true, message: "ファイルが正常にアップロードされました。" });
  } catch (error) {
    console.error("Error in /upload:", error);
    if (error instanceof HTTPException) {
      throw error;
    }
    throw new HTTPException(500, { 
      message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    });
  }
});

app.post("/print", async (c) => {
  try {
    console.log("Starting print job execution...");
    
    // 環境変数の確認
    const accessToken = process.env.EPSON_ACCESS_TOKEN;
    const apiKey = process.env.EPSON_API_KEY;
    const jobId = process.env.EPSON_JOB_ID;
    
    console.log("Environment variables check:");
    console.log("ACCESS_TOKEN exists:", !!accessToken);
    console.log("API_KEY exists:", !!apiKey);
    console.log("JOB_ID exists:", !!jobId);
    
    if (!accessToken || !apiKey || !jobId) {
      console.error("Missing environment variables");
      throw new HTTPException(500, { 
        message: "環境変数が設定されていません。EPSON_ACCESS_TOKEN、EPSON_API_KEY、EPSON_JOB_IDを確認してください。" 
      });
    }

    console.log("Executing print job for jobId:", jobId);
    console.log("Request headers to Epson API:", {
      Authorization: `Bearer ${accessToken.substring(0, 20)}...`,
      "x-api-key": apiKey.substring(0, 10) + "...",
    });

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

    console.log("Print API response status:", apiResponse.status);
    console.log("Print API response headers:", Object.fromEntries(apiResponse.headers.entries()));

    if (!apiResponse.ok) {
      const errorBody = await apiResponse.text();
      console.error("Print API failed:", errorBody);
      throw new HTTPException(apiResponse.status as ContentfulStatusCode, { 
        message: `印刷に失敗しました: ${errorBody}` 
      });
    }

    const result = await apiResponse.json();
    console.log("Print job executed successfully:", result);
    return c.json(result);
  } catch (error) {
    console.error("Error in /print:", error);
    if (error instanceof HTTPException) {
      throw error;
    }
    throw new HTTPException(500, { 
      message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    });
  }
});


export default app;