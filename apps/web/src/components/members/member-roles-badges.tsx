'use client';

/**
 * Member Roles Badges Component
 *
 * Displays a member's roles as badges with an edit button.
 */

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MemberRolesDialog } from './member-roles-dialog';
import { Shield, Edit } from 'lucide-react';
import { usePermission } from '@/hooks/use-permission';

interface MemberRolesBadgesProps {
  userId: string;
  userName: string;
  roles?: Array<{
    id: string;
    name: string;
    isSystem: boolean;
  }>;
  isCurrentUser?: boolean;
}

export function MemberRolesBadges({
  userId,
  userName,
  roles = [],
  isCurrentUser = false,
}: MemberRolesBadgesProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const canUpdateMembers = usePermission('members:update');

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-wrap gap-1">
        {roles.length > 0 ? (
          roles.map((role) => (
            <Badge
              key={role.id}
              variant={role.isSystem ? 'default' : 'secondary'}
              className="text-xs"
            >
              <Shield className="h-3 w-3 mr-1" />
              {role.name}
            </Badge>
          ))
        ) : (
          <span className="text-sm text-muted-foreground">No roles</span>
        )}
      </div>
      {canUpdateMembers && !isCurrentUser && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDialogOpen(true)}
            className="h-7 px-2"
          >
            <Edit className="h-3 w-3" />
          </Button>
          <MemberRolesDialog
            userId={userId}
            userName={userName}
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
          />
        </>
      )}
    </div>
  );
}

