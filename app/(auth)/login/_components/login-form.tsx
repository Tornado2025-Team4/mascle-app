"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { createClient as createBrowserClient } from '@/utils/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

type FormState = {
	email: string
	password: string
}

const LoginForm: React.FC = () => {
	const router = useRouter()
	const supabase = createBrowserClient()
	const [form, setForm] = React.useState<FormState>({ email: '', password: '' })
	const [isSubmitting, setIsSubmitting] = React.useState(false)
	const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setErrorMessage(null)
		setIsSubmitting(true)
		try {
			const { data, error } = await supabase.auth.signInWithPassword({
				email: form.email,
				password: form.password,
			})

			if (error) {
				setErrorMessage(error.message)
				return
			}

			if (data.user) {
				router.replace('/')
				router.refresh()
			}
		} catch (error) {
			console.error('Failed to sign in', error)
			setErrorMessage('サインインに失敗しました。時間をおいて再度お試しください。')
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="email">メールアドレス</Label>
				<Input
					id="email"
					type="email"
					autoComplete="email"
					placeholder="you@example.com"
					required
					value={form.email}
					onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor="password">パスワード</Label>
				<Input
					id="password"
					type="password"
					autoComplete="current-password"
					placeholder="••••••••"
					required
					value={form.password}
					onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
				/>
			</div>

			{errorMessage ? (
				<p className="text-sm text-destructive" role="alert">
					{errorMessage}
				</p>
			) : null}

			<Button type="submit" disabled={isSubmitting} className="w-full">
				{isSubmitting ? 'サインイン中…' : 'サインイン'}
			</Button>
		</form>
	)
}

export default LoginForm


