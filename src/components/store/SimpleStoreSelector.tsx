import { Store } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export function SimpleStoreSelector({
  stores = [],
  selectedStore = null,
  onStoreSelect = null,
  viewMode = null,
  onToggleViewMode = null,
  loading = false,
  className = ""
}) {
  if (loading || stores.length <= 1) return null

  const label = viewMode === 'all' ? 'All' : (selectedStore?.name?.slice(0, 8) || 'Store')

  const handleSelectAll = () => {
    if (viewMode !== 'all' && onToggleViewMode) onToggleViewMode()
  }

  const handleSelectStore = (store: any) => {
    if (viewMode === 'all' && onToggleViewMode) onToggleViewMode()
    if (onStoreSelect) onStoreSelect(store)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`h-8 gap-1.5 px-2.5 text-xs font-medium ${className}`}
        >
          <Store className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="max-w-[80px] truncate">{label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Select Store</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSelectAll}
          className={viewMode === 'all' ? 'font-semibold text-blue-600' : ''}
        >
          All Stores
        </DropdownMenuItem>
        {stores.map((store: any) => (
          <DropdownMenuItem
            key={store.id}
            onClick={() => handleSelectStore(store)}
            className={viewMode === 'single' && selectedStore?.id === store.id ? 'font-semibold text-blue-600' : ''}
          >
            {store.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
