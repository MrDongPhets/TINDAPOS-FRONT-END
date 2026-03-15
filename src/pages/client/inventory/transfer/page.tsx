
import { useState, useEffect } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/ui/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowRightLeft, Plus, Check, X, Clock, Package, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import API_CONFIG from "@/config/api"

export default function InventoryTransferPage() {
  const [user, setUser] = useState(null)
  const [stores, setStores] = useState([])
  const [products, setProducts] = useState([])
  const [transfers, setTransfers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectTransferId, setRejectTransferId] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    from_store_id: '',
    to_store_id: '',
    product_id: '',
    quantity: '',
    reason: '',
    notes: ''
  })

  useEffect(() => {
    const userData = localStorage.getItem('userData')
    if (userData) setUser(JSON.parse(userData))
    
    fetchStores()
    fetchTransfers()
  }, [])

  useEffect(() => {
    if (formData.from_store_id) {
      fetchProducts(formData.from_store_id)
    }
  }, [formData.from_store_id])

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
    'Content-Type': 'application/json'
  })

  const fetchStores = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/client/stores`, {
        headers: getAuthHeaders()
      })
      const data = await response.json()
      setStores(data.stores || [])
    } catch (error) {
      console.error('Fetch stores error:', error)
      toast.error('Failed to fetch stores')
    }
  }

  const fetchProducts = async (storeId) => {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/client/products?store_id=${storeId}`,
        { headers: getAuthHeaders() }
      )
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error('Fetch products error:', error)
      toast.error('Failed to fetch products')
    }
  }

  const fetchTransfers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_CONFIG.BASE_URL}/client/inventory-transfer/transfers`, {
        headers: getAuthHeaders()
      })
      const data = await response.json()
      setTransfers(data.transfers || [])
    } catch (error) {
      console.error('Fetch transfers error:', error)
      toast.error('Failed to fetch transfers')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation
    if (!formData.from_store_id || !formData.to_store_id || !formData.product_id || !formData.quantity) {
      toast.error('Please fill all required fields')
      return
    }

    if (parseInt(formData.quantity) <= 0) {
      toast.error('Quantity must be greater than 0')
      return
    }

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/client/inventory-transfer/transfers`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Transfer request created successfully')
        setShowDialog(false)
        setFormData({
          from_store_id: '',
          to_store_id: '',
          product_id: '',
          quantity: '',
          reason: '',
          notes: ''
        })
        fetchTransfers()
      } else {
        toast.error(data.error || 'Failed to create transfer')
      }
    } catch (error) {
      console.error('Create transfer error:', error)
      toast.error('Network error occurred')
    }
  }

  const handleApprove = async (id) => {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/client/inventory-transfer/transfers/${id}/approve`,
        {
          method: 'PATCH',
          headers: getAuthHeaders()
        }
      )

      const data = await response.json()

      if (response.ok) {
        toast.success('Transfer approved successfully')
        fetchTransfers()
      } else {
        toast.error(data.error || 'Failed to approve transfer')
      }
    } catch (error) {
      console.error('Approve transfer error:', error)
      toast.error('Failed to approve transfer')
    }
  }

  const handleReject = (id) => {
    setRejectTransferId(id)
    setRejectDialogOpen(true)
  }

  const confirmReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }

    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/client/inventory-transfer/transfers/${rejectTransferId}/reject`,
        {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify({ rejection_reason: rejectionReason })
        }
      )

      const data = await response.json()

      if (response.ok) {
        toast.success('Transfer rejected')
        setRejectDialogOpen(false)
        setRejectionReason('')
        setRejectTransferId(null)
        fetchTransfers()
      } else {
        toast.error(data.error || 'Failed to reject transfer')
      }
    } catch (error) {
      console.error('Reject transfer error:', error)
      toast.error('Failed to reject transfer')
    }
  }

  const handleComplete = async (id) => {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/client/inventory-transfer/transfers/${id}/complete`,
        {
          method: 'PATCH',
          headers: getAuthHeaders()
        }
      )

      const data = await response.json()

      if (response.ok) {
        toast.success('Transfer completed successfully')
        fetchTransfers()
      } else {
        toast.error(data.error || 'Failed to complete transfer')
      }
    } catch (error) {
      console.error('Complete transfer error:', error)
      toast.error('Failed to complete transfer')
    }
  }

  const getStatusBadge = (status) => {
    const config = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
      approved: { color: 'bg-blue-100 text-blue-800', icon: Check, label: 'Approved' },
      completed: { color: 'bg-green-100 text-green-800', icon: Check, label: 'Completed' },
      rejected: { color: 'bg-red-100 text-red-800', icon: X, label: 'Rejected' },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: X, label: 'Cancelled' }
    }
    
    const { color, icon: Icon, label } = config[status] || config.pending
    
    return (
      <Badge className={color}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    )
  }

  const selectedProduct = products.find(p => p.id === formData.product_id)

  return (
    <SidebarProvider>
      <AppSidebar userType="client" user={user} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b overflow-hidden">
          <div className="flex items-center gap-2 px-4 shrink-0">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Inventory Transfer</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold flex items-center gap-2">
                <ArrowRightLeft className="h-6 w-6 text-blue-600 shrink-0" />
                Inventory Transfer
              </h1>
              <p className="text-gray-500 text-sm mt-1">Transfer products between stores</p>
            </div>

            <div className="flex gap-2 items-start sm:items-end shrink-0">
              <Button variant="outline" size="sm" onClick={fetchTransfers} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>

              <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-[#E8302A] hover:bg-[#B91C1C]">
                    <Plus className="h-4 w-4 mr-2" />
                    New Transfer
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create Transfer Request</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label>From Store *</Label>
                      <Select
                        value={formData.from_store_id}
                        onValueChange={(value) =>
                          setFormData({ ...formData, from_store_id: value, product_id: '' })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select source store" />
                        </SelectTrigger>
                        <SelectContent>
                          {stores.map((store) => (
                            <SelectItem key={store.id} value={store.id}>
                              {store.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>To Store *</Label>
                      <Select
                        value={formData.to_store_id}
                        onValueChange={(value) =>
                          setFormData({ ...formData, to_store_id: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select destination store" />
                        </SelectTrigger>
                        <SelectContent>
                          {stores
                            .filter((s) => s.id !== formData.from_store_id)
                            .map((store) => (
                              <SelectItem key={store.id} value={store.id}>
                                {store.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Product *</Label>
                      <Select
                        value={formData.product_id}
                        onValueChange={(value) =>
                          setFormData({ ...formData, product_id: value })
                        }
                        disabled={!formData.from_store_id}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              <div className="flex justify-between w-full">
                                <span>{product.name}</span>
                                <span className="text-gray-500 ml-2">
                                  Stock: {product.stock_quantity}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {!formData.from_store_id && (
                        <p className="text-xs text-gray-500 mt-1">
                          Please select source store first
                        </p>
                      )}
                    </div>

                    <div>
                      <Label>Quantity *</Label>
                      <Input
                        type="number"
                        min="1"
                        max={selectedProduct?.stock_quantity || 999999}
                        value={formData.quantity}
                        onChange={(e) =>
                          setFormData({ ...formData, quantity: e.target.value })
                        }
                        placeholder="Enter quantity"
                        required
                      />
                      {selectedProduct && (
                        <p className="text-xs text-gray-500 mt-1">
                          Available: {selectedProduct.stock_quantity} units
                        </p>
                      )}
                    </div>

                    <div>
                      <Label>Reason</Label>
                      <Input
                        value={formData.reason}
                        onChange={(e) =>
                          setFormData({ ...formData, reason: e.target.value })
                        }
                        placeholder="e.g., Stock replenishment"
                      />
                    </div>

                    <div>
                      <Label>Notes (Optional)</Label>
                      <Textarea
                        value={formData.notes}
                        onChange={(e) =>
                          setFormData({ ...formData, notes: e.target.value })
                        }
                        placeholder="Additional notes..."
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setShowDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" className="flex-1">
                        Submit Request
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Transfers Table */}
          <Card>
            <CardHeader>
              <CardTitle>Transfer Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : transfers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No transfer requests yet</p>
                  <p className="text-sm">Create your first transfer request to get started</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transfer #</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>From → To</TableHead>
                      <TableHead className="text-center">Quantity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transfers.map((transfer) => (
                      <TableRow key={transfer.id}>
                        <TableCell className="font-mono text-xs">
                          {transfer.transfer_number}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {transfer.product?.image_url && (
                              <img 
                                src={transfer.product.image_url} 
                                alt={transfer.product.name}
                                className="h-8 w-8 rounded object-cover"
                              />
                            )}
                            <div>
                              <div className="font-medium">{transfer.product?.name}</div>
                              <div className="text-xs text-gray-500">
                                {transfer.product?.sku}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">{transfer.from_store?.name}</span>
                            <ArrowRightLeft className="h-3 w-3 text-gray-400" />
                            <span className="font-medium">{transfer.to_store?.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-semibold">
                          {transfer.quantity}
                        </TableCell>
                        <TableCell>{getStatusBadge(transfer.status)}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(transfer.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {transfer.status === 'pending' && (
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleApprove(transfer.id)}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(transfer.id)}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                          {transfer.status === 'approved' && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleComplete(transfer.id)}
                            >
                              <Package className="h-4 w-4 mr-1" />
                              Complete Transfer
                            </Button>
                          )}
                          {transfer.status === 'completed' && (
                            <Badge variant="outline" className="bg-green-50">
                              <Check className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                          {transfer.status === 'rejected' && (
                            <Badge variant="outline" className="bg-red-50">
                              <X className="h-3 w-3 mr-1" />
                              Rejected
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Rejection Dialog */}

        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Transfer Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Rejection Reason *</Label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejection..."
                  rows={4}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  This reason will be visible to the requester
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setRejectDialogOpen(false)
                    setRejectionReason('')
                    setRejectTransferId(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmReject}
                  disabled={!rejectionReason.trim()}
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject Transfer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  )
}