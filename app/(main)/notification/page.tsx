'use client'
import React, { useEffect } from 'react'

const NotificationList = [
  {
    id: 1,
    type: 'follow',
    user: {
      id: 1,
      name: 'John Doe',
    }
  },
  {
    id: 2,
    type: 'like',
    user: {
      id: 2,
      name: 'Jane Doe',
    }
  }
]

const Notification = () => {
  const getType = (type: string) => {
    switch (type) {
      case 'follow':
        return 'からフォローされました';
      case 'like':
        return 'からいいねされました';
      case 'message':
        return 'からメッセージがきました';
        case 'gym':
          return 'が同じジムにいます';
      default:
        return '';
    }
  }

  useEffect(() => {
    const fetchNotification = async () => {
      const response = await fetch('/api/notifications');
      const data = await response.json();
      console.log(data);
    }
    fetchNotification();
  }, []);

  return (
    <div>
      {/* 通知一覧(実際は日時で並べ替え) */}
      <div>
        {NotificationList.map((notification) => (
          <div key={notification.id}>
            <p>{notification.user.name}さん{getType(notification.type)}</p>
          </div>
        ))}
      </div>

      {/* フォローのおすすめ */}
      <div>

      </div>
    </div>
  )
}

export default Notification
