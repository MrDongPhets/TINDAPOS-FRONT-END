// src/app/pos/settings/change-passcode/page.jsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Loader2, Lock, Delete } from 'lucide-react';
import API_CONFIG from '@/config/api';

export default function ChangePasscodePage() {
  const [currentPasscode, setCurrentPasscode] = useState('');
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [activeField, setActiveField] = useState('current');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleNumberClick = (num) => {
    if (activeField === 'current' && currentPasscode.length < 6) {
      setCurrentPasscode(prev => prev + num);
    } else if (activeField === 'new' && newPasscode.length < 6) {
      setNewPasscode(prev => prev + num);
    } else if (activeField === 'confirm' && confirmPasscode.length < 6) {
      setConfirmPasscode(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    if (activeField === 'current') {
      setCurrentPasscode(prev => prev.slice(0, -1));
    } else if (activeField === 'new') {
      setNewPasscode(prev => prev.slice(0, -1));
    } else if (activeField === 'confirm') {
      setConfirmPasscode(prev => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    if (activeField === 'current') {
      setCurrentPasscode('');
    } else if (activeField === 'new') {
      setNewPasscode('');
    } else if (activeField === 'confirm') {
      setConfirmPasscode('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (newPasscode.length < 4) {
      setError('New passcode must be at least 4 digits');
      return;
    }

    if (newPasscode !== confirmPasscode) {
      setError('New passcode and confirmation do not match');
      return;
    }

    if (currentPasscode === newPasscode) {
      setError('New passcode must be different from current passcode');
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/staff/permissions/change-passcode`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            current_passcode: currentPasscode,
            new_passcode: newPasscode
          })
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess('Passcode changed successfully!');
        setCurrentPasscode('');
        setNewPasscode('');
        setConfirmPasscode('');
        setActiveField('current');
      } else {
        setError(data.error || 'Failed to change passcode');
      }
    } catch (err) {
      setError('Failed to change passcode');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-blue-600" />
              <CardTitle>Change PIN Code</CardTitle>
            </div>
            <CardDescription>
              Update your login passcode for security
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Current Passcode */}
              <div className="space-y-2">
                <Label>Current PIN</Label>
                <Input
                  type="password"
                  placeholder="Enter current PIN"
                  value={currentPasscode}
                  readOnly
                  onClick={() => setActiveField('current')}
                  className={`text-center text-2xl tracking-widest ${
                    activeField === 'current' ? 'ring-2 ring-blue-500' : ''
                  }`}
                  maxLength={6}
                />
              </div>

              {/* New Passcode */}
              <div className="space-y-2">
                <Label>New PIN (4-6 digits)</Label>
                <Input
                  type="password"
                  placeholder="Enter new PIN"
                  value={newPasscode}
                  readOnly
                  onClick={() => setActiveField('new')}
                  className={`text-center text-2xl tracking-widest ${
                    activeField === 'new' ? 'ring-2 ring-blue-500' : ''
                  }`}
                  maxLength={6}
                />
              </div>

              {/* Confirm Passcode */}
              <div className="space-y-2">
                <Label>Confirm New PIN</Label>
                <Input
                  type="password"
                  placeholder="Confirm new PIN"
                  value={confirmPasscode}
                  readOnly
                  onClick={() => setActiveField('confirm')}
                  className={`text-center text-2xl tracking-widest ${
                    activeField === 'confirm' ? 'ring-2 ring-blue-500' : ''
                  }`}
                  maxLength={6}
                />
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

              {/* Active Field Indicator */}
              <div className="text-center text-sm text-gray-600">
                Entering: {activeField === 'current' ? 'Current PIN' : activeField === 'new' ? 'New PIN' : 'Confirm PIN'}
              </div>

              {/* Messages */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={
                  submitting ||
                  !currentPasscode ||
                  !newPasscode ||
                  !confirmPasscode ||
                  newPasscode.length < 4
                }
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Changing...
                  </>
                ) : (
                  'Change Passcode'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security Tips */}
        <Card className="mt-4">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-sm mb-3">Security Tips:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Use a PIN that's easy for you to remember but hard for others to guess</li>
              <li>• Don't use obvious PINs like 1234 or your birthday</li>
              <li>• Change your PIN regularly for better security</li>
              <li>• Never share your PIN with anyone</li>
              <li>• All passcode changes are logged for security</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}