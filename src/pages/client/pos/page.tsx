'use client'
import logger from '@/utils/logger';

import { useState, useEffect } from 'react'
import { localDb, generateLocalId } from '@/db/localDb'
import { ArrowLeft, LogOut, Percent, RotateCcw, PauseCircle, ShoppingCart, X, Store as StoreIcon, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ProductSearch from './components/ProductSearch'
import CategoryFilter from './components/CategoryFilter'
import ProductGrid from './components/ProductGrid'
import Cart from './components/Cart'
import PaymentModal from './components/PaymentModal'
import DiscountModal from './components/DiscountModal'
import ReceiptModal from './components/ReceiptModal'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Link } from 'react-router-dom'
import { useAuth } from '@/components/auth/AuthProvider'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import API_CONFIG from '@/config/api'
import { formatCurrency } from '@/lib/utils'

export default function POSPage() {
  const { toast } = useToast()
  const { isStaff, logout } = useAuth()
  const isOnline = useNetworkStatus()

  // State
  const [stores, setStores] = useState([])
  const [selectedStore, setSelectedStore] = useState(null)
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [discount, setDiscount] = useState({ type: null, value: 0 })
  const [loading, setLoading] = useState(false)

  // Modals
  const [showPayment, setShowPayment] = useState(false)
  const [showDiscount, setShowDiscount] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [showMobileCart, setShowMobileCart] = useState(false)
  const [showHeldOrders, setShowHeldOrders] = useState(false)
  const [lastSale, setLastSale] = useState(null)
  const [lastCartItems, setLastCartItems] = useState([])

  // Hold Order
  const [heldOrders, setHeldOrders] = useState<{ id: number; cart: any[]; discount: any; time: string }[]>([])

  const holdOrder = () => {
    if (cart.length === 0) {
      toast({ title: "Cart is empty", description: "Add items before holding an order", variant: "destructive" })
      return
    }
    const held = { id: Date.now(), cart: [...cart], discount: { ...discount }, time: new Date().toLocaleTimeString() }
    setHeldOrders(prev => [...prev, held])
    setCart([])
    setDiscount({ type: null, value: 0 })
    toast({ title: "Order held", description: `Order saved. Cart cleared.` })
  }

  const restoreHeldOrder = (id: number) => {
    const held = heldOrders.find(o => o.id === id)
    if (!held) return
    if (cart.length > 0) {
      toast({ title: "Clear current cart first", description: "Clear or checkout current items before restoring", variant: "destructive" })
      return
    }
    setCart(held.cart)
    setDiscount(held.discount)
    setHeldOrders(prev => prev.filter(o => o.id !== id))
    setShowHeldOrders(false)
    toast({ title: "Order restored" })
  }

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
    'Content-Type': 'application/json'
  })

  useEffect(() => { fetchStores() }, [])

  useEffect(() => {
    if (selectedStore) {
      fetchCategories()
      fetchProducts()
    }
  }, [selectedStore, selectedCategory])

  useEffect(() => {
    if (selectedStore) {
      setCart([])
      setDiscount({ type: null, value: 0 })
    }
  }, [selectedStore?.id])

  const loadStoresFromCache = async () => {
    const companyData = localStorage.getItem('companyData')
    const companyId = companyData ? JSON.parse(companyData).id : ''
    const cachedStores = companyId
      ? await localDb.stores.where('company_id').equals(companyId).toArray()
      : await localDb.stores.toArray()
    if (cachedStores.length > 0) {
      setStores(cachedStores)
      const savedStoreId = localStorage.getItem('selectedStoreId')
      const toSelect = cachedStores.find(s => s.id === savedStoreId) || cachedStores[0]
      if (toSelect) setSelectedStore(toSelect)
    }
  }

  const fetchStores = async () => {
    try {
      // ── OFFLINE: load from IndexedDB cache ─────────────────────
      if (!navigator.onLine) {
        await loadStoresFromCache()
        return
      }

      // ── ONLINE: fetch from API ──────────────────────────────────
      const response = await fetch(`${API_CONFIG.BASE_URL}/pos/stores`, { headers: getAuthHeaders() })
      const data = await response.json()
      const storeList = data.stores || []
      setStores(storeList)
      if (storeList.length > 0) {
        const savedStoreId = localStorage.getItem('selectedStoreId')
        const toSelect = storeList.find((s: any) => s.id === savedStoreId) || storeList[0]
        setSelectedStore(toSelect)

        // Cache for offline use
        const companyData = localStorage.getItem('companyData')
        const companyId = companyData ? JSON.parse(companyData).id : ''
        const now = Date.now()
        await localDb.stores.bulkPut(
          storeList.map((s: any) => ({ ...s, company_id: s.company_id || companyId, cached_at: now }))
        )
      }
    } catch (error) {
      logger.error('Fetch stores error:', error)
      await loadStoresFromCache()
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/pos/categories`, { headers: getAuthHeaders() })
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      logger.error('Fetch categories error:', error)
    }
  }

  const fetchProducts = async () => {
    if (!selectedStore) return
    try {
      setLoading(true)

      // ── OFFLINE: load from IndexedDB ─────────────────────────────
      if (!navigator.onLine) {
        let cached = await localDb.products.where('store_id').equals(selectedStore.id).toArray()
        if (selectedCategory && selectedCategory !== 'all') {
          cached = cached.filter(p => p.category_id === selectedCategory)
        }
        setProducts(cached)
        return
      }

      // ── ONLINE: fetch from API ────────────────────────────────────
      const params = new URLSearchParams({ store_id: selectedStore.id, category_id: selectedCategory })
      const response = await fetch(`${API_CONFIG.BASE_URL}/pos/products/category?${params}`, { headers: getAuthHeaders() })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      const productList = data.products || []
      setProducts(productList)

      // Cache for offline use
      if (productList.length > 0) {
        const companyData = localStorage.getItem('companyData')
        const companyId = companyData ? JSON.parse(companyData).id : ''
        const now = Date.now()
        await localDb.products.bulkPut(
          productList.map((p: any) => ({ ...p, company_id: p.company_id || companyId, cached_at: now }))
        )
      }
    } catch (error) {
      logger.error('Fetch products error:', error)
      // Fallback to cache on any network failure (handles Android where navigator.onLine is unreliable)
      try {
        let cached = await localDb.products.where('store_id').equals(selectedStore.id).toArray()
        if (selectedCategory && selectedCategory !== 'all') {
          cached = cached.filter(p => p.category_id === selectedCategory)
        }
        if (cached.length > 0) {
          setProducts(cached)
        } else {
          toast({ title: "Error", description: "Failed to fetch products", variant: "destructive" })
        }
      } catch {
        toast({ title: "Error", description: "Failed to fetch products", variant: "destructive" })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (query) => {
    setSearchQuery(query)
    if (query.length < 2) { fetchProducts(); return }
    if (!selectedStore) return
    try {
      const params = new URLSearchParams({ query, store_id: selectedStore.id })
      const response = await fetch(`${API_CONFIG.BASE_URL}/pos/products/search?${params}`, { headers: getAuthHeaders() })
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      logger.error('Search error:', error)
    }
  }

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.product_id === product.id)
    if (existingItem) {
      if (existingItem.quantity >= product.stock_quantity) {
        toast({ title: "Stock Limit", description: "Cannot add more than available stock", variant: "destructive" })
        return
      }
      setCart(cart.map(item => item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
    } else {
      setCart([...cart, {
        product_id: product.id,
        name: product.name,
        price: product.default_price,
        quantity: 1,
        barcode: product.barcode,
        image_url: product.image_url,
        stock_quantity: product.stock_quantity,
        discount_amount: 0,
        discount_percent: 0
      }])
    }
  }

  const updateQuantity = (product_id, newQuantity) => {
    if (newQuantity === 0) {
      setCart(cart.filter(item => item.product_id !== product_id))
    } else {
      const item = cart.find(i => i.product_id === product_id)
      if (item && newQuantity > item.stock_quantity) {
        toast({ title: "Stock Limit", description: "Cannot exceed available stock", variant: "destructive" })
        return
      }
      setCart(cart.map(item => item.product_id === product_id ? { ...item, quantity: newQuantity } : item))
    }
  }

  const removeFromCart = (product_id) => setCart(cart.filter(item => item.product_id !== product_id))

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity - (item.discount_amount || 0)), 0)
    let discount_amount = 0
    if (discount.type === 'percentage') discount_amount = (subtotal * discount.value) / 100
    else if (discount.type === 'fixed') discount_amount = discount.value
    return {
      subtotal,
      discount_amount,
      total: subtotal - discount_amount,
      items_count: cart.reduce((sum, item) => sum + item.quantity, 0)
    }
  }

  const handlePayment = async (paymentMethod, customerInfo, selectedCustomer?, newCustomer?) => {
    if (cart.length === 0) {
      toast({ title: "Empty Cart", description: "Please add items to cart first", variant: "destructive" })
      return
    }
    if (!selectedStore) {
      toast({ title: "No Store Selected", description: "Please select a store first", variant: "destructive" })
      return
    }
    try {
      setLoading(true)
      const totals = calculateTotals()

      // For credit/utang: resolve customer_id
      let customer_id = selectedCustomer?.id || null
      if (paymentMethod === 'credit' && newCustomer?.name) {
        const createRes = await fetch(`${API_CONFIG.BASE_URL}/client/utang/customers`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ name: newCustomer.name, phone: newCustomer.phone })
        })
        if (createRes.ok) {
          const createData = await createRes.json()
          customer_id = createData.customer?.id
        }
      }

      const salePayload = {
        store_id: selectedStore.id,
        items: cart,
        payment_method: paymentMethod,
        subtotal: totals.subtotal,
        discount_amount: totals.discount_amount,
        discount_type: discount.type,
        total_amount: totals.total,
        customer_name: selectedCustomer?.name || newCustomer?.name || customerInfo.name,
        customer_phone: selectedCustomer?.phone || newCustomer?.phone || customerInfo.phone,
        customer_id,
        notes: customerInfo?.notes || null
      }

      // ── OFFLINE: queue sale locally ────────────────────────────────
      if (!navigator.onLine) {
        const companyData = localStorage.getItem('companyData')
        const companyId = companyData ? JSON.parse(companyData).id : ''
        await localDb.pending_sales.add({
          id: generateLocalId(),
          ...salePayload,
          company_id: companyId,
          created_at: Date.now(),
          sync_status: 'pending',
          retry_count: 0
        })
        setLastSale({ total_amount: totals.total, payment_method: paymentMethod })
        setLastCartItems([...cart])
        setShowReceipt(true)
        setShowPayment(false)
        setShowMobileCart(false)
        setCart([])
        setDiscount({ type: null, value: 0 })
        toast({ title: "Sale Saved Offline", description: "Will sync automatically when back online." })
        return
      }

      // ── ONLINE: submit to backend ──────────────────────────────────
      const response = await fetch(`${API_CONFIG.BASE_URL}/pos/sales`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(salePayload)
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Payment failed')
      }
      const data = await response.json()
      setLastSale(data.sale)
      setLastCartItems([...cart])
      setShowReceipt(true)
      setShowPayment(false)
      setShowMobileCart(false)
      setCart([])
      setDiscount({ type: null, value: 0 })
      toast({ title: "Sale Completed", description: `Receipt: ${data.receipt_number}` })
    } catch (error) {
      logger.error('Payment error:', error)
      const isNetworkError = !error.message || error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.message.includes('Network request failed')
      if (isNetworkError) {
        // API unreachable (Android offline detection unreliable) — queue locally
        try {
          const companyData = localStorage.getItem('companyData')
          const companyId = companyData ? JSON.parse(companyData).id : ''
          const totals = calculateTotals()
          const salePayload = {
            store_id: selectedStore.id,
            items: cart,
            payment_method: paymentMethod,
            subtotal: totals.subtotal,
            discount_amount: totals.discount_amount,
            discount_type: discount.type,
            total_amount: totals.total,
            customer_name: selectedCustomer?.name || newCustomer?.name || customerInfo?.name || null,
            customer_phone: selectedCustomer?.phone || newCustomer?.phone || customerInfo?.phone || null,
            customer_id: selectedCustomer?.id || null,
            notes: customerInfo?.notes || null
          }
          await localDb.pending_sales.add({
            id: generateLocalId(),
            ...salePayload,
            company_id: companyId,
            created_at: Date.now(),
            sync_status: 'pending',
            retry_count: 0
          })
          setLastSale({ total_amount: totals.total, payment_method: paymentMethod })
          setLastCartItems([...cart])
          setShowReceipt(true)
          setShowPayment(false)
          setShowMobileCart(false)
          setCart([])
          setDiscount({ type: null, value: 0 })
          toast({ title: "Sale Saved Offline", description: "No connection — will sync when back online." })
        } catch (queueError) {
          logger.error('Queue error:', queueError)
          toast({ title: "Payment Failed", description: "Could not process or save the sale.", variant: "destructive" })
        }
      } else {
        toast({ title: "Payment Failed", description: error.message || "Failed to process payment", variant: "destructive" })
      }
    } finally {
      setLoading(false)
    }
  }

  const totals = calculateTotals()

  if (!selectedStore) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StoreIcon className="h-5 w-5 text-gray-400" />
              No Store Found
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm">You need to create a store before using the POS.</p>
<Button onClick={fetchStores} variant="outline" className="w-full">Refresh Stores</Button>
            <Link to="/client/stores" className="block">
              <Button className="w-full"><StoreIcon className="mr-2 h-4 w-4" />Go to Stores</Button>
            </Link>
            <Link to="/client/dashboard" className="block">
              <Button variant="ghost" className="w-full">Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div
      className="h-screen flex flex-col bg-gray-50 overflow-hidden"
      style={!isOnline ? { paddingTop: 'calc(2.25rem + env(safe-area-inset-top, 0px))' } : undefined}
    >
      {/* Header */}
      <div className="bg-white border-b px-3 py-2.5 shrink-0">
        <div className="flex items-center gap-2">
          {isStaff ? (
            <Button variant="ghost" size="sm" className="gap-1.5 shrink-0 text-gray-600" onClick={logout}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          ) : (
            <Link to="/client/dashboard">
              <Button variant="ghost" size="sm" className="gap-1.5 shrink-0 text-gray-600">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
            </Link>
          )}

          <div className="flex items-center gap-1.5 font-semibold text-base">
            <ShoppingCart className="h-4 w-4 text-[#E8302A]" />
            <span className="hidden sm:inline">Point of Sale</span>
            <span className="sm:hidden">POS</span>
          </div>

          <div className="ml-auto">
            <Select
              value={selectedStore?.id}
              onValueChange={(storeId) => {
                const store = stores.find(s => s.id === storeId)
                if (store) setSelectedStore(store)
              }}
            >
              <SelectTrigger className="h-8 text-sm border-gray-200 max-w-[160px]">
                <StoreIcon className="h-3 w-3 mr-1 shrink-0 text-gray-400" />
                <SelectValue placeholder="Select store" />
              </SelectTrigger>
              <SelectContent>
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    <div className="flex items-center gap-2">
                      <StoreIcon className="h-3 w-3" />
                      <span>{store.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Products Panel */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Search + Categories */}
          <div className="bg-white border-b px-3 pt-3 pb-0 shrink-0">
            <ProductSearch onSearch={handleSearch} searchQuery={searchQuery} />
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </div>

          {/* Product Grid - scrollable */}
          <div className="flex-1 overflow-y-auto p-3 pb-32 lg:pb-4">
            <ProductGrid
              products={products}
              onProductClick={addToCart}
              loading={loading}
              cart={cart}
              onUpdateQuantity={updateQuantity}
            />
          </div>
        </div>

        {/* Desktop Cart Sidebar */}
        <div className="hidden lg:flex w-80 xl:w-96 bg-white border-l shadow-lg shrink-0 h-full overflow-hidden flex-col">
          <Cart
            items={cart}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeFromCart}
            subtotal={totals.subtotal}
            discount={totals.discount_amount}
            total={totals.total}
            itemsCount={totals.items_count}
            onApplyDiscount={() => setShowDiscount(true)}
            onCheckout={() => setShowPayment(true)}
            hasDiscount={discount.type !== null}
            onClearCart={() => setCart([])}
          />
        </div>
      </div>

      {/* Mobile Bottom Toolbar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-40 pb-[env(safe-area-inset-bottom,0px)]">
        {/* Toolbar Icons */}
        <div className="flex items-center justify-around px-2 py-1.5 border-b border-gray-100">
          <button
            onClick={() => setShowDiscount(true)}
            className="flex flex-col items-center gap-0.5 p-2 text-gray-500 hover:text-[#E8302A] transition-colors"
          >
            <Percent className="h-5 w-5" />
            <span className="text-[10px]">Discount</span>
          </button>
          <button
            onClick={fetchProducts}
            className="flex flex-col items-center gap-0.5 p-2 text-gray-500 hover:text-[#E8302A] transition-colors"
          >
            <RotateCcw className="h-5 w-5" />
            <span className="text-[10px]">Refresh</span>
          </button>
          <button
            onClick={() => setCart([])}
            className="flex flex-col items-center gap-0.5 p-2 text-gray-500 hover:text-red-500 transition-colors"
          >
            <X className="h-5 w-5" />
            <span className="text-[10px]">Clear</span>
          </button>
          <button
            onClick={cart.length > 0 ? holdOrder : () => setShowHeldOrders(true)}
            className="relative flex flex-col items-center gap-0.5 p-2 text-gray-500 hover:text-[#E8302A] transition-colors"
          >
            <Clock className="h-5 w-5" />
            {heldOrders.length > 0 && (
              <span className="absolute top-1 right-1 bg-[#E8302A] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {heldOrders.length}
              </span>
            )}
            <span className="text-[10px]">Hold</span>
          </button>
        </div>

        {/* Order Summary Bar */}
        <button
          onClick={() => cart.length > 0 && setShowMobileCart(true)}
          className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${
            cart.length > 0
              ? 'bg-[#E8302A] hover:bg-[#B91C1C] active:bg-[#B91C1C]'
              : 'bg-gray-200 cursor-not-allowed'
          }`}
        >
          <span className={`text-sm font-semibold ${cart.length > 0 ? 'text-white' : 'text-gray-400'}`}>
            {totals.items_count > 0 ? `${totals.items_count} item${totals.items_count > 1 ? 's' : ''}` : 'Cart empty'}
          </span>
          <span className={`text-sm font-semibold ${cart.length > 0 ? 'text-white' : 'text-gray-400'}`}>
            Order Summary →
          </span>
          <span className={`text-sm font-bold ${cart.length > 0 ? 'text-white' : 'text-gray-400'}`}>
            {formatCurrency(totals.total)}
          </span>
        </button>
      </div>

      {/* Mobile Cart Sheet */}
      <Sheet open={showMobileCart} onOpenChange={setShowMobileCart}>
        <SheetContent side="bottom" className="h-[85vh] p-0 rounded-t-2xl" onOpenAutoFocus={(e) => e.preventDefault()}>
          <SheetHeader className="px-4 pt-4 pb-2 border-b">
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-[#E8302A]" />
              Order Summary
            </SheetTitle>
          </SheetHeader>
          <div className="h-full overflow-hidden">
            <Cart
              items={cart}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeFromCart}
              subtotal={totals.subtotal}
              discount={totals.discount_amount}
              total={totals.total}
              itemsCount={totals.items_count}
              onApplyDiscount={() => { setShowMobileCart(false); setShowDiscount(true) }}
              onCheckout={() => { setShowMobileCart(false); setShowPayment(true) }}
              hasDiscount={discount.type !== null}
              onClearCart={() => setCart([])}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Held Orders Sheet */}
      <Sheet open={showHeldOrders} onOpenChange={setShowHeldOrders}>
        <SheetContent side="bottom" className="h-[60vh] rounded-t-2xl p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
          <SheetHeader className="px-4 pt-4 pb-2 border-b">
            <SheetTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#E8302A]" />
              Held Orders ({heldOrders.length})
            </SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto h-full p-4 space-y-3">
            {heldOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
                <Clock className="h-10 w-10 mb-3" />
                <p className="font-medium">No held orders</p>
                <p className="text-sm">Hold an order to save it here</p>
              </div>
            ) : (
              heldOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                  <div>
                    <p className="font-medium text-sm">{order.cart.length} item{order.cart.length !== 1 ? 's' : ''}</p>
                    <p className="text-xs text-gray-500">Held at {order.time}</p>
                    <p className="text-xs text-[#E8302A] font-semibold">
                      {formatCurrency(order.cart.reduce((sum, i) => sum + i.price * i.quantity, 0))}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => restoreHeldOrder(order.id)}>Restore</Button>
                    <Button size="sm" variant="outline" onClick={() => setHeldOrders(prev => prev.filter(o => o.id !== order.id))}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Modals */}
      <PaymentModal
        open={showPayment}
        onClose={() => setShowPayment(false)}
        onSubmit={handlePayment}
        total={totals.total}
        loading={loading}
      />

      <DiscountModal
        open={showDiscount}
        onClose={() => setShowDiscount(false)}
        onApply={(type, value) => { setDiscount({ type, value }); setShowDiscount(false) }}
        currentDiscount={discount}
        subtotal={totals.subtotal}
      />

      <ReceiptModal
        open={showReceipt}
        onClose={() => setShowReceipt(false)}
        sale={lastSale}
        cartItems={lastCartItems}
        store={selectedStore}
        onNewSale={() => { setShowReceipt(false); setCart([]); setDiscount({ type: null, value: 0 }) }}
      />
    </div>
  )
}
