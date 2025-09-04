"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { createClient as createBrowserClient } from '@/utils/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

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

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault()
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
			setErrorMessage('Failed to sign up. Please try again later.')
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-6 border-1 border-gray-300 p-5 rounded-md mt-[20vh] mb-[20vh]">
			<div className="space-y-3">
				<Label htmlFor="email">Email</Label>
				<Input
					id="email"
					type="email"
					autoComplete="email"
					placeholder="Enter your email"
					required
					value={form.email}
					onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
				/>
			</div>
			<div className="space-y-3">
				<Label htmlFor="password">Password</Label>
				<Input
					id="password"
					type="password"
					autoComplete="new-password"
					placeholder="Enter your password"
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

			<Button type="submit" disabled={isSubmitting} className="w-full cursor-pointer">
				{isSubmitting ? 'Creating account…' : 'Create account'}
			</Button>
			<div className="flex justify-center">
				<p className="text-sm text-gray-900">
					Already have an account?
				</p>
				<Link href="/login" className="ml-4 text-black text-sm font-bold underline">
					Sign in
				</Link>
			</div>
		</form>
	)
}

export default SignupForm


