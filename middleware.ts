import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const { pathname } = request.nextUrl

  // Protected routes
  const protectedRoutes = ['/admin', '/seller', '/delivery', '/profile', '/orders', '/cart']
  const authRoutes = ['/login', '/register']
  
  // Protected API routes that require authentication
  const protectedApiRoutes = ['/api/orders', '/api/cart', '/api/addresses']
  

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isProtectedApiRoute = protectedApiRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

  if ((isProtectedRoute || isProtectedApiRoute) && !token) {
    console.log('Middleware - No token, redirecting to login')
    if (isProtectedApiRoute) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Role-based access control
  if (token && isProtectedRoute) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
      const { payload } = await jwtVerify(token, secret)
      const userRole = payload.role as string

      if (pathname.startsWith('/admin') && userRole !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url))
      }
      if (pathname.startsWith('/seller') && userRole !== 'restaurant') {
        return NextResponse.redirect(new URL('/', request.url))
      }
      if (pathname.startsWith('/delivery') && userRole !== 'delivery') {
        return NextResponse.redirect(new URL('/', request.url))
      }
      
    } catch (error) {
      console.log('Middleware - Token verification failed:', error)
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/seller/:path*', '/delivery/:path*', '/profile/:path*', '/orders/:path*', '/cart/:path*', '/api/orders/:path*', '/api/cart/:path*', '/api/addresses/:path*']
}