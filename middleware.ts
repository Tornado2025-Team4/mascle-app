import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { updateSession } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  const { pathname, origin } = request.nextUrl;
  // 除外パス: セットアップ自身/認証ページ
  if (
    pathname.startsWith("/setup") ||
    pathname.startsWith("/signin") ||
    pathname.startsWith("/signup")
  ) {
    return response;
  }

  // 追加の認証チェック: DB上のAuthユーザーが存在しない場合は /signin へ
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: () => {},
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/signin";
      return NextResponse.redirect(url);
    }
  } catch {
    // 何もしない（下のフローで判定）
  }

  try {
    // 認証済みならプロフィールの最低限設定を確認
    // 'me' はAPI側でJWT必須のため、サーバー側で取得した user.id を使う
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: () => {},
        },
      }
    );
    const { data: { user: authedUser } } = await supabase.auth.getUser();
    if (!authedUser) return response;

    const { data: sess } = await supabase.auth.getSession();
    const accessToken = sess.session?.access_token;
    const res = await fetch(`${origin}/api/users/me/profile`, {
      headers: {
        cookie: request.headers.get("cookie") ?? "",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    });
    if (res.status === 401 || res.status === 403) {
      const url = request.nextUrl.clone();
      url.pathname = "/signin";
      return NextResponse.redirect(url);
    }
    if (!res.ok) return response; // その他の取得失敗時はスルー
    const profile = await res.json();
    const displayName: string | undefined = profile?.display_name;
    if (!displayName || displayName.trim().length === 0) {
      const url = request.nextUrl.clone();
      url.pathname = "/setup";
      return NextResponse.redirect(url);
    }
  } catch {
    // 失敗時はそのまま続行
    return response;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
