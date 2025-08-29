'use client'
import React from 'react'
import { useParams } from 'next/navigation'

const PhotoIndex = () => {
  const photoIndex = useParams().photo_index;
  return (
    <div>
      <h1>Photo {photoIndex}</h1>
    </div>
  )
}

export default PhotoIndex
