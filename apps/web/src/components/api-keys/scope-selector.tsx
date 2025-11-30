'use client';

/**
 * Scope Selector Component
 *
 * Multi-select component for choosing API key scopes.
 * Grouped by resource with select all/deselect all functionality.
 */

import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { SCOPE_GROUPS, SCOPE_LABELS, SCOPE_DESCRIPTIONS } from '@/lib/api-key-constants';
import type { ApiKeyScope } from '@/types/api-keys';

interface ScopeSelectorProps {
  selectedScopes: ApiKeyScope[];
  onChange: (scopes: ApiKeyScope[]) => void;
  disabled?: boolean;
}

export function ScopeSelector({ selectedScopes, onChange, disabled = false }: ScopeSelectorProps) {
  const [hasFullAccess, setHasFullAccess] = useState(selectedScopes.includes('*'));

  useEffect(() => {
    setHasFullAccess(selectedScopes.includes('*'));
  }, [selectedScopes]);

  const handleScopeToggle = (scope: ApiKeyScope) => {
    if (scope === '*') {
      // Toggle full access
      if (hasFullAccess) {
        onChange([]);
        setHasFullAccess(false);
      } else {
        onChange(['*']);
        setHasFullAccess(true);
      }
    } else {
      // Toggle individual scope
      if (selectedScopes.includes(scope)) {
        onChange(selectedScopes.filter((s) => s !== scope && s !== '*'));
      } else {
        onChange([...selectedScopes.filter((s) => s !== '*'), scope]);
      }
      setHasFullAccess(false);
    }
  };

  const handleSelectAll = () => {
    const allScopes = Object.values(SCOPE_GROUPS)
      .flat()
      .filter((s) => s !== '*');
    onChange(allScopes);
    setHasFullAccess(false);
  };

  const handleDeselectAll = () => {
    onChange([]);
    setHasFullAccess(false);
  };

  return (
    <div className="space-y-4">
      {/* Select All / Deselect All */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSelectAll}
          disabled={disabled || hasFullAccess}
        >
          Select All
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleDeselectAll}
          disabled={disabled}
        >
          Deselect All
        </Button>
      </div>

      {/* Scope Groups */}
      <div className="space-y-6">
        {Object.entries(SCOPE_GROUPS).map(([groupName, scopes]) => (
          <div key={groupName} className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">{groupName}</h4>
            <div className="space-y-2 pl-2">
              {scopes.map((scope) => {
                const isChecked = hasFullAccess || selectedScopes.includes(scope);
                const isDisabled = disabled || (hasFullAccess && scope !== '*');

                return (
                  <div key={scope} className="flex items-start space-x-3">
                    <Checkbox
                      id={`scope-${scope}`}
                      checked={isChecked}
                      onCheckedChange={() => handleScopeToggle(scope)}
                      disabled={isDisabled}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor={`scope-${scope}`}
                        className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                          isDisabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
                        }`}
                      >
                        {SCOPE_LABELS[scope]}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {SCOPE_DESCRIPTIONS[scope]}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

