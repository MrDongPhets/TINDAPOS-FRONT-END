import { useState, useEffect } from 'react'
import { useApiClient } from '@/hooks/useApiClient'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/ui/app-sidebar'
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { UserMenuDropdown } from '@/components/ui/UserMenuDropdown'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { ImageUpload } from '@/components/ui/image-upload'
import { formatCurrency } from '@/lib/utils'
import { Gift, Plus, Pencil, Trash2, Loader2, AlertCircle, X, Package2 } from 'lucide-react'

type BundleItem = {
  product_id: string
  quantity: number
  component?: { id: string; name: string; default_price: number; stock_quantity: number }
}

type Bundle = {
  id: string
  name: string
  description: string | null
  default_price: number
  image_url: string | null
  store_id: string
  category_id: string | null
  effective_stock: number
  bundle_items: BundleItem[]
}

type Product = { id: string; name: string; default_price: number; stock_quantity: number }
type Store   = { id: string; name: string }

const EMPTY_FORM = { name: '', description: '', default_price: '', store_id: '', category_id: '', image_url: '' }

export default function BundlesPage() {
  const { get, post, put, delete: del } = useApiClient()
  const { toast } = useToast()

  const [bundles,      setBundles]      = useState<Bundle[]>([])
  const [stores,       setStores]       = useState<Store[]>([])
  const [products,     setProducts]     = useState<Product[]>([])
  const [filterStore,  setFilterStore]  = useState('all')
  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState('')
  const [formError,    setFormError]    = useState('')

  const [showModal,    setShowModal]    = useState(false)
  const [editing,      setEditing]      = useState<Bundle | null>(null)
  const [form,         setForm]         = useState(EMPTY_FORM)
  const [bundleItems,  setBundleItems]  = useState<BundleItem[]>([])

  useEffect(() => { init() }, [])
  useEffect(() => { if (filterStore !== 'all') fetchBundles(filterStore) }, [filterStore])

  const fetchBundles = async (storeId: string) => {
    setLoading(true)
    const url = storeId === 'all' ? '/client/bundles' : `/client/bundles?store_id=${storeId}`
    const res = await get(url)
    if (res?.success) setBundles(res.data?.bundles || [])
    setLoading(false)
  }

  const init = async () => {
    setLoading(true)
    const [bundlesRes, storesRes] = await Promise.all([
      get('/client/bundles'),
      get('/client/stores'),
    ])
    if (bundlesRes?.success) setBundles(bundlesRes.data?.bundles || [])
    if (storesRes?.success)  setStores(storesRes.data?.stores || [])
    setLoading(false)
  }

  const fetchProducts = async (storeId: string) => {
    const res = await get(`/client/products?store_id=${storeId}`)
    if (res?.success) {
      setProducts((res.data?.products || []).filter((p: any) => p.product_type !== 'bundle' && p.is_active))
    }
  }

  const openCreate = () => {
    setEditing(null); setForm(EMPTY_FORM); setBundleItems([]); setProducts([]); setFormError('')
    setShowModal(true)
  }

  const openEdit = async (bundle: Bundle) => {
    setFormError(''); setEditing(bundle)
    setForm({
      name: bundle.name,
      description: bundle.description || '',
      default_price: String(bundle.default_price),
      store_id: bundle.store_id,
      category_id: bundle.category_id || '',
      image_url: bundle.image_url || '',
    })
    setBundleItems((bundle.bundle_items || []).map(bi => ({
      product_id: bi.component?.id ?? bi.product_id,
      quantity: bi.quantity,
      component: bi.component,
    })))
    await fetchProducts(bundle.store_id)
    setShowModal(true)
  }

  const handleStoreChange = async (storeId: string) => {
    setForm(f => ({ ...f, store_id: storeId }))
    setBundleItems([])
    await fetchProducts(storeId)
  }

  const addItem    = () => setBundleItems(p => [...p, { product_id: '', quantity: 1 }])
  const removeItem = (i: number) => setBundleItems(p => p.filter((_, idx) => idx !== i))
  const updateItem = (i: number, field: 'product_id' | 'quantity', value: string | number) => {
    setBundleItems(prev => {
      const next = [...prev]
      if (field === 'product_id') {
        const prod = products.find(p => p.id === value)
        next[i] = { ...next[i], product_id: value as string, component: prod ? { id: prod.id, name: prod.name, default_price: prod.default_price, stock_quantity: prod.stock_quantity } : undefined }
      } else {
        next[i] = { ...next[i], quantity: Number(value) || 1 }
      }
      return next
    })
  }

  const handleSave = async () => {
    setFormError('')
    if (!form.name.trim()) { setFormError('Bundle name is required.'); return }
    if (!form.default_price) { setFormError('Bundle price is required.'); return }
    if (!form.store_id) { setFormError('Please select a store.'); return }
    if (bundleItems.length === 0) { setFormError('Add at least one product to the bundle.'); return }
    if (bundleItems.some(i => !i.product_id)) { setFormError('Select a product for every item in the bundle.'); return }
    setSaving(true)
    const payload = {
      name: form.name, description: form.description || null,
      default_price: parseFloat(form.default_price),
      store_id: form.store_id, category_id: form.category_id || null,
      image_url: form.image_url || null,
      items: bundleItems.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
    }
    const res = editing ? await put(`/client/bundles/${editing.id}`, payload) : await post('/client/bundles', payload)
    setSaving(false)
    if (res?.success) {
      toast({ title: editing ? 'Bundle updated' : 'Bundle created' })
      setShowModal(false); init()
    } else {
      toast({ title: 'Error', description: res?.error || 'Failed to save bundle', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete bundle "${name}"?`)) return
    const res = await del(`/client/bundles/${id}`)
    if (res?.success) {
      toast({ title: 'Bundle deleted' })
      setBundles(p => p.filter(b => b.id !== id))
    } else {
      toast({ title: 'Error', description: res?.error || 'Failed to delete', variant: 'destructive' })
    }
  }

  const regularTotal = (b: Bundle) =>
    (b.bundle_items || []).reduce((s, i) => s + (i.component?.default_price ?? 0) * i.quantity, 0)

  const itemsTotal = bundleItems.reduce((s, i) => s + (i.component?.default_price ?? 0) * i.quantity, 0)
  const savings    = itemsTotal - parseFloat(form.default_price || '0')

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/client/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/client/inventory/products">Inventory</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem><BreadcrumbPage>Bundles</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto"><UserMenuDropdown /></div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-4 pb-24">
          {/* Title row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">Bundles</h1>
            </div>
            <div className="flex items-center gap-2">
              {stores.length > 1 && (
                <Select value={filterStore} onValueChange={setFilterStore}>
                  <SelectTrigger className="w-full sm:w-44">
                    <SelectValue placeholder="All Stores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stores</SelectItem>
                    {stores.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              <Button onClick={openCreate} className="bg-[#E8302A] hover:bg-[#B91C1C] gap-2 shrink-0">
                <Plus className="h-4 w-4" /> New Bundle
              </Button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : bundles.length === 0 ? (
            <div className="text-center py-20 text-gray-400 border-2 border-dashed rounded-xl">
              <Gift className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium text-gray-500">No bundles yet</p>
              <p className="text-sm mt-1">Create a bundle to offer combo deals to your customers</p>
              <Button onClick={openCreate} variant="outline" className="mt-4 gap-2">
                <Plus className="h-4 w-4" /> Create First Bundle
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {bundles.map(bundle => {
                const saved = regularTotal(bundle) - bundle.default_price
                return (
                  <div key={bundle.id} className="bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    {/* Image */}
                    <div className="relative h-36 bg-gray-100 flex items-center justify-center">
                      {bundle.image_url
                        ? <img src={bundle.image_url} alt={bundle.name} className="w-full h-full object-cover" />
                        : <Gift className="h-10 w-10 text-gray-300" />
                      }
                      <Badge className="absolute top-2 left-2 bg-purple-100 text-purple-700 border-0 text-xs">Bundle</Badge>
                      <div className="absolute top-2 right-2 flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7 bg-white/90 text-orange-500 hover:text-orange-600 hover:bg-white shadow-sm" onClick={() => openEdit(bundle)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 bg-white/90 text-red-500 hover:text-red-600 hover:bg-white shadow-sm" onClick={() => handleDelete(bundle.id, bundle.name)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="mb-3">
                        <h3 className="font-semibold text-gray-900 truncate">{bundle.name}</h3>
                        {bundle.description && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{bundle.description}</p>
                        )}
                      </div>

                      <div className="space-y-1.5 mb-3">
                        {(bundle.bundle_items || []).map((item, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <Package2 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                            <span className="flex-1 text-gray-700 truncate">{item.component?.name || 'Unknown'}</span>
                            <span className="text-gray-400 text-xs shrink-0">×{item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      <div className="border-t pt-3 flex items-end justify-between">
                        <div>
                          <p className="text-lg font-bold text-[#E8302A]">{formatCurrency(bundle.default_price)}</p>
                          {saved > 0 && (
                            <p className="text-xs text-green-600 font-medium">Save {formatCurrency(saved)} vs. buying separately</p>
                          )}
                        </div>
                        <Badge className={`text-xs border-0 ${
                          bundle.effective_stock > 5  ? 'bg-gray-100 text-gray-600' :
                          bundle.effective_stock > 0  ? 'bg-orange-100 text-orange-700' :
                                                        'bg-red-100 text-red-700'
                        }`}>
                          {bundle.effective_stock > 0 ? `${bundle.effective_stock} available` : 'Out of stock'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </SidebarInset>

      {/* Create / Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" onOpenAutoFocus={e => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Bundle' : 'New Bundle'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Bundle Name *</Label>
                <Input className="mt-1" placeholder="e.g. Family Meal Pack" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <Label>Bundle Price *</Label>
                <Input className="mt-1" type="number" step="0.01" placeholder="0.00" value={form.default_price}
                  onChange={e => setForm(f => ({ ...f, default_price: e.target.value }))} />
              </div>
              <div>
                <Label>Store *</Label>
                <Select value={form.store_id} onValueChange={handleStoreChange} disabled={!!editing}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select store" /></SelectTrigger>
                  <SelectContent>
                    {stores.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Description <span className="text-gray-400">(optional)</span></Label>
                <Input className="mt-1" placeholder="What's included, promo details..." value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>Image <span className="text-gray-400">(optional)</span></Label>
                <div className="mt-1">
                  <ImageUpload
                    value={form.image_url}
                    onChange={url => setForm(f => ({ ...f, image_url: url }))}
                    disabled={saving}
                  />
                </div>
              </div>
            </div>

            {/* Bundle Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Products in Bundle *</Label>
                <Button type="button" size="sm" className="gap-1 h-7 text-xs bg-[#E8302A] hover:bg-[#B91C1C] text-white"
                  onClick={addItem} disabled={!form.store_id}>
                  <Plus className="h-3 w-3" /> Add Product
                </Button>
              </div>

              {!form.store_id && <p className="text-xs text-gray-400 py-2">Select a store first to pick products.</p>}
              {form.store_id && bundleItems.length === 0 && <p className="text-xs text-gray-400 py-2">No products added yet.</p>}

              <div className="space-y-2">
                {bundleItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Select value={item.product_id} onValueChange={v => updateItem(i, 'product_id', v)}>
                      <SelectTrigger className="flex-1 h-9"><SelectValue placeholder="Select product" /></SelectTrigger>
                      <SelectContent>
                        {products.map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} <span className="text-gray-400 text-xs ml-1">({formatCurrency(p.default_price)})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input type="number" min="1" className="w-16 h-9 text-center" value={item.quantity}
                      onChange={e => updateItem(i, 'quantity', e.target.value)} />
                    <Button type="button" size="icon" variant="ghost" className="h-9 w-9 text-gray-400 hover:text-red-500 shrink-0"
                      onClick={() => removeItem(i)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Savings preview */}
              {bundleItems.length > 0 && form.default_price && bundleItems.every(i => i.component) && (
                <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 text-sm space-y-1">
                  <div className="flex justify-between text-gray-600">
                    <span>Regular price (sum)</span>
                    <span>{formatCurrency(itemsTotal)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-green-700">
                    <span>Customer saves</span>
                    <span>{formatCurrency(savings)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {formError && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle className="h-4 w-4 shrink-0" /> {formError}
            </div>
          )}

          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#E8302A] hover:bg-[#B91C1C] min-w-[100px]">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? 'Save Changes' : 'Create Bundle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}
