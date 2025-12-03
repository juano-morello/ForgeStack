'use client';

/**
 * Admin Organizations List Page
 *
 * List all organizations with search and filter capabilities.
 */

import { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { OrgTable } from '@/components/admin/org-table';
import { useAdminOrganizations } from '@/hooks/use-admin';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminOrganizationsPage() {
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [suspended, setSuspended] = useState<string>('all');

  const { organizations, pagination, isLoading, error, fetchOrganizations } =
    useAdminOrganizations({
      autoFetch: true,
      search,
      suspended: suspended === 'all' ? undefined : suspended === 'true',
    });

  const handleSearch = () => {
    setSearch(searchInput);
    fetchOrganizations({
      search: searchInput,
      suspended: suspended === 'all' ? undefined : suspended === 'true',
      page: 1,
    });
  };

  const handleFilterChange = (value: string) => {
    setSuspended(value);
    fetchOrganizations({
      search,
      suspended: value === 'all' ? undefined : value === 'true',
      page: 1,
    });
  };

  const handlePageChange = (page: number) => {
    fetchOrganizations({
      search,
      suspended: suspended === 'all' ? undefined : suspended === 'true',
      page,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization Management"
        description="Manage all organizations across the platform"
      />

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Search by name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>

        <Select value={suspended} onValueChange={handleFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Organizations</SelectItem>
            <SelectItem value="false">Active Only</SelectItem>
            <SelectItem value="true">Suspended Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Organizations Table */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <OrgTable
          organizations={organizations}
          pagination={pagination}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}

