import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
  const Model: any = User
  const user = await Model.findById(decoded.userId).select('-password')

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userObj = user.toObject()
    // Provide a convenience single address for frontend (first address)
    if (userObj.addresses && userObj.addresses.length > 0) {
      userObj.address = userObj.addresses[0]
    }

    return NextResponse.json({ user: userObj })
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect()

    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
  const Model: any = User
  const user = await Model.findById(decoded.userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, phone, address } = body || {}

    let changed = false
    if (typeof name === 'string' && name.trim() && name !== user.name) {
      user.name = name.trim()
      changed = true
    }
    if (typeof phone === 'string' && phone.trim() && phone !== user.phone) {
      user.phone = phone.trim()
      changed = true
    }

    if (address && typeof address === 'object') {
      // We map a single address to addresses[0]
      const existing = user.addresses?.[0]
      const ensureRequired = (field: string, fallback: string) => (address[field] && String(address[field]).trim()) || fallback
      if (existing) {
        // Update only provided fields
        if (address.street) existing.street = address.street
        if (address.city) existing.city = address.city
        if (address.state) existing.state = address.state
        if (address.zipCode) existing.zipCode = address.zipCode
        // keep name/phone in address schema aligned
        existing.name = ensureRequired('name', user.name)
        existing.phone = ensureRequired('phone', user.phone || '')
      } else {
        // Only create if minimum info present (street & city at least)
        if (address.street && address.city && address.state && address.zipCode) {
          user.addresses = user.addresses || []
          user.addresses.unshift({
            name: ensureRequired('name', user.name),
            phone: ensureRequired('phone', user.phone || ''),
            street: address.street,
            city: address.city,
            state: address.state,
            zipCode: address.zipCode
          })
        }
      }
      changed = true
    }

    if (changed) {
      await user.save()
    }

  const updated = await Model.findById(user._id).select('-password')
    const userObj = updated?.toObject() || {}
    if (userObj.addresses && userObj.addresses.length > 0) {
      userObj.address = userObj.addresses[0]
    }

    return NextResponse.json({ message: 'Profile updated', user: userObj })
  } catch (error) {
    console.error('Profile update error', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}