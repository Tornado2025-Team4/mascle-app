"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function EpsonPage() {
  // useStateの型を<Capability | null>に指定
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [uploadUri, setUploadUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  // 印刷設定の状態
  const printSettings = {
    jobName: "Proten",
    printMode: "document",
    printSettings: {
      paperSize: "ps_a4",
      paperType: "pt_plainpaper",
      borderless: false,
      printQuality: "normal",
      paperSource: "rear",
      colorMode: "color",
      copies: 1,
    },
  };

  const handleRefreshAccessToken = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/epson/auth/refresh', {
        method: 'GET',
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'トークン更新に失敗しました。');
      }
      const data = await response.json();
      console.log(data);
      setAccessToken(data.access_token ?? null);
      setRefreshToken(data.refresh_token ?? null);

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('予期せぬエラーが発生しました。');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintJob = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/epson/print/job', { method: 'POST' });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || '印刷に失敗しました。');
      }
      const data = await response.json();
      console.log(data);
      setJobId(data.jobId ?? null);
      setUploadUri(data.uploadUri ?? null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('予期せぬエラーが発生しました。');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadFile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!uploadUri) {
        throw new Error('アップロードURIがありません。');
      }
      const response = await fetch(`${uploadUri}&file=${file}`, {
        method: 'POST',
        body: file,
        headers: {
          'Content-Type': 'application/pdf',
        },
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'ファイルアップロードに失敗しました。');
      }
      const data = await response.json();
      console.log(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('予期せぬエラーが発生しました。');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!jobId) {
        throw new Error('ジョブIDがありません。');
      }
      const response = await fetch(`/api/epson/print/${jobId}`, {
        method: 'POST',
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || '印刷に失敗しました。');
      }
      const data = await response.json();
      console.log(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('予期せぬエラーが発生しました。');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">エプソンプリンター操作</h1>
      <div className="space-y-6">
        {/* 認証セクション */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">認証</h2>
          <Button onClick={handleRefreshAccessToken} disabled={isLoading} className="bg-blue-500 text-white p-2 rounded-md cursor-pointer">
            {isLoading ? '取得中...' : 'アクセストークンを取得'}
          </Button>

          {accessToken && (
            <p className="mt-2 text-sm text-gray-600">Access Token: {accessToken}</p>
          )}

          {refreshToken && (
            <p className="mt-2 text-sm text-gray-600">Refresh Token: {refreshToken}</p>
          )}
        </div>

        {/* 印刷ジョブ作成 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">印刷ジョブ作成</h2>
          <Button
            onClick={handlePrintJob}
            disabled={isLoading}
            className="mt-4 bg-red-500 text-white p-2 rounded-md cursor-pointer w-full"
          >
            {isLoading ? '作成中...' : '印刷ジョブを作成'}
          </Button>

          {jobId && (
            <p className="mt-2 text-sm text-gray-600">Job ID: {jobId}</p>
          )}

          {uploadUri && (
            <p className="mt-2 text-sm text-gray-600">Upload URI: {uploadUri}</p>
          )}
        </div>

        {/* ファイルアップロード */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">ファイルアップロード</h2>
          <Input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <Button
            onClick={handleUploadFile}
            disabled={isLoading}
            className="mt-4 bg-green-500 text-white p-2 rounded-md cursor-pointer w-full"
          >
            {isLoading ? 'アップロード中...' : 'ファイルをアップロード'}
          </Button>
        </div>

        {/* 印刷実行 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">印刷実行</h2>
          <Button
            onClick={handlePrint}
            disabled={isLoading}
            className="mt-4 bg-blue-500 text-white p-2 rounded-md cursor-pointer w-full"
          >
            {isLoading ? '印刷中...' : '印刷実行'}
          </Button>
        </div>
      </div>
    </div>
  );
}