'use client'
import React, { useEffect } from 'react'
import { useParams } from 'next/navigation'

const DM = () => {
  const dmId = useParams().dm_id;
  useEffect(() => {
    const fetchDm = async () => {
      const response = await fetch(`/api/pairs/${dmId}`)
      const data = await response.json()
      console.log(data)
    }
    fetchDm()
  }, [dmId])
  return (
    <div>
      <h1>DM {dmId}</h1>
    </div>
  )
}

export default DM
