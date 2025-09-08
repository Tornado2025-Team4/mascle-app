'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';

interface User {
  id: string
  name: string
  icon: string
}

const UserSearchContent = () => {
  const searchParams = useSearchParams()
  const search = searchParams.get('search')
  const [data, setData] = useState<User[]>([])

  // ユーザー検索処理(API実装によって変更する部分)
  useEffect(() => {
    const handleSearch = async () => {
      const result = await fetch(`/api/user/search?search=${search}`)
      const data = await result.json()
      setData(data.data)
    }
    if (search) {
      handleSearch()
    }
  }, [search])

  return (
    <div>
      <h2>ユーザー検索結果</h2>
      <div>
        {data.map((user: User) => (
          <div key={user.id}>
            <Image src={user.icon} alt={user.name} width={100} height={100} />
            {user.name}
          </div>
        ))}
      </div>
    </div>
  )
}

const UserSearch = () => {
  return (
    <Suspense fallback={<div>検索中...</div>}>
      <UserSearchContent />
    </Suspense>
  )
}

export default UserSearch
