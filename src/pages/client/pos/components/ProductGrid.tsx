import { formatCurrency } from '@/lib/utils'
'use client'

import { Package, Plus, Minus } from 'lucide-react'

interface CartItem {
  product_id: string
  quantity: number
}

interface ProductGridProps {
  products: any[]
  onProductClick: (product: any) => void
  loading: boolean
  cart?: CartItem[]
  onUpdateQuantity?: (product_id: string, quantity: number) => void
}

export default function ProductGrid({ products, onProductClick, loading, cart = [], onUpdateQuantity }: ProductGridProps) {
  const getCartItem = (productId: string) => cart.find(item => item.product_id === productId)

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="animate-pulse bg-white rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-200 h-28 md:h-32"></div>
            <div className="p-2">
              <div className="bg-gray-200 h-3 rounded mb-2"></div>
              <div className="bg-gray-200 h-3 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Package className="h-12 w-12 text-gray-300 mb-3" />
        <p className="text-base font-medium text-gray-500">No products found</p>
        <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {products.map((product) => {
        const cartItem = getCartItem(product.id)
        const inCart = !!cartItem

        return (
          <div
            key={product.id}
            className={`bg-white rounded-xl overflow-hidden shadow-sm cursor-pointer transition-all border-2 ${
              inCart ? 'border-[#E8302A]' : 'border-transparent hover:border-gray-200 hover:shadow-md'
            }`}
            onClick={() => !inCart && onProductClick(product)}
          >
            {/* Product Image */}
            <div className="relative bg-gray-100 h-28 md:h-32 flex items-center justify-center overflow-hidden">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="object-cover w-full h-full"
                />
              ) : (
                <Package className="h-10 w-10 text-gray-300" />
              )}
              {inCart && (
                <div className="absolute top-1.5 right-1.5 bg-[#E8302A] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItem.quantity}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="p-2">
              <h3 className="font-semibold text-xs md:text-sm mb-0.5 line-clamp-1">
                {product.name}
              </h3>
              <p className="text-sm font-bold text-[#E8302A] mb-2">
                {formatCurrency(parseFloat(product.default_price))}
              </p>

              {/* Quantity Controls or Add Button */}
              {inCart && onUpdateQuantity ? (
                <div
                  className="flex items-center justify-between bg-[#E8302A] rounded-lg overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="flex-1 py-1.5 text-white flex items-center justify-center hover:bg-[#B91C1C] transition-colors"
                    onClick={() => onUpdateQuantity(product.id, cartItem.quantity - 1)}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-white font-bold text-sm px-2">{cartItem.quantity}</span>
                  <button
                    className="flex-1 py-1.5 text-white flex items-center justify-center hover:bg-[#B91C1C] transition-colors"
                    onClick={() => onProductClick(product)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  className="w-full py-1.5 bg-gray-100 hover:bg-[#FFF1F0] text-gray-700 hover:text-[#E8302A] rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()
                    onProductClick(product)
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
