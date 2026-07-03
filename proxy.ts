import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// 完全一致で判定するパス（'/' をプレフィックス判定に含めると全パスが
// マッチしてしまうため、静的パスは exact match、'/api/' のみ prefix 判定にする）
const PUBLIC_EXACT_PATHS = new Set(['/', '/login'])
const PUBLIC_PREFIX_PATHS = ['/api/']

function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_EXACT_PATHS.has(pathname) ||
    PUBLIC_PREFIX_PATHS.some((p) => pathname.startsWith(p))
  )
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublic = isPublicPath(pathname)

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user && !isPublic) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  if (user && pathname === '/login') {
    const archiveUrl = request.nextUrl.clone()
    archiveUrl.pathname = '/archive'
    return NextResponse.redirect(archiveUrl)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
