import { useEffect } from 'react'
import { useStores } from '@/hooks/useStores'
import { RANGE_PRESETS, type RangePreset } from '@/lib/finance'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export const ALL_STORES = 'all'

type Props = {
  range: RangePreset
  onRangeChange: (range: RangePreset) => void
  isOwner: boolean
  storeId: string
  onStoreChange: (storeId: string) => void
}

// Date range + (owner only) store filter shared by the GCash and Expenses screens
export function FinanceFilters({ range, onRangeChange, isOwner, storeId, onStoreChange }: Props) {
  const { stores, fetchStores } = useStores()

  useEffect(() => {
    if (isOwner) fetchStores()
  }, [isOwner]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-wrap gap-2">
      <Select value={range} onValueChange={v => onRangeChange(v as RangePreset)}>
        <SelectTrigger className="w-[150px] bg-white"><SelectValue /></SelectTrigger>
        <SelectContent>
          {RANGE_PRESETS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
        </SelectContent>
      </Select>

      {isOwner && stores.length > 1 && (
        <Select value={storeId} onValueChange={onStoreChange}>
          <SelectTrigger className="w-[180px] bg-white"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STORES}>All stores</SelectItem>
            {stores.map((s: { id: string; name: string }) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
