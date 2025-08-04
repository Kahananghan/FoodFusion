// Using free restaurant data instead of Zomato API
const INDIAN_CITIES = [
  { id: 1, name: 'Mumbai', state_name: 'Maharashtra' },
  { id: 2, name: 'Delhi', state_name: 'Delhi' },
  { id: 3, name: 'Bangalore', state_name: 'Karnataka' },
  { id: 4, name: 'Chennai', state_name: 'Tamil Nadu' },
  { id: 5, name: 'Kolkata', state_name: 'West Bengal' },
  { id: 6, name: 'Hyderabad', state_name: 'Telangana' },
  { id: 7, name: 'Pune', state_name: 'Maharashtra' },
  { id: 8, name: 'Ahmedabad', state_name: 'Gujarat' }
]

export interface ZomatoRestaurant {
  id: string
  name: string
  cuisines: string
  user_rating: {
    aggregate_rating: string
    rating_text: string
  }
  location: {
    address: string
    locality: string
    city: string
  }
  featured_image: string
  average_cost_for_two: number
  currency: string
  has_online_delivery: number
}

export interface ZomatoCity {
  id: number
  name: string
  state_name: string
}

const RESTAURANT_DATA: { [key: number]: ZomatoRestaurant[] } = {
  1: [ // Mumbai
    {
      id: '1001',
      name: 'Trishna',
      cuisines: 'Seafood, Indian',
      user_rating: { aggregate_rating: '4.6', rating_text: 'Excellent' },
      location: { address: 'Fort', locality: 'Fort', city: 'Mumbai' },
      featured_image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&h=300&fit=crop',
      average_cost_for_two: 2500,
      currency: '₹',
      has_online_delivery: 1
    },
    {
      id: '1002',
      name: 'Leopold Cafe',
      cuisines: 'Continental, Indian',
      user_rating: { aggregate_rating: '4.2', rating_text: 'Very Good' },
      location: { address: 'Colaba', locality: 'Colaba', city: 'Mumbai' },
      featured_image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&h=300&fit=crop',
      average_cost_for_two: 1800,
      currency: '₹',
      has_online_delivery: 1
    }
  ],
  2: [ // Delhi
    {
      id: '2001',
      name: "Karim's",
      cuisines: 'Mughlai, Non-Veg',
      user_rating: { aggregate_rating: '4.5', rating_text: 'Excellent' },
      location: { address: 'Jama Masjid', locality: 'Old Delhi', city: 'Delhi' },
      featured_image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&h=300&fit=crop',
      average_cost_for_two: 1200,
      currency: '₹',
      has_online_delivery: 1
    },
    {
      id: '2002',
      name: 'Paranthe Wali Gali',
      cuisines: 'North Indian, Street Food',
      user_rating: { aggregate_rating: '4.3', rating_text: 'Very Good' },
      location: { address: 'Chandni Chowk', locality: 'Chandni Chowk', city: 'Delhi' },
      featured_image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=500&h=300&fit=crop',
      average_cost_for_two: 800,
      currency: '₹',
      has_online_delivery: 1
    }
  ],
  3: [ // Bangalore
    {
      id: '3001',
      name: 'MTR',
      cuisines: 'South Indian, Vegetarian',
      user_rating: { aggregate_rating: '4.7', rating_text: 'Excellent' },
      location: { address: 'Lalbagh Road', locality: 'Lalbagh', city: 'Bangalore' },
      featured_image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&h=300&fit=crop',
      average_cost_for_two: 600,
      currency: '₹',
      has_online_delivery: 1
    },
    {
      id: '3002',
      name: 'Vidyarthi Bhavan',
      cuisines: 'South Indian, Breakfast',
      user_rating: { aggregate_rating: '4.4', rating_text: 'Very Good' },
      location: { address: 'Gandhi Bazaar', locality: 'Basavanagudi', city: 'Bangalore' },
      featured_image: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=500&h=300&fit=crop',
      average_cost_for_two: 400,
      currency: '₹',
      has_online_delivery: 1
    }
  ],
  4: [ // Chennai
    {
      id: '4001',
      name: 'Murugan Idli Shop',
      cuisines: 'South Indian, Vegetarian',
      user_rating: { aggregate_rating: '4.5', rating_text: 'Excellent' },
      location: { address: 'T Nagar', locality: 'T Nagar', city: 'Chennai' },
      featured_image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=500&h=300&fit=crop',
      average_cost_for_two: 300,
      currency: '₹',
      has_online_delivery: 1
    }
  ],
  5: [ // Kolkata
    {
      id: '5001',
      name: 'Peter Cat',
      cuisines: 'Continental, Kebab',
      user_rating: { aggregate_rating: '4.4', rating_text: 'Very Good' },
      location: { address: 'Park Street', locality: 'Park Street', city: 'Kolkata' },
      featured_image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&h=300&fit=crop',
      average_cost_for_two: 2000,
      currency: '₹',
      has_online_delivery: 1
    }
  ],
  6: [ // Hyderabad
    {
      id: '6001',
      name: 'Paradise Biryani',
      cuisines: 'Hyderabadi, Biryani',
      user_rating: { aggregate_rating: '4.5', rating_text: 'Excellent' },
      location: { address: 'Secunderabad', locality: 'Secunderabad', city: 'Hyderabad' },
      featured_image: 'https://images.unsplash.com/photo-1563379091339-03246963d96c?w=500&h=300&fit=crop',
      average_cost_for_two: 1000,
      currency: '₹',
      has_online_delivery: 1
    }
  ]
}

export class ZomatoAPI {
  async getCities(query: string): Promise<ZomatoCity[]> {
    return INDIAN_CITIES
  }

  async getRestaurants(cityId: number, cuisineId?: string, query?: string): Promise<ZomatoRestaurant[]> {
    let restaurants = RESTAURANT_DATA[cityId] || []
    
    if (query) {
      restaurants = restaurants.filter(r => 
        r.name.toLowerCase().includes(query.toLowerCase()) ||
        r.cuisines.toLowerCase().includes(query.toLowerCase())
      )
    }
    
    return restaurants
  }
}