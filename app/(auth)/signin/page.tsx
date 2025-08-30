import React from 'react'
import SigninForm from './_components/signin-form'

const Signin = async () => {
  return (
    <main className="mx-auto px-4 py-10 flex flex-col">
      <div className="h-[80vh]">
        <SigninForm />
      </div> 
      <div className="h-[20vh] text-center text-2xl">
        PROTEN
      </div>
    </main>
  )
}

export default Signin
