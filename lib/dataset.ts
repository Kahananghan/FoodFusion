import fs from 'fs'
import path from 'path'

export interface DatasetRestaurant {
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
  delivery_time: number
}



class DatasetAPI {
  private restaurants: DatasetRestaurant[] = []
  private loaded = false

  private loadData() {
    if (this.loaded) return

    try {
      const samplePath = path.join(process.cwd(), 'scripts', 'sample-data.json')
      
      if (fs.existsSync(samplePath)) {
        this.loadFromJSON(samplePath)
      } else {
        this.loadFallbackData()
      }

      this.loaded = true
    } catch (error) {
      console.error('Error loading dataset:', error)
      this.loadFallbackData()
      this.loaded = true
    }
  }

  private loadFromJSON(filePath: string) {
    try {
      const rawData = JSON.parse(fs.readFileSync(filePath, 'utf8'))
      this.restaurants = rawData.map((row: any) => ({
        id: String(row.res_id),
        name: String(row.name),
        cuisines: String(row.cuisines),
        user_rating: {
          aggregate_rating: String(row.aggregate_rating),
          rating_text: this.getRatingText(parseFloat(row.aggregate_rating))
        },
        location: {
          address: String(row.address),
          locality: String(row.locality),
          city: String(row.city)
        },
        featured_image: this.getRandomImage(),
        average_cost_for_two: parseInt(row.average_cost_for_two),
        currency: String(row.currency),
        has_online_delivery: row.has_online_delivery === 'Yes' ? 1 : 0,
        delivery_time: Math.floor(Math.random() * 30) + 20
      }))
      console.log(`Loaded ${this.restaurants.length} restaurants from dataset`)
    } catch (error) {
      console.error('Error parsing JSON:', error)
      this.loadFallbackData()
    }
  }

  private loadFallbackData() {
    this.restaurants = []
    console.log('No dataset found')
  }

  private getRatingText(rating: number): string {
    if (rating >= 4.5) return 'Excellent'
    if (rating >= 4.0) return 'Very Good'
    if (rating >= 3.5) return 'Good'
    if (rating >= 3.0) return 'Average'
    return 'Poor'
  }

  private getRandomImage(): string {
    const images = [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=400',
      'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&h=400',
      'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=400',
      'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=400',
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=400',
      'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=800&h=400',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=400',
      'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&h=400',
      'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800&h=400',
      'https://images.unsplash.com/photo-1563379091339-03246963d96c?w=800&h=400',
      'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=800&h=400',
      'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&h=400',
      'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800&h=400',
      'https://images.unsplash.com/photo-1544982503-9f984c14501a?w=800&h=400',
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&h=400',
      'https://images.unsplash.com/photo-1630383249896-424e482df921?w=800&h=400',
      'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=800&h=400',
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=400'
    ]
    return images[Math.floor(Math.random() * images.length)]
  }

  getRestaurants(filters?: {
    city?: string
    cuisine?: string
    search?: string
    limit?: number
  }): DatasetRestaurant[] {
    this.loadData()
    let filtered = [...this.restaurants]

    if (filters?.city) {
      filtered = filtered.filter(r => 
        r.location.city.toLowerCase().includes(filters.city!.toLowerCase())
      )
    }

    if (filters?.cuisine) {
      filtered = filtered.filter(r => 
        r.cuisines.toLowerCase().includes(filters.cuisine!.toLowerCase())
      )
    }

    if (filters?.search) {
      filtered = filtered.filter(r => 
        r.name.toLowerCase().includes(filters.search!.toLowerCase()) ||
        r.cuisines.toLowerCase().includes(filters.search!.toLowerCase())
      )
    }

    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit)
    }

    return filtered
  }

  getRestaurantById(id: string): DatasetRestaurant | null {
    this.loadData()
    return this.restaurants.find(r => r.id === id) || null
  }



  getCities(): string[] {
    this.loadData()
    const cities = [...new Set(this.restaurants.map(r => r.location.city))]
    return cities.sort()
  }

  getCuisines(): string[] {
    this.loadData()
    const cuisines = new Set<string>()
    this.restaurants.forEach(r => {
      r.cuisines.split(',').forEach(c => cuisines.add(c.trim()))
    })
    return Array.from(cuisines).sort()
  }


}

export const datasetAPI = new DatasetAPI()