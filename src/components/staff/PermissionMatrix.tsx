// src/components/staff/PermissionMatrix.jsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function PermissionMatrix({ permissions, currentRole = null }) {
  if (!permissions) return null;

  const permissionGroups = {
    'POS Operations': [
      'process_sale',
      'open_cash_drawer',
      'print_receipt',
      'scan_barcode'
    ],
    'Restricted Operations': [
      'void_transaction',
      'apply_discount',
      'process_refund',
      'price_override'
    ],
    'Reports & Analytics': [
      'view_reports',
      'end_of_day'
    ],
    'Management': [
      'manage_inventory',
      'manage_staff'
    ]
  };

  const permissionLabels = {
    process_sale: 'Process Sales',
    open_cash_drawer: 'Open Cash Drawer',
    print_receipt: 'Print Receipt',
    scan_barcode: 'Scan Barcode',
    void_transaction: 'Void Transaction',
    apply_discount: 'Apply Discount',
    process_refund: 'Process Refund',
    price_override: 'Price Override',
    view_reports: 'View Reports',
    end_of_day: 'End of Day',
    manage_inventory: 'Manage Inventory',
    manage_staff: 'Manage Staff'
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'manager':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'supervisor':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'staff':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Info className="h-4 w-4 mr-2" />
          View Permissions
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Role Permissions Matrix</DialogTitle>
          <DialogDescription>
            Compare what each role can and cannot do in the system
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Role Headers */}
          <div className="grid grid-cols-4 gap-4">
            <div></div>
            {Object.entries(permissions as Record<string, any>).map(([role, data]) => (
              <div key={role} className="text-center">
                <Badge 
                  variant="outline" 
                  className={`${getRoleBadgeColor(role)} font-semibold`}
                >
                  {data.label}
                </Badge>
                <p className="text-xs text-gray-500 mt-1">Level {data.level}</p>
              </div>
            ))}
          </div>

          {/* Permission Groups */}
          {Object.entries(permissionGroups).map(([groupName, permKeys]) => (
            <div key={groupName}>
              <h3 className="font-semibold text-sm text-gray-700 mb-3 pb-2 border-b">
                {groupName}
              </h3>
              <div className="space-y-2">
                {permKeys.map(permKey => (
                  <div key={permKey} className="grid grid-cols-4 gap-4 items-center">
                    <div className="text-sm text-gray-700">
                      {permissionLabels[permKey]}
                    </div>
                    {Object.entries(permissions as Record<string, any>).map(([role, data]) => (
                      <div key={role} className="flex justify-center">
                        {data.permissions[permKey] ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-400" />
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Legend */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Legend:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Allowed</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-400" />
                <span>Requires Override</span>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              When staff attempt restricted actions, they will need manager/supervisor authorization
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}