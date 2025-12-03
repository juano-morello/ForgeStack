'use client';

/**
 * Invoice Detail Component
 *
 * Displays detailed invoice information with line items.
 */

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download, ExternalLink } from 'lucide-react';
import type { InvoiceDetail as InvoiceDetailType } from '@/types/usage';

interface InvoiceDetailProps {
  invoice: InvoiceDetailType;
}

export function InvoiceDetail({ invoice }: InvoiceDetailProps) {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      paid: { variant: 'default', label: 'Paid' },
      open: { variant: 'secondary', label: 'Open' },
      void: { variant: 'outline', label: 'Void' },
      uncollectible: { variant: 'destructive', label: 'Uncollectible' },
      draft: { variant: 'outline', label: 'Draft' },
    };

    const config = statusMap[status] || { variant: 'outline' as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Invoice {invoice.number || invoice.id.slice(0, 8)}</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              {getStatusBadge(invoice.status)}
              <span className="text-sm text-muted-foreground">
                {formatDate(invoice.created)}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {invoice.hostedInvoiceUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={invoice.hostedInvoiceUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Online
                </a>
              </Button>
            )}
            {invoice.invoicePdf && (
              <Button variant="outline" size="sm" asChild>
                <a href={invoice.invoicePdf} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Invoice Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Invoice Date</p>
              <p className="font-medium">{formatDate(invoice.created)}</p>
            </div>
            {invoice.dueDate && (
              <div>
                <p className="text-muted-foreground">Due Date</p>
                <p className="font-medium">{formatDate(invoice.dueDate)}</p>
              </div>
            )}
            {invoice.paidAt && (
              <div>
                <p className="text-muted-foreground">Paid Date</p>
                <p className="font-medium">{formatDate(invoice.paidAt)}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Line Items */}
          <div>
            <h3 className="font-semibold mb-4">Line Items</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>{line.description || 'N/A'}</TableCell>
                    <TableCell className="text-right">{line.quantity || '-'}</TableCell>
                    <TableCell className="text-right">
                      {line.unitAmount ? formatCurrency(line.unitAmount, invoice.currency) : '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(line.amount, invoice.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Separator />

          {/* Total */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount Due</span>
                <span className="font-medium">{formatCurrency(invoice.amountDue, invoice.currency)}</span>
              </div>
              {invoice.amountPaid > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount Paid</span>
                  <span className="font-medium">{formatCurrency(invoice.amountPaid, invoice.currency)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg">{formatCurrency(invoice.amountDue, invoice.currency)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

