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

const SigninForm: React.FC = () => {
	const router = useRouter()
	const supabase = createBrowserClient()
	const [form, setForm] = React.useState<FormState>({ email: '', password: '' })
	const [isSubmitting, setIsSubmitting] = React.useState(false)
	const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault()
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
			setErrorMessage('Failed to sign in. Please try again later.')
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
					autoComplete="current-password"
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

			<Button type="submit" disabled={isSubmitting} className="w-full cursor-pointer">
				{isSubmitting ? 'Signing in…' : 'Sign in'}
			</Button>
			<div className="flex justify-center">
				<p className="text-sm text-gray-900">
					Don&apos;t have an account?
				</p>
				<Link href="/signup" className="ml-4 text-black text-sm font-bold underline">
					Sign up
				</Link>
			</div>
		</form>
	)
}

export default SigninForm


