'use client'
import React, { useEffect } from 'react'
import Link from 'next/link'

const dms = [
    {
      dmId: 1,
      userName: 'user1',
      content: 'Content 1',
      createdAt: '2021-01-01',
      updatedAt: '2021-01-01',
    },
    {
      dmId: 2,
      userName: 'user2',
      content: 'Content 2',
      createdAt: '2021-01-01',
      updatedAt: '2021-01-01',
    },
  ]

const DMs = () => {
  useEffect(() => {
    const fetchDms = async () => {
      const response = await fetch('/api/pairs')
      const data = await response.json()
      console.log(data)
    }
    fetchDms()
  }, [])

  return (
    <div>
      {dms.map((dm) => (
        <div key={dm.dmId}>
          <Link href={`/dm/${dm.dmId}`}>{dm.userName}</Link>
        </div>
      ))}
    </div>
  )
}

export default DMs