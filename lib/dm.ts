import { DMPair, DMDetail, DMHistory, SendMessageRequest, StartDMRequest } from '@/types/dm.type';

// DMリストを取得
export const fetchDMPairs = async (): Promise<DMPair[]> => {
  const response = await fetch('/api/dm/pairs');
  if (!response.ok) {
    throw new Error('DMリストの取得に失敗しました');
  }
  return response.json();
};

// DMを開始
export const startDM = async (request: StartDMRequest): Promise<{ dm_id: string }> => {
  const response = await fetch('/api/dm', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    throw new Error('DM開始に失敗しました');
  }
  return response.json();
};

// DM詳細を取得
export const fetchDMDetail = async (dmId: string): Promise<DMDetail> => {
  const response = await fetch(`/api/dm/${dmId}`);
  if (!response.ok) {
    throw new Error('DM詳細の取得に失敗しました');
  }
  return response.json();
};

// DM履歴を取得
export const fetchDMHistory = async (dmId: string): Promise<DMHistory[]> => {
  const response = await fetch(`/api/dm/${dmId}/histories`);
  if (!response.ok) {
    throw new Error('DM履歴の取得に失敗しました');
  }
  return response.json();
};

// メッセージを送信
export const sendMessage = async (dmId: string, request: SendMessageRequest): Promise<void> => {
  const response = await fetch(`/api/dm/${dmId}/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    throw new Error('メッセージの送信に失敗しました');
  }
};

// メッセージを削除
export const deleteMessage = async (dmId: string, messageId: string): Promise<void> => {
  const response = await fetch(`/api/dm/${dmId}/${messageId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('メッセージの削除に失敗しました');
  }
};
