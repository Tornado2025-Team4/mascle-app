"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IoArrowBack } from 'react-icons/io5'
import { useRouter } from 'next/navigation'

export default function Print() {
  const router = useRouter()
  // useStateの型を<Capability | null>に指定
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleRefreshAccessToken = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Making request to /api/epson/auth/refresh');
      const response = await fetch('/api/epson/auth/refresh', {
        method: 'GET',
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        let errorMessage = 'トークン更新に失敗しました。';
        try {
          const errorText = await response.text();
          console.error('Error response text:', errorText);
          
          // JSONとして解析を試行
          try {
            const errData = JSON.parse(errorText);
            errorMessage = errData.message || errorMessage;
            console.error('Error response JSON:', errData);
          } catch (parseError) {
            // JSONでない場合はテキストをそのまま使用
            errorMessage = errorText || errorMessage;
          }
        } catch (readError) {
          console.error('Failed to read error response:', readError);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('Success response:', data);
      setAccessToken(data.access_token ?? null);
      setRefreshToken(data.refresh_token ?? null);

    } catch (err: unknown) {
      console.error('Error in handleRefreshAccessToken:', err);
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
      console.log('Making request to /api/epson/print/job');
      
      const response = await fetch('/api/epson/print/job', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          "jobName": "Proten",
          "printMode": "document",
          "printSettings": {
            "paperSize": "ps_a4",
            "paperType": "pt_plainpaper",
            "borderless": false,
            "printQuality": "normal",
            "paperSource": "auto",
            "colorMode": "color",
            "copies": 1
          }
        })
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        let errorMessage = '印刷ジョブの作成に失敗しました。';
        try {
          const errorText = await response.text();
          console.error('Error response text:', errorText);
          
          // JSONとして解析を試行
          try {
            const errData = JSON.parse(errorText);
            errorMessage = errData.message || errorMessage;
            console.error('Error response JSON:', errData);
          } catch (parseError) {
            // JSONでない場合はテキストをそのまま使用
            errorMessage = errorText || errorMessage;
          }
        } catch (readError) {
          console.error('Failed to read error response:', readError);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('Success response:', data);
      setJobId(data.jobId ?? null);
    } catch (err: unknown) {
      console.error('Error in handlePrintJob:', err);
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
      if (!file) {
        throw new Error('ファイルが選択されていません。');
      }
      
      console.log('Starting file upload...');
      console.log('File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      // ファイルをBase64に変換
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // data:application/pdf;base64, の部分を除去
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // アップロードキーはAPI側で環境変数から取得されるため、固定値を使用
      const key = 'upload-key-from-env';

      console.log('Upload parameters:', {
        key: key.substring(0, 20) + '...',
        fileName: file.name
      });

      const response = await fetch('/api/epson/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: key,
          fileData: fileData,
          fileName: file.name
        })
      });
      
      console.log('Upload response status:', response.status);
      console.log('Upload response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        let errorMessage = 'ファイルアップロードに失敗しました。';
        try {
          const errorText = await response.text();
          console.error('Error response text:', errorText);
          
          // JSONとして解析を試行
          try {
            const errData = JSON.parse(errorText);
            errorMessage = errData.message || errorMessage;
            console.error('Error response JSON:', errData);
          } catch (parseError) {
            // JSONでない場合はテキストをそのまま使用
            errorMessage = errorText || errorMessage;
          }
        } catch (readError) {
          console.error('Failed to read error response:', readError);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('Upload success response:', data);
      alert('ファイルが正常にアップロードされました。');
    } catch (err: unknown) {
      console.error('Error in handleUploadFile:', err);
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
      console.log('Making request to /api/epson/print');
      const response = await fetch('/api/epson/print', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('Print response status:', response.status);
      console.log('Print response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        let errorMessage = '印刷に失敗しました。';
        try {
          const errorText = await response.text();
          console.error('Error response text:', errorText);
          
          // JSONとして解析を試行
          try {
            const errData = JSON.parse(errorText);
            errorMessage = errData.message || errorMessage;
            console.error('Error response JSON:', errData);
          } catch (parseError) {
            // JSONでない場合はテキストをそのまま使用
            errorMessage = errorText || errorMessage;
          }
        } catch (readError) {
          console.error('Failed to read error response:', readError);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('Print success response:', data);
      alert('印刷が正常に実行されました！');
    } catch (err: unknown) {
      console.error('Error in handlePrint:', err);
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
    <div className="min-h-screen pb-[13vh]">
      <div className="container mx-auto px-4">
        {/* ヘッダー */}
        <header className="flex items-center justify-start px-4 pt-5">
          <button className="text-2xl" onClick={() => router.back()}>
            <IoArrowBack />
          </button>
        </header>
        <h1 className="text-3xl font-bold mb-3 px-4 p-3 text-center">名刺を印刷</h1>
        <div className="space-y-6">
                  {/* 認証セクション */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">認証</h2>
          <Button onClick={handleRefreshAccessToken} disabled={isLoading} className="bg-blue-500 text-white p-2 rounded-md cursor-pointer">
            {isLoading ? '取得中...' : 'アクセストークンを取得'}
          </Button>

          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              <p className="font-semibold">エラー:</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

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
          </div>

                  {/* ファイルアップロード */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">ファイルアップロード</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ファイルを選択してください
              </label>
              <Input 
                type="file" 
                accept=".pdf" 
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full"
              />
              {file && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-800">
                    選択されたファイル: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                </div>
              )}
            </div>
            <Button
              onClick={handleUploadFile}
              disabled={isLoading || !file}
              className="bg-green-500 text-white p-2 rounded-md cursor-pointer w-full disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'アップロード中...' : 'ファイルをアップロード'}
            </Button>
          </div>
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
    </div>
  );
}