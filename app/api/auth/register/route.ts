import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    const { name, email, password, phone, role } = await request.json()
    
    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
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