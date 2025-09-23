import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch (err) {
      console.error('JWT verification failed:', err)
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    // Accept multiple common id fields from token payload
    const userId = decoded?.userId || decoded?.id || decoded?._id
    if (!userId) {
      console.error('Token does not contain user id:', decoded)
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 })
    }

    const user = await User.findById(userId).select('addresses')
    return NextResponse.json({ addresses: user?.addresses || [] })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch (err) {
      console.error('JWT verification failed:', err)
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    const userId = decoded?.userId || decoded?.id || decoded?._id
    if (!userId) {
      console.error('Token does not contain user id:', decoded)
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 })
    }

    const addressData = await request.json()

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!Array.isArray(user.addresses)) {
      user.addresses = []
    }

    user.addresses.push(addressData)
    const savedUser = await user.save()

    return NextResponse.json({ address: savedUser.addresses?.[savedUser.addresses.length - 1] || null })
  } catch (error) {
    console.error('Address save error:', error)
    return NextResponse.json({ error: 'Failed to save address' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB()

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch (err) {
      console.error('JWT verification failed:', err)
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    const userId = decoded?.userId || decoded?.id || decoded?._id
    if (!userId) {
      console.error('Token does not contain user id:', decoded)
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const addressId = searchParams.get('id')

    if (!addressId) {
      return NextResponse.json({ error: 'Address ID required' }, { status: 400 })
    }

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!Array.isArray(user.addresses)) {
      user.addresses = []
    }

    user.addresses = user.addresses.filter((addr: any) => String(addr._id) !== addressId)
    await user.save()

    return NextResponse.json({ message: 'Address deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 })
  }
}