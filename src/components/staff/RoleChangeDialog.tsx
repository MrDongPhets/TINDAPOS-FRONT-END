// src/components/staff/RoleChangeDialog.jsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Shield, Loader2 } from 'lucide-react';
import API_CONFIG from '@/config/api';

export default function RoleChangeDialog({ staff, onSuccess }) {
  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(staff.role);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/staff/permissions/role/${staff.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ role: selectedRole })
        }
      );

      if (response.ok) {
        setOpen(false);
        if (onSuccess) onSuccess();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update role');
      }
    } catch (err) {
      setError('Failed to update role');
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'manager':
        return 'bg-purple-100 text-purple-700';
      case 'supervisor':
        return 'bg-blue-100 text-blue-700';
      case 'staff':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const roleDescriptions = {
    staff: 'Basic POS operations only. Cannot void, discount, or view reports.',
    supervisor: 'Can void transactions, apply discounts, and view reports. Cannot process refunds or manage staff.',
    manager: 'Full access to all operations including refunds, inventory, and staff management.'
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" title="Change Role">
          <Shield className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Staff Role</DialogTitle>
          <DialogDescription>
            Update {staff.name}'s access level
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Role */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Current Role:</span>
              <span className={`px-3 py-1 text-sm rounded-full ${getRoleBadgeColor(staff.role)}`}>
                {staff.role.charAt(0).toUpperCase() + staff.role.slice(1)}
              </span>
            </div>
            <p className="text-xs text-gray-600">
              {roleDescriptions[staff.role]}
            </p>
          </div>

          {/* New Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role">New Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Staff</span>
                    <span className="text-xs text-gray-500">Basic operations</span>
                  </div>
                </SelectItem>
                <SelectItem value="supervisor">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Supervisor</span>
                    <span className="text-xs text-gray-500">Limited management</span>
                  </div>
                </SelectItem>
                <SelectItem value="manager">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Manager</span>
                    <span className="text-xs text-gray-500">Full access</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-600">
              {roleDescriptions[selectedRole]}
            </p>
          </div>

          {/* Warning for downgrade */}
          {staff.role === 'manager' && selectedRole !== 'manager' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Downgrading from Manager will remove full access privileges. This action will be logged.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || selectedRole === staff.role}
              className="flex-1"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Role'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}