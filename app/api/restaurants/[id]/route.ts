import { NextRequest, NextResponse } from 'next/server'

const restaurants = [
  {
    id: '1002',
    name: 'Trishna',
    cuisines: 'Seafood, Indian',
    user_rating: { aggregate_rating: '4.6', rating_text: 'Excellent' },
    location: { address: 'Fort', locality: 'Fort', city: 'Mumbai' },
    featured_image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&h=400&fit=crop',
    average_cost_for_two: 2500,
    currency: '₹'
  },
  {
    id: '1003',
    name: 'Bukhara',
    cuisines: 'North Indian, Mughlai',
    user_rating: { aggregate_rating: '4.8', rating_text: 'Excellent' },
    location: { address: 'Diplomatic Enclave', locality: 'Chanakyapuri', city: 'New Delhi' },
    featured_image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=400&fit=crop',
    average_cost_for_two: 3500,
    currency: '₹'
  },
  {
    id: '1004',
    name: 'Karim\'s',
    cuisines: 'Mughlai, North Indian',
    user_rating: { aggregate_rating: '4.2', rating_text: 'Very Good' },
    location: { address: 'Jama Masjid', locality: 'Old Delhi', city: 'New Delhi' },
    featured_image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=400&fit=crop',
    average_cost_for_two: 800,
    currency: '₹'
  },
  {
    id: '1005',
    name: 'Cafe Mocha',
    cuisines: 'Continental, Italian',
    user_rating: { aggregate_rating: '4.1', rating_text: 'Very Good' },
    location: { address: 'Bandra West', locality: 'Bandra', city: 'Mumbai' },
    featured_image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=400&fit=crop',
    average_cost_for_two: 1200,
    currency: '₹'
  },
  {
    id: '1006',
    name: 'Dakshin',
    cuisines: 'South Indian, Kerala',
    user_rating: { aggregate_rating: '4.5', rating_text: 'Excellent' },
    location: { address: 'ITC Maurya', locality: 'Chanakyapuri', city: 'New Delhi' },
    featured_image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800&h=400&fit=crop',
    average_cost_for_two: 2800,
    currency: '₹'
  },
  {
    id: '1007',
    name: 'Leopold Cafe',
    cuisines: 'Continental, Indian',
    user_rating: { aggregate_rating: '4.0', rating_text: 'Good' },
    location: { address: 'Colaba Causeway', locality: 'Colaba', city: 'Mumbai' },
    featured_image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=400&fit=crop',
    average_cost_for_two: 1500,
    currency: '₹'
  }
]

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('API called with ID:', params.id)
  const restaurant = restaurants.find(r => r.id === params.id)
  console.log('Found restaurant:', restaurant)
  
  if (!restaurant) {
    console.log('Restaurant not found for ID:', params.id)
    return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
  }
  
  return NextResponse.json(restaurant)
}