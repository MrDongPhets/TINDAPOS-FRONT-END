// Shape of GET/PUT /client/settings/eis — the e-invoicing provider (TaxTrail) connection, as the owner sees it
export interface EisConnectionView {
  connected: boolean
  encryption_ready?: boolean
  base_url?: string
  api_key_hint?: string
  key_environment?: string | null
  last_checked_at?: string | null
  last_check_ok?: boolean
  last_check_message?: string | null
  // How Tindapo hears BIR's answer: TaxTrail webhook (instant) or polling every few minutes
  status_updates?: 'webhook' | 'polling'
}

// A store may switch to e-invoice only when the saved connection passed its last test
export const eisReady = (c: EisConnectionView | null) => !!c?.connected && !!c.last_check_ok
