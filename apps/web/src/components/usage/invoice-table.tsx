'use client';

/**
 * Invoice Table Component
 *
 * Displays a table of invoices with status badges.
 */

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ExternalLink, Download } from 'lucide-react';
import type { Invoice } from '@/types/usage';

interface InvoiceTableProps {
  invoices: Invoice[];
  maxRows?: number;
}

export function InvoiceTable({ invoices, maxRows }: InvoiceTableProps) {
  const displayInvoices = maxRows ? invoices.slice(0, maxRows) : invoices;

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100); // Convert cents to dollars
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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

  if (displayInvoices.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No invoices found.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {displayInvoices.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell className="font-medium">
              <Link 
                href={`/settings/billing/invoices/${invoice.id}`}
                className="hover:underline"
              >
                {invoice.number || invoice.id.slice(0, 8)}
              </Link>
            </TableCell>
            <TableCell>{formatDate(invoice.created)}</TableCell>
            <TableCell>{getStatusBadge(invoice.status)}</TableCell>
            <TableCell className="text-right">
              {formatCurrency(invoice.amountDue, invoice.currency)}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                {invoice.hostedInvoiceUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                  >
                    <a href={invoice.hostedInvoiceUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {invoice.invoicePdf && (
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                  >
                    <a href={invoice.invoicePdf} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

