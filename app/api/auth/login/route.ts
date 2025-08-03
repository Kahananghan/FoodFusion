import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    const { email, password } = await request.json()
    
    // Find user
    const user = await User.findOne({ email })
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }
    
    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )
    
    console.log('Login API - Created token for user:', user.email, 'with role:', user.role)
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user.toObject()
    
    const response = NextResponse.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token
    })
    
    // Set HTTP-only cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })
    
    console.log('Login API - Cookie set successfully')
    
    return response
    
  } catch (error) {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}