// Staging build: testers get every feature and never see plans, prices, trials or billing. Live never matches.
// On when the app is opened at staging.tindapo.com (or any staging.* host), or when built with VITE_STAGING=1.
const onStagingHost = typeof window !== 'undefined' && /^staging\./i.test(window.location.hostname)

export const IS_STAGING = onStagingHost || ['1', 'true', 'yes'].includes(String(import.meta.env.VITE_STAGING || '').trim().toLowerCase())
