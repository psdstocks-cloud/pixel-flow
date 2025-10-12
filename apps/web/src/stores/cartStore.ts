import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  site: string
  stockId: string
  title: string
  image: string
  cost: number
  author: string
  sizeInBytes: string
  ext: string
}

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  clearCart: () => void
  getTotalCost: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item) => {
        const { items } = get()
        const existingItem = items.find(i => i.stockId === item.stockId && i.site === item.site)
        
        if (existingItem) {
          // Item already in cart, don't add duplicate
          return
        }
        
        set({ items: [...items, item] })
      },
      
      removeItem: (id) => {
        const { items } = get()
        set({ items: items.filter(item => item.id !== id) })
      },
      
      clearCart: () => {
        set({ items: [] })
      },
      
      getTotalCost: () => {
        const { items } = get()
        return items.reduce((total, item) => total + item.cost, 0)
      },
      
      getItemCount: () => {
        const { items } = get()
        return items.length
      },
    }),
    {
      name: 'pixel-flow-cart',
    }
  )
)
