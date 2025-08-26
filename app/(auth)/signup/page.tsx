import React from 'react'
import SignupForm from './_components/signup-form'

const Signup = () => {
	return (
		<main className="mx-auto max-w-md px-4 py-10">
			<header className="mb-6">
				<h1 className="text-2xl font-semibold">サインアップ</h1>
				<p className="text-sm text-muted-foreground mt-1">メールアドレスとパスワードでアカウントを作成します。</p>
			</header>
			<SignupForm />
		</main>
	)
}

export default Signup
