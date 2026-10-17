// For Radix dialogs that host BarcodeScannerSheet: taps/focus inside the scanner (portaled to <body>)
// must not count as "outside the dialog", or the dialog would close while scanning.
export const ignoreScannerInteractions = (e: { target: EventTarget | null; preventDefault: () => void }) => {
  if ((e.target as HTMLElement | null)?.closest?.('[data-barcode-scanner]')) e.preventDefault()
}
