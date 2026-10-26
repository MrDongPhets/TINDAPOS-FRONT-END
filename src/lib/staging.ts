// Staging build (staging.tindapo.com): VITE_STAGING=1 is set only on Vercel Preview → feat/invoicing.
// Testers get every feature and never see plans, prices, trials or billing. Live builds never set it.
export const IS_STAGING = import.meta.env.VITE_STAGING === '1'
