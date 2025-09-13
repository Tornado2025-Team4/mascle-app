import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { updateSession } from "@/utils/supabase/middleware";

const PUBLIC_PATHS = [
  "/setup",
  "/signin",
  "/signup",
  "/api",
  "/favicon.ico",
  "/_next"
];

const isPublicPath = (pathname: string): boolean => {
  return PUBLIC_PATHS.some(path => pathname.startsWith(path));
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // パブリックパスは認証チェックをスキップ
  if (isPublicPath(pathname)) {
    return await updateSession(request);
  }

  try {
    const response = await updateSession(request);

    // Supabaseクライアントの初期化
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: () => { },
        },
      }
    );

    // ユーザー認証状態をチェック
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.log(`Unauthenticated access to ${pathname}, redirecting to signin`);
      const url = request.nextUrl.clone();
      url.pathname = "/signin";
      url.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(url);
    }

    // セッション取得
    const { data: sess, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sess.session?.access_token) {
      console.log(`Session error for ${pathname}, redirecting to signin`);
      const url = request.nextUrl.clone();
      url.pathname = "/signin";
      return NextResponse.redirect(url);
    }

    // プロフィールチェックを削除 - setup画面での無限ループを防ぐため

    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    // エラー時はサインインページにリダイレクト
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: [
    /*
     * 以下以外のすべてのリクエストにマッチ:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - 画像ファイル拡張子
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
