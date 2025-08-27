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

const SignupForm: React.FC = () => {
	const router = useRouter()
	const supabase = createBrowserClient()
	const [form, setForm] = React.useState<FormState>({ email: '', password: '' })
	const [isSubmitting, setIsSubmitting] = React.useState(false)
	const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
	const [infoMessage, setInfoMessage] = React.useState<string | null>(null)

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setErrorMessage(null)
		setInfoMessage(null)
		setIsSubmitting(true)
		try {
			const { data, error } = await supabase.auth.signUp({
				email: form.email,
				password: form.password,
			})

			if (error) {
				setErrorMessage(error.message)
				return
			}

			if (data.user) {
				setTimeout(() => {
					router.replace('/login')
					router.refresh()
				}, 1200)
			}
		} catch (error) {
			console.error('Failed to sign up', error)
			setErrorMessage('サインアップに失敗しました。時間をおいて再度お試しください。')
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
					autoComplete="new-password"
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

			{infoMessage ? (
				<p className="text-sm text-muted-foreground" role="status">
					{infoMessage}
				</p>
			) : null}

			<Button type="submit" disabled={isSubmitting} className="w-full">
				{isSubmitting ? '作成中…' : 'アカウント作成'}
			</Button>
		</form>
	)
}

export default SignupForm


