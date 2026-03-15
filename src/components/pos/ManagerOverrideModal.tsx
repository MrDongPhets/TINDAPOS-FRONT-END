// src/components/pos/ManagerOverrideModal.jsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Shield, Loader2, Delete } from 'lucide-react';
import API_CONFIG from '@/config/api';

export default function ManagerOverrideModal({ 
  open, 
  onOpenChange, 
  action, 
  onSuccess 
}) {
  const [managerStaffId, setManagerStaffId] = useState('');
  const [passcode, setPasscode] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const actionLabels = {
    void_transaction: 'Void Transaction',
    apply_discount: 'Apply Discount',
    process_refund: 'Process Refund',
    price_override: 'Price Override'
  };

  const actionDescriptions = {
    void_transaction: 'Supervisor or Manager authorization required',
    apply_discount: 'Supervisor or Manager authorization required',
    process_refund: 'Manager authorization required',
    price_override: 'Manager authorization required'
  };

  const handleNumberClick = (num) => {
    if (passcode.length < 6) {
      setPasscode(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    setPasscode(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPasscode('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!managerStaffId || !passcode) {
      setError('Manager ID and passcode are required');
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/staff/permissions/manager-override`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            manager_staff_id: managerStaffId,
            passcode,
            action,
            reason
          })
        }
      );

      const data = await response.json();

      if (response.ok) {
        if (onSuccess) onSuccess(data);
        handleClose();
      } else {
        setError(data.error || 'Authorization failed');
      }
    } catch (err) {
      setError('Failed to verify authorization');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setManagerStaffId('');
    setPasscode('');
    setReason('');
    setError('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-500" />
            <DialogTitle>Manager Authorization Required</DialogTitle>
          </div>
          <DialogDescription>
            {actionLabels[action]} - {actionDescriptions[action]}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Manager Staff ID */}
          <div className="space-y-2">
            <Label htmlFor="manager_id">Manager Staff ID</Label>
            <Input
              id="manager_id"
              placeholder="Enter manager staff ID"
              value={managerStaffId}
              onChange={(e) => setManagerStaffId(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* PIN Passcode Display */}
          <div className="space-y-2">
            <Label>Manager PIN</Label>
            <div className="relative">
              <Input
                type="password"
                placeholder="Enter PIN"
                value={passcode}
                readOnly
                className="text-center text-2xl tracking-widest"
                maxLength={6}
              />
            </div>
          </div>

          {/* Number Pad */}
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <Button
                key={num}
                type="button"
                variant="outline"
                className="h-14 text-lg font-semibold"
                onClick={() => handleNumberClick(num.toString())}
              >
                {num}
              </Button>
            ))}
            <Button
              type="button"
              variant="outline"
              className="h-14"
              onClick={handleClear}
            >
              Clear
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-14 text-lg font-semibold"
              onClick={() => handleNumberClick('0')}
            >
              0
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-14"
              onClick={handleBackspace}
            >
              <Delete className="h-5 w-5" />
            </Button>
          </div>

          {/* Reason (optional) */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="Enter reason for override..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>

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
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !managerStaffId || !passcode}
              className="flex-1"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Authorize'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}