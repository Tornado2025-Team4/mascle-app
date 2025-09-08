import Header from "./_components/header";
import PostList from "./_components/postlist";
import { headers } from "next/headers";
import { createClient as createServerSupabase } from "@/utils/supabase/server";
import Link from "next/link";

async function fetchMyProfile() {
  const hdrs = await headers();
  const host = hdrs.get('host');
  const proto = hdrs.get('x-forwarded-proto') || 'http';
  const base = `${proto}://${host}`;

  const supabase = await createServerSupabase();
  const { data: sess } = await supabase.auth.getSession();
  const accessToken = sess.session?.access_token;

  const res = await fetch(`${base}/api/users/me/profile`, {
    cache: 'no-store',
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      cookie: hdrs.get('cookie') ?? ''
    }
  });
  if (res.status === 401 || res.status === 403) {
    return { authed: false as const, profile: null as null };
  }
  if (!res.ok) return { authed: true as const, profile: null as null };
  const profile = await res.json();
  return { authed: true as const, profile };
}

import type { UserData } from "@/types/userData.type";

type FetchMyProfileResult =
  | { authed: false; profile: null }
  | { authed: true; profile: UserData | null };

export default async function Home() {
  const { authed, profile }: FetchMyProfileResult = await fetchMyProfile();
  return (
    <div>
      <Header />
      <main className="h-[80vh] space-y-4 p-4">
        {!authed ? (
          <section className="p-4 rounded-md border bg-amber-50 border-amber-200">
            <h2 className="font-semibold mb-2">サインインが必要です</h2>
            <p className="text-sm mb-2">プロフィールと投稿を表示するには、サインインしてください。</p>
            <Link href="/signin" className="underline text-blue-600">サインインへ</Link>
          </section>
        ) : profile ? (
          <section className="p-4 rounded-md border">
            <h2 className="font-semibold mb-2">自分のプロフィール</h2>
            <p className="text-sm">表示名: {profile.display_name ?? '-'}</p>
          </section>
        ) : (
          <section className="p-4 rounded-md border bg-slate-50">
            <h2 className="font-semibold mb-2">プロフィール未設定</h2>
            <p className="text-sm mb-2">まずはプロフィールを設定しましょう。</p>
            <Link href="/setup" className="underline text-blue-600">初期設定へ</Link>
          </section>
        )}
        <PostList />
      </main>
    </div>
  );
}
