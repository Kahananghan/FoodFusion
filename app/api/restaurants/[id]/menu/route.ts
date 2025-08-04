import { NextRequest, NextResponse } from 'next/server'

const menuData: { [key: string]: any[] } = {
  '1002': [
    {
      id: '1',
      name: 'Butter Chicken',
      description: 'Creamy tomato-based curry with tender chicken',
      price: 450,
      image: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=300&h=200&fit=crop'
    },
    {
      id: '2',
      name: 'Fish Curry',
      description: 'Fresh seafood in coconut curry',
      price: 520,
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop'
    }
  ],
  '1003': [
    {
      id: '3',
      name: 'Dal Bukhara',
      description: 'Slow-cooked black lentils',
      price: 380,
      image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=200&fit=crop'
    },
    {
      id: '4',
      name: 'Tandoori Chicken',
      description: 'Clay oven roasted chicken',
      price: 650,
      image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=300&h=200&fit=crop'
    }
  ],
  '1004': [
    {
      id: '5',
      name: 'Mutton Korma',
      description: 'Traditional Mughlai mutton curry',
      price: 320,
      image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300&h=200&fit=crop'
    },
    {
      id: '6',
      name: 'Chicken Biryani',
      description: 'Aromatic rice with spiced chicken',
      price: 280,
      image: 'https://images.unsplash.com/photo-1563379091339-03246963d96c?w=300&h=200&fit=crop'
    }
  ],
  '1005': [
    {
      id: '7',
      name: 'Pasta Arrabiata',
      description: 'Spicy tomato pasta with herbs',
      price: 420,
      image: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=300&h=200&fit=crop'
    },
    {
      id: '8',
      name: 'Cappuccino',
      description: 'Rich espresso with steamed milk',
      price: 180,
      image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=300&h=200&fit=crop'
    }
  ],
  '1006': [
    {
      id: '9',
      name: 'Appam with Stew',
      description: 'Soft rice pancakes with coconut stew',
      price: 380,
      image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=300&h=200&fit=crop'
    },
    {
      id: '10',
      name: 'Fish Moilee',
      description: 'Kerala fish curry in coconut milk',
      price: 480,
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop'
    }
  ],
  '1007': [
    {
      id: '11',
      name: 'Fish and Chips',
      description: 'Crispy battered fish with fries',
      price: 450,
      image: 'https://images.unsplash.com/photo-1544982503-9f984c14501a?w=300&h=200&fit=crop'
    },
    {
      id: '12',
      name: 'Chicken Tikka',
      description: 'Grilled marinated chicken pieces',
      price: 380,
      image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=300&h=200&fit=crop'
    }
  ]
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const menu = menuData[params.id] || []
  return NextResponse.json(menu)
}