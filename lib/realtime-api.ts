// Real-time API client utilities
export class RealTimeRestaurantAPI {
  private baseUrl: string
  
  constructor(baseUrl: string = '/api/restaurants') {
    this.baseUrl = baseUrl
  }
  
  // Fetch real-time data for multiple restaurants
  async getRealTimeData(restaurantIds: string[], city?: string) {
    const params = new URLSearchParams()
    if (restaurantIds.length > 0) {
      params.append('ids', restaurantIds.join(','))
    }
    if (city) {
      params.append('city', city)
    }
    
    const response = await fetch(`${this.baseUrl}/realtime?${params}`)
    return response.json()
  }
  
  // Get current offers
  async getOffers(restaurantId?: string, activeOnly: boolean = true) {
    const params = new URLSearchParams()
    if (restaurantId) {
      params.append('restaurantId', restaurantId)
    }
    if (activeOnly) {
      params.append('active', 'true')
    }
    
    const response = await fetch(`${this.baseUrl}/offers?${params}`)
    return response.json()
  }
  
  // Subscribe to live updates using Server-Sent Events
  subscribeToLiveUpdates(restaurantId: string, onUpdate: (data: any) => void) {
    const eventSource = new EventSource(`${this.baseUrl}/live?id=${restaurantId}`)
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        onUpdate(data)
      } catch (error) {
        console.error('Error parsing live update:', error)
      }
    }
    
    eventSource.onerror = (error) => {
      console.error('Live update connection error:', error)
    }
    
    return eventSource
  }
  
  // Fetch enhanced restaurant data with real-time info
  async getRestaurantWithRealTimeData(restaurantId: string) {
    const response = await fetch(`${this.baseUrl}/${restaurantId}`)
    return response.json()
  }
}

// Hook for React components
export const useRealTimeRestaurant = (restaurantId: string) => {
  const api = new RealTimeRestaurantAPI()
  
  return {
    getRealTimeData: () => api.getRealTimeData([restaurantId]),
    getOffers: () => api.getOffers(restaurantId),
    subscribeToUpdates: (callback: (data: any) => void) => 
      api.subscribeToLiveUpdates(restaurantId, callback),
    getRestaurant: () => api.getRestaurantWithRealTimeData(restaurantId)
  }
}