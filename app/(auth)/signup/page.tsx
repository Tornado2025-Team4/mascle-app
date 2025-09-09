import React from 'react'
import SignupForm from './_components/signup-form'

const Signup = async () => {
  return (
    <main className="mx-auto px-4 py-10 flex flex-col">
      <div className="h-[80vh]">
        <SignupForm />
      </div>
      <div className="h-[20vh] text-center text-4xl">
        PROTEN
      </div>
    </main>
  )
}

export default Signup
