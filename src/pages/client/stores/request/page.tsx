// src/app/client/stores/request/page.js
'use client'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import API_CONFIG from '@/config/api';


export default function RequestStore() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    description: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/client/stores/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Store request submitted successfully! Waiting for admin approval.')
        navigate('/client/stores')
      } else {
        toast.error(data.error || 'Failed to submit store request')
      }
    } catch (error) {
      console.error('Store request error:', error)
      toast.error('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="container mx-auto py-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Request New Store</CardTitle>
          <p className="text-sm text-muted-foreground">
            Submit a request for a new store. A super admin will review and activate your store.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Store Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter store name"
                required
              />
            </div>

            <div>
              <Label htmlFor="address">Address *</Label>
              <Textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter store address"
                required
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter phone number"
                type="tel"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Additional details about the store"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Request'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}