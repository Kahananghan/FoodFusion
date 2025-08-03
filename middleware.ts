import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const { pathname } = request.nextUrl

  console.log('Middleware - Path:', pathname)
  console.log('Middleware - Token exists:', !!token)

  // Protected routes
  const protectedRoutes = ['/admin', '/seller', '/delivery', '/profile', '/orders']
  const authRoutes = ['/login', '/register']

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

  if (isProtectedRoute && !token) {
    console.log('Middleware - No token, redirecting to login')
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Skip auth route redirect - let frontend handle it
  // if (isAuthRoute && token) {
  //   return NextResponse.redirect(new URL('/', request.url))
  // }

  // Role-based access control
  if (token && isProtectedRoute) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
      const userRole = decoded.role
      console.log('Middleware - User role:', userRole)

      if (pathname.startsWith('/admin') && userRole !== 'admin') {
        console.log('Middleware - Not admin, redirecting to home')
        return NextResponse.redirect(new URL('/', request.url))
      }
      if (pathname.startsWith('/seller') && userRole !== 'restaurant') {
        console.log('Middleware - Not restaurant, redirecting to home')
        return NextResponse.redirect(new URL('/', request.url))
      }
      if (pathname.startsWith('/delivery') && userRole !== 'delivery') {
        console.log('Middleware - Not delivery, redirecting to home')
        return NextResponse.redirect(new URL('/', request.url))
      }
      
      console.log('Middleware - Access granted')
    } catch (error) {
      console.log('Middleware - Token verification failed:', error)
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: []
}