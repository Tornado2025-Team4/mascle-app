"use client";

import { useState } from "react";

// APIレスポンスの型定義
type PaperType = {
  paperType: string;
  borderless: boolean;
  paperSources: string[];
  printQualities: string[];
  doubleSided: boolean;
};

type PaperSize = {
  paperSize: string;
  paperTypes: PaperType[];
};

type Capability = {
  colorModes: string[];
  resolutions: number[];
  paperSizes: PaperSize[];
};


export default function EpsonPage() {
  // useStateの型を<Capability | null>に指定
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [capability, setCapability] = useState<Capability | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetchCapability = async () => {
    setIsLoading(true);
    setError(null);
    setCapability(null);
    try {
      const response = await fetch('/api/epson/capability');
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'エラーが発生しました。');
      }
      const data = await response.json();
      setCapability(data);
      // catch句のエラーを 'unknown' 型で受け、型チェックを行う
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

  const handleRefreshAccessToken = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/epson/auth/refresh', {
        method: 'POST',
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'トークン更新に失敗しました。');
      }
      const data = await response.json();
      setAccessToken(data.access_token ?? null);
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
    <div>
      <button onClick={handleRefreshAccessToken} disabled={isLoading} className="bg-blue-500 text-white p-2 rounded-md cursor-pointer">
        {isLoading ? '取得中...' : 'アクセストークンを取得'}
      </button>

      {accessToken && (
        <p className="mt-2 text-sm text-gray-600">Access Token: {accessToken}</p>
      )}

      <h1>プリンター操作</h1>
      <button onClick={handleFetchCapability} disabled={isLoading} className="bg-blue-500 text-white p-2 rounded-md cursor-pointer">
        {isLoading ? '取得中...' : '印刷能力を取得'}
      </button>

      {error && <p style={{ color: 'red' }}>エラー: {error}</p>}

      {capability && (
        <div>
          <h2>印刷能力:</h2>
          <pre style={{ background: '#f4f4f4', padding: '1rem', borderRadius: '5px' }}>
            {JSON.stringify(capability, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}