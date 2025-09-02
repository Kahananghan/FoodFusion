import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import mongoose from 'mongoose'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
  const { email, password } = await request.json()
  const Model = User as mongoose.Model<any>
    
    // Find user
  const user = await Model.findOne({ email })
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }
    
    // Prevent login if deactivated
    if (user.isActive === false) {
      return NextResponse.json({ error: 'Account deactivated.' }, { status: 403 })
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }
    
  // Update last login (non-blocking save after successful auth)
  user.lastLogin = new Date()
  await user.save()

  // Create JWT token
    // Shorter-lived token for improved security (2 hours)
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '2h' }
    )
    
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user.toObject()
    
    const response = NextResponse.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token
    })
    
    // Set HTTP-only cookie (maxAge is in seconds)
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 2 * 60 * 60 // 2 hours in seconds
    })
    
    
    return response
    
  } catch (error) {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}