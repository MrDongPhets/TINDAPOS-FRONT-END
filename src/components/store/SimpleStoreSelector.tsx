// src/components/store/SimpleStoreSelector.jsx - No context dependency

import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Building2, 
  CheckCircle
} from "lucide-react"

export function SimpleStoreSelector({
  stores = [],
  selectedStore = null,
  onStoreSelect = null,
  viewMode = null,
  onToggleViewMode = null,
  loading = false,
  className = ""
}) {
  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Building2 className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-500">Loading stores...</span>
      </div>
    )
  }

  if (stores.length <= 1) {
    return (
      <div className={`flex items-center gap-2 min-w-0 ${className}`}>
        <Building2 className="h-4 w-4 text-blue-600 shrink-0" />
        <span className="font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">
          {stores[0]?.name || 'Main Store'}
        </span>
        <Badge variant="secondary" className="text-xs hidden sm:inline-flex shrink-0">
          Single Store
        </Badge>
      </div>
    )
  }

  // Multiple stores - show selector
  return (
    <div className={`flex items-center gap-2 min-w-0 ${className}`}>
      <Building2 className="h-4 w-4 text-blue-600 shrink-0" />

      {/* View Mode Toggle */}
      <div className="flex items-center gap-2 min-w-0">
        <Button
          variant={viewMode === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={onToggleViewMode}
          className="h-8 text-xs shrink-0"
        >
          {viewMode === 'all' ? (
            <>
              <CheckCircle className="h-3 w-3 sm:mr-1" />
              <span className="hidden sm:inline">All Stores</span>
            </>
          ) : (
            <>
              <span className="hidden sm:inline">View All Stores</span>
              <span className="sm:hidden">All</span>
            </>
          )}
        </Button>

        {viewMode === 'single' && (
          <Select
            value={selectedStore?.id || ''}
            onValueChange={(storeId) => {
              const store = stores.find(s => s.id === storeId)
              onStoreSelect(store)
            }}
          >
            <SelectTrigger className="w-32 sm:w-44 h-8 min-w-0">
              <SelectValue placeholder="Select store...">
                {selectedStore ? (
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-medium truncate">{selectedStore.name}</span>
                    <Badge
                      variant="secondary"
                      className={`text-xs shrink-0 hidden sm:inline-flex ${
                        selectedStore.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {selectedStore.status}
                    </Badge>
                  </div>
                ) : (
                  'Select store...'
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {stores.map((store) => (
                <SelectItem key={store.id} value={store.id}>
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium">{store.name}</span>
                    <Badge
                      variant="secondary"
                      className={`text-xs ml-2 ${
                        store.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {store.status}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  )
}