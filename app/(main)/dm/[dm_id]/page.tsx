'use client'
import React, { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { IoChevronBack } from "react-icons/io5";
import { IoPaperPlane } from "react-icons/io5";
import { DMHistory } from '@/types/dm.type';

// テストデータ
const testMessages: DMHistory[] = [
  {
    message_id: "msg-001",
    user_id: "user-001",
    message: "お疲れ様です！今日のトレーニングどうでしたか？",
    created_at: "2024-01-15T14:30:00Z",
  },
  {
    message_id: "msg-002", 
    user_id: "current-user",
    message: "お疲れ様です！胸のトレーニングを頑張りました。ベンチプレスで新記録が出ました！",
    created_at: "2024-01-15T14:32:00Z",
  },
  {
    message_id: "msg-003",
    user_id: "user-001", 
    message: "すごいですね！おめでとうございます！",
    created_at: "2024-01-15T14:35:00Z",
  },
  {
    message_id: "msg-004",
    user_id: "user-001",
    message: "今度一緒にトレーニングしませんか？",
    created_at: "2024-01-15T14:36:00Z",
  },
];

const DM = () => {
  const dmId = useParams().dm_id;
  const router = useRouter();
  const [messages, setMessages] = useState<DMHistory[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        setLoading(true);
        // テストデータを使用
        await new Promise(resolve => setTimeout(resolve, 500));
        setMessages(testMessages);
        
        // 実際のAPI呼び出し（コメントアウト）
        // const response = await fetch(`/api/dm/${dmId}/histories`)
        // const data = await response.json()
        // setMessages(data)
      } catch (err) {
        console.error('メッセージ取得エラー:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMessages();
  }, [dmId]);

  // メッセージ送信
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const tempMessage: DMHistory = {
      message_id: `temp-${Date.now()}`,
      user_id: "current-user",
      message: newMessage,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    
    // メッセージ送信API呼び出し（コメントアウト）
    // try {
    //   await fetch(`/api/dm/${dmId}/send`, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ message: newMessage })
    //   });
    // } catch (err) {
    //   console.error('メッセージ送信エラー:', err);
    // }
  };

  // メッセージ一覧の自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* ヘッダー */}
      <header className="flex items-center justify-start px-4 pt-5 pb-3 border-b border-black flex-shrink-0">
        <button className="text-2xl text-black" onClick={() => router.back()}>
          <IoChevronBack />
        </button>
        <div className="flex items-center gap-3 ml-4">
          <div className="w-10 h-10 bg-black rounded-full overflow-hidden flex-shrink-0">
            <Image
              src="/images/image.png"
              alt="プロフィール画像"
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-black">田中太郎</h1>
          </div>
        </div>
      </header>

      {/* メッセージ一覧 - スクロール可能エリア */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-black">読み込み中...</div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.message_id}
              className={`flex ${message.user_id === "current-user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.user_id === "current-user"
                    ? "bg-black text-white"
                    : "bg-white text-black border border-black"
                }`}
              >
                <p className="text-sm">{message.message}</p>
                <p className={`text-xs mt-1 ${
                  message.user_id === "current-user" ? "text-gray-300" : "text-gray-600"
                }`}>
                  {new Date(message.created_at).toLocaleTimeString('ja-JP', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* メッセージ入力フォーム - footerの上に固定 */}
      <div className="fixed bottom-[10vh] left-0 right-0 bg-white border-t border-black p-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="メッセージを入力..."
            className="flex-1 px-4 py-2 border border-black rounded-full focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white text-black placeholder-gray-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="p-2 bg-black text-white rounded-full hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <IoPaperPlane className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default DM