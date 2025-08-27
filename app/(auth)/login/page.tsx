import React from 'react'
import LoginForm from './_components/login-form'

const Login = async () => {
  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">ログイン</h1>
        <p className="text-sm text-muted-foreground mt-1">メールアドレスとパスワードでサインインします。</p>
      </header>
      <LoginForm />
    </main>
  )
}

export default Login
