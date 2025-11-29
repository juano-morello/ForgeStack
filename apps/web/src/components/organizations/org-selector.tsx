'use client';

/**
 * Organization Selector Component
 *
 * Dropdown component for switching between organizations.
 * Shows current organization and allows quick switching.
 */

import Link from 'next/link';
import { useOrgContext } from '@/components/providers/org-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, ChevronDown, Check, Plus, Settings } from 'lucide-react';

export function OrgSelector() {
  const { organizations, currentOrg, isLoading, setCurrentOrg } = useOrgContext();

  if (isLoading) {
    return <Skeleton className="h-9 w-[180px]" />;
  }

  if (organizations.length === 0) {
    return (
      <Button variant="outline" size="sm" asChild>
        <Link href="/organizations/new">
          <Plus className="h-4 w-4" />
          Create Organization
        </Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Building2 className="h-4 w-4" />
          <span className="max-w-[150px] truncate">
            {currentOrg?.name || 'Select Organization'}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[240px]">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => setCurrentOrg(org)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span className="truncate">{org.name}</span>
            {currentOrg?.id === org.id && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/organizations" className="cursor-pointer">
            <Settings className="h-4 w-4" />
            Manage Organizations
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/organizations/new" className="cursor-pointer">
            <Plus className="h-4 w-4" />
            New Organization
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

