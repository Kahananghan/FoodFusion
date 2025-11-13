import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
  const { name, email, password, phone, role} = await request.json()
    
    // Check if user already exists
  const existingUser = await (User as any).findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }
    
    // Validate password server-side
    const pwd = password || ''
    const pwdValid = pwd.length >= 8 && /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[0-9]/.test(pwd) && /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
    if (!pwdValid) {
      return NextResponse.json({ error: 'Password does not meet complexity requirements' }, { status: 400 })
    }

    // Validate phone server-side (if provided)
    const phoneStr = phone ? String(phone) : ''
    if (phoneStr && !/^\d{10}$/.test(phoneStr)) {
      return NextResponse.json({ error: 'Phone number must be 10 digits' }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)
    

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      role: role || 'customer'
    })
    
    await user.save()
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user.toObject()
    
    return NextResponse.json({ 
      message: 'User created successfully',
      user: userWithoutPassword 
    }, { status: 201 })
    
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}