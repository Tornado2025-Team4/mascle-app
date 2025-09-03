'use client'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRouter } from 'next/navigation'

const Explore = () => {
  const [search, setSearch] = useState('')
  const [searchType, setSearchType] = useState('user')
  const router = useRouter()

  const handleSearch = () => {
    if (searchType === 'user') {
      router.push(`/explore/user_search?search=${search}`)
    } else {
      router.push(`/explore/post_search?search=${search}`)
    }
  }
  return (
    <div>
      <h2>検索</h2>
      <div>
        <Input type="text" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={searchType} onValueChange={setSearchType}>
          <SelectTrigger>
            <SelectValue placeholder="Select a fruit" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>ユーザー</SelectLabel>
              <SelectItem value="user">ユーザー</SelectItem>
              <SelectItem value="post">投稿</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <Button onClick={() => handleSearch()}>検索</Button>
      </div>
    </div>
  )
}

export default Explore