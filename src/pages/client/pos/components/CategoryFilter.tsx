'use client'

import { cn } from '@/lib/utils'

export default function CategoryFilter({ categories, selectedCategory, onSelectCategory }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
      <button
        onClick={() => onSelectCategory('all')}
        className={cn(
          'whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors shrink-0',
          selectedCategory === 'all'
            ? 'bg-[#E8302A] text-white'
            : 'bg-white text-gray-600 border border-gray-200 hover:border-[#E8302A] hover:text-[#E8302A]'
        )}
      >
        All Items
      </button>

      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelectCategory(category.id)}
          className={cn(
            'whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors shrink-0 border',
            selectedCategory === category.id
              ? 'text-white'
              : 'bg-white text-gray-600 hover:opacity-80'
          )}
          style={{
            backgroundColor: selectedCategory === category.id ? category.color : 'transparent',
            borderColor: category.color || '#e5e7eb',
            color: selectedCategory === category.id ? '#fff' : category.color || '#4b5563'
          }}
        >
          {category.name}
        </button>
      ))}
    </div>
  )
}
