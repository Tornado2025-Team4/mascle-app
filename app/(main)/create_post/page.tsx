import React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const CreatePost = () => {

  //実際はAPIサーバーにPost
  const createPost = async (formData: FormData) => {
    const title = formData.get('title');
    const content = formData.get('content');
    console.log(title, content);
  }

  return (
    <div>
      <form action={createPost}>
        <Input type="text" name="title" />
        <Input type="text" name="content" />
        <Button type="submit">Create</Button>
      </form>
    </div>
  )
}

export default CreatePost
