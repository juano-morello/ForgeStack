'use client';

/**
 * Projected Invoice Card Component
 *
 * Displays the projected invoice for the current billing period.
 */

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calendar } from 'lucide-react';
import type { ProjectedInvoice } from '@/types/usage';

interface ProjectedInvoiceCardProps {
  invoice: ProjectedInvoice;
}

export function ProjectedInvoiceCard({ invoice }: ProjectedInvoiceCardProps) {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Projected Invoice</CardTitle>
            <CardDescription>
              Estimated charges for the current billing period
            </CardDescription>
          </div>
          <Calendar className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Period Info */}
          {invoice.periodStart && invoice.periodEnd && (
            <div className="text-sm text-muted-foreground">
              Period: {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
            </div>
          )}

          {/* Line Items */}
          {invoice.lines.length > 0 && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.lines.map((line, index) => (
                    <TableRow key={index}>
                      <TableCell>{line.description || 'N/A'}</TableCell>
                      <TableCell className="text-right">{line.quantity || '-'}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(line.amount, invoice.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Separator />
            </>
          )}

          {/* Total */}
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Estimated Total</span>
            <span className="text-2xl font-bold">
              {formatCurrency(invoice.amountDue, invoice.currency)}
            </span>
          </div>

          <p className="text-xs text-muted-foreground">
            * This is an estimate based on current usage. Final charges may vary.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

