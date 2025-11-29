'use client';

/**
 * Organization List Component
 *
 * Displays a list of organizations the user belongs to.
 * Allows clicking to switch between organizations.
 */

import { useOrgContext } from '@/components/providers/org-provider';
import { OrgCard } from './org-card';
import { EmptyState } from '@/components/shared/empty-state';
import { CardSkeleton } from '@/components/shared/loading-skeleton';
import { Building2 } from 'lucide-react';
import type { Organization } from '@/types/organization';

interface OrgListProps {
  onSelect?: (org: Organization) => void;
  onEdit?: (org: Organization) => void;
  onDelete?: (org: Organization) => void;
}

export function OrgList({ onSelect, onEdit, onDelete }: OrgListProps) {
  const { organizations, currentOrg, isLoading, error, setCurrentOrg } = useOrgContext();

  const handleSelect = (org: Organization) => {
    setCurrentOrg(org);
    onSelect?.(org);
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/10 p-4">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="No organizations"
        description="Get started by creating a new organization to manage your projects and team."
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {organizations.map((org) => (
        <OrgCard
          key={org.id}
          org={org}
          isSelected={currentOrg?.id === org.id}
          onSelect={handleSelect}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

