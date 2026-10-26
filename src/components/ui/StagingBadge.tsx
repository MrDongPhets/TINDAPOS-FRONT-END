// Small corner badge so nobody mistakes the staging site for the live app
import { IS_STAGING } from '@/lib/staging'

export function StagingBadge() {
  if (!IS_STAGING) return null
  return (
    <div className="pointer-events-none fixed left-2 top-2 z-[100] rounded-md bg-amber-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-950 shadow">
      Staging · test server
    </div>
  )
}
