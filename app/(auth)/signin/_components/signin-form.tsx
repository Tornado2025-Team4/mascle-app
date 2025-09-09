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

	const validateForm = (): boolean => {
		if (!form.email.trim()) {
			setErrorMessage('メールアドレスを入力してください')
			return false
		}
		if (!form.email.includes('@')) {
			setErrorMessage('有効なメールアドレスを入力してください')
			return false
		}
		if (!form.password.trim()) {
			setErrorMessage('パスワードを入力してください')
			return false
		}
		return true
	}

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault()
		setErrorMessage(null)

		if (!validateForm()) {
			return
		}

		setIsSubmitting(true)
		try {
			const { data, error } = await supabase.auth.signInWithPassword({
				email: form.email.trim(),
				password: form.password,
			})

			if (error) {
				// エラーメッセージを日本語化
				const errorMessages: Record<string, string> = {
					'Invalid login credentials': 'メールアドレスまたはパスワードが正しくありません',
					'Email not confirmed': 'メールアドレスの確認が完了していません',
					'Too many requests': 'ログイン試行回数が多すぎます。しばらく待ってから再試行してください',
				}
				setErrorMessage(errorMessages[error.message] || 'サインインに失敗しました。しばらく待ってから再試行してください。')
				return
			}

			if (data.user) {
				router.replace('/')
				router.refresh()
			}
		} catch (error) {
			console.error('Failed to sign in:', error)
			setErrorMessage('予期しないエラーが発生しました。後でもう一度お試しください。')
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleInputChange = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
		setForm((prev) => ({ ...prev, [field]: e.target.value }))
		if (errorMessage) setErrorMessage(null) // エラーメッセージをクリア
	}

	return (
		<main className="max-w-md mx-auto">
			<form
				onSubmit={handleSubmit}
				className="space-y-6 border border-gray-300 p-6 rounded-lg mt-[20vh] mb-[20vh] bg-white shadow-sm"
				noValidate
			>
				<div className="text-center mb-6">
					<h1 className="text-2xl font-bold text-gray-900 mb-2">サインイン</h1>
					<p className="text-sm text-gray-600">
						おかえりなさい！
						<br />
						アカウントにサインインしてください
					</p>
				</div>

				<div className="space-y-3">
					<Label htmlFor="email" className="text-sm font-medium text-gray-700">
						メールアドレス
					</Label>
					<Input
						id="email"
						type="email"
						autoComplete="email"
						placeholder="example@email.com"
						required
						value={form.email}
						onChange={handleInputChange('email')}
						className="w-full"
						aria-describedby={errorMessage ? 'error-message' : undefined}
					/>
				</div>

				<div className="space-y-3">
					<Label htmlFor="password" className="text-sm font-medium text-gray-700">
						パスワード
					</Label>
					<Input
						id="password"
						type="password"
						autoComplete="current-password"
						placeholder="入力してください"
						required
						value={form.password}
						onChange={handleInputChange('password')}
						className="w-full"
						aria-describedby={errorMessage ? 'error-message' : undefined}
					/>
				</div>

				{errorMessage && (
					<div
						id="error-message"
						className="p-3 bg-red-50 border border-red-200 rounded-md"
						role="alert"
						aria-live="polite"
					>
						<p className="text-sm text-red-600">{errorMessage}</p>
					</div>
				)}

				<Button
					type="submit"
					disabled={isSubmitting}
					className="w-full bg-[#2C2C2C] hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isSubmitting ? 'サインイン中...' : 'サインイン'}
				</Button>

				<div className="text-center pt-4 border-t border-gray-200">
					<p className="text-sm text-gray-600">
						初めてですか？
						<Link
							href="/signup"
							className="ml-1 text-blue-600 font-medium hover:text-blue-800 underline"
						>
							サインアップ
						</Link>
					</p>
				</div>
			</form>
		</main>
	)
}

export default SigninForm


