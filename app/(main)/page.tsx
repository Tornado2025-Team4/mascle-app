import Header from "./_components/header";
import PostList from "./_components/postlist";
import { headers } from "next/headers";
import Link from "next/link";
import type { UserData } from "@/types/userData.type";

type FetchMyProfileResult =
  | { authed: false; profile: null; error?: string }
  | { authed: true; profile: UserData | null; error?: string };

async function fetchMyProfile(): Promise<FetchMyProfileResult> {
  try {
    const hdrs = await headers();
    const host = hdrs.get('host');
    const proto = hdrs.get('x-forwarded-proto') || 'http';

    if (!host) {
      throw new Error('Host header is missing');
    }

    const base = `${proto}://${host}`;

    const res = await fetch(`${base}/api/users/me/profile`, {
      cache: 'no-store',
      headers: {
        cookie: hdrs.get('cookie') ?? ''
      }
    });

    if (res.status === 401 || res.status === 403) {
      return { authed: false, profile: null };
    }

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Unknown error');
      console.error(`API error: ${res.status} ${res.statusText}`, errorText);
      return { authed: true, profile: null, error: 'プロフィール取得に失敗しました' };
    }

    const profile = await res.json();
    return { authed: true, profile };
  } catch (error) {
    console.error('fetchMyProfile error:', error);
    return { authed: false, profile: null, error: 'サーバーエラーが発生しました' };
  }
}

export default async function Home() {
  const { authed, profile, error }: FetchMyProfileResult = await fetchMyProfile();

  return (
    <div className="min-h-screen pb-[10vh]">
      <Header />
      <main className="h-[80vh] space-y-4 p-4 overflow-y-auto">
        {error && (
          <section className="p-4 rounded-md border bg-red-50 border-red-200">
            <h2 className="font-semibold mb-2 text-red-800">エラーが発生しました</h2>
            <p className="text-sm text-red-700">{error}</p>
          </section>
        )}

        {!authed ? (
          <section className="p-4 rounded-md border bg-amber-50 border-amber-200">
            <h2 className="font-semibold mb-2 text-amber-800">サインインが必要です</h2>
            <p className="text-sm mb-3 text-amber-700">
              プロフィールと投稿を表示するには、サインインしてください。
            </p>
            <Link
              href="/signin"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
            >
              サインインへ
            </Link>
          </section>
        ) : profile ? (
          <section className="p-4 rounded-md border bg-green-50 border-green-200">
            <h2 className="font-semibold mb-2 text-green-800">
              おかえりなさい、{profile.display_name || 'ユーザー'}さん
            </h2>
            <p className="text-sm text-green-700">
              表示名: {profile.display_name ?? '未設定'}
            </p>
          </section>
        ) : (
          <section className="p-4 rounded-md border bg-slate-50 border-slate-200">
            <h2 className="font-semibold mb-2 text-slate-800">プロフィール未設定</h2>
            <p className="text-sm mb-3 text-slate-700">
              まずはプロフィールを設定しましょう。
            </p>
            <Link
              href="/setup"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
            >
              初期設定へ
            </Link>
          </section>
        )}

        <PostList />
      </main>
    </div>
  );
}
