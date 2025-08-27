import React from 'react'
import { useParams } from 'next/navigation'

// 仮のデータ
const follows = [
  { id: 1, name: 'フォロー1' },
  { id: 2, name: 'フォロー2' },
  { id: 3, name: 'フォロー3' },
]

const Follows = () => {
  const userId = useParams().userId;
  return (
    <div>
      <h2>フォロー</h2>
      <div>
        {follows.map((follow) => (
          <div key={follow.id}>
            <h3>{follow.name}</h3>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Follows
