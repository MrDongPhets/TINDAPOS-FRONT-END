'use client';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, User, Lock, AlertCircle, Building2, ArrowLeft } from 'lucide-react';
import API_CONFIG from '@/config/api';
import { useAuth } from '@/components/auth/AuthProvider';

export default function StaffLoginPage() {
  const navigate = useNavigate();
  const { completeStaffLogin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Company Code — remembered across sessions
  const savedCode = localStorage.getItem('staffCompanyCode') || '';
  const [companyCode, setCompanyCode] = useState(savedCode);
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [step, setStep] = useState<'company' | 'login'>('company');

  // Auto-skip to login step if we already have a saved company code
  useEffect(() => {
    if (savedCode) {
      fetch(`${API_CONFIG.BASE_URL}/setup/stores?company_code=${encodeURIComponent(savedCode)}`)
        .then(r => r.json())
        .then(data => {
          if (data.stores?.length > 0) {
            setStores(data.stores);
            setStep('login');
          }
        })
        .catch(() => {});
    }
  }, []);

  // Step 2: Staff credentials
  const [credentials, setCredentials] = useState({
    staff_id: '',
    passcode: '',
    store_id: ''
  });

  const handleFindCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/setup/stores?company_code=${encodeURIComponent(companyCode.trim().toUpperCase())}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Company not found. Check your company code.');
        return;
      }

      setStores(data.stores || []);
      localStorage.setItem('staffCompanyCode', companyCode.trim().toUpperCase());
      setStep('login');
    } catch {
      setError('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/staff/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      completeStaffLogin(data);
      navigate('/pos');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePinClick = (num: number | string) => {
    if (credentials.passcode.length < 6) {
      setCredentials(prev => ({ ...prev, passcode: prev.passcode + num }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-[#E8302A] rounded-full flex items-center justify-center mx-auto mb-4">
            {step === 'company' ? <Building2 className="h-8 w-8 text-white" /> : <User className="h-8 w-8 text-white" />}
          </div>
          <CardTitle className="text-2xl">Staff Login</CardTitle>
          <CardDescription>
            {step === 'company' ? 'Enter your company code to continue' : 'Enter your credentials to access POS'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === 'company' ? (
            <form onSubmit={handleFindCompany} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company_code">Company Code</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="company_code"
                    type="text"
                    placeholder="e.g. KP8X2M"
                    className="pl-10 uppercase tracking-widest font-mono text-lg"
                    value={companyCode}
                    onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                    maxLength={8}
                    required
                  />
                </div>
                <p className="text-xs text-gray-500">Ask your manager for the company code.</p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading || !companyCode.trim()}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Finding...</> : 'Continue'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <button
                type="button"
                onClick={() => { setStep('company'); setError(''); setCredentials({ staff_id: '', passcode: '', store_id: '' }); localStorage.removeItem('staffCompanyCode'); }}
                className="flex items-center gap-1 text-sm text-blue-600 hover:underline mb-2"
              >
                <ArrowLeft className="h-3 w-3" /> Change company code
              </button>

              {/* Staff ID */}
              <div className="space-y-2">
                <Label htmlFor="staff_id">Staff ID</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="staff_id"
                    type="text"
                    placeholder="Enter your staff ID"
                    className="pl-10"
                    value={credentials.staff_id}
                    onChange={(e) => setCredentials(prev => ({ ...prev, staff_id: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Store Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="store_id">Store</Label>
                <Select
                  value={credentials.store_id}
                  onValueChange={(val) => setCredentials(prev => ({ ...prev, store_id: val }))}
                  required
                >
                  <SelectTrigger id="store_id">
                    <SelectValue placeholder="Select your store" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map(store => (
                      <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* PIN Passcode */}
              <div className="space-y-2">
                <Label htmlFor="passcode">PIN Code</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="passcode"
                    type="password"
                    placeholder="Enter 4-6 digit PIN"
                    className="pl-10 text-center text-2xl tracking-widest"
                    value={credentials.passcode}
                    readOnly
                    maxLength={6}
                  />
                </div>
              </div>

              {/* Number Pad */}
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <Button key={num} type="button" variant="outline" className="h-14 text-xl font-semibold" onClick={() => handlePinClick(num)}>
                    {num}
                  </Button>
                ))}
                <Button type="button" variant="outline" className="h-14" onClick={() => setCredentials(prev => ({ ...prev, passcode: '' }))}>
                  Clear
                </Button>
                <Button type="button" variant="outline" className="h-14 text-xl font-semibold" onClick={() => handlePinClick(0)}>
                  0
                </Button>
                <Button type="button" variant="outline" className="h-14" onClick={() => setCredentials(prev => ({ ...prev, passcode: prev.passcode.slice(0, -1) }))}>
                  ←
                </Button>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging in...</> : 'Login to POS'}
              </Button>
            </form>
          )}

          <div className="mt-4 text-center text-sm text-gray-600">
            <button onClick={() => navigate('/login')} className="text-blue-600 hover:underline">
              Manager Login
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
