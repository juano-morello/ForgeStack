'use client';

/**
 * Feature Flag Form Component
 *
 * Form for creating and editing feature flags.
 */

import { useState, FormEvent, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { getFlagKeyValidationError, PLANS, formatPlanName } from '@/lib/feature-flag-constants';
import type { FeatureFlag, FlagType, CreateFeatureFlagDto, UpdateFeatureFlagDto } from '@/types/feature-flags';

interface FeatureFlagFormProps {
  flag?: FeatureFlag | null;
  onSubmit: (data: CreateFeatureFlagDto | UpdateFeatureFlagDto) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function FeatureFlagForm({ flag, onSubmit, onCancel, isSubmitting }: FeatureFlagFormProps) {
  const isEditing = !!flag;

  const [key, setKey] = useState(flag?.key || '');
  const [name, setName] = useState(flag?.name || '');
  const [description, setDescription] = useState(flag?.description || '');
  const [type, setType] = useState<FlagType>(flag?.type || 'boolean');
  const [defaultValue, setDefaultValue] = useState(flag?.defaultValue ?? false);
  const [plans, setPlans] = useState<string[]>(flag?.plans || []);
  const [percentage, setPercentage] = useState(flag?.percentage?.toString() || '0');
  const [enabled, setEnabled] = useState(flag?.enabled ?? true);
  const [error, setError] = useState<string | null>(null);

  // Reset form when flag changes
  useEffect(() => {
    if (flag) {
      setKey(flag.key);
      setName(flag.name);
      setDescription(flag.description || '');
      setType(flag.type);
      setDefaultValue(flag.defaultValue);
      setPlans(flag.plans || []);
      setPercentage(flag.percentage?.toString() || '0');
      setEnabled(flag.enabled);
    }
  }, [flag]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate name
    if (!name.trim()) {
      setError('Flag name is required');
      return;
    }

    // Validate key (only for create)
    if (!isEditing) {
      const keyError = getFlagKeyValidationError(key);
      if (keyError) {
        setError(keyError);
        return;
      }
    }

    // Validate type-specific fields
    if (type === 'plan' && plans.length === 0) {
      setError('At least one plan must be selected for plan-based flags');
      return;
    }

    if (type === 'percentage') {
      const percentageNum = parseInt(percentage, 10);
      if (isNaN(percentageNum) || percentageNum < 0 || percentageNum > 100) {
        setError('Percentage must be between 0 and 100');
        return;
      }
    }

    try {
      const data: CreateFeatureFlagDto | UpdateFeatureFlagDto = {
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        enabled,
        ...(type === 'boolean' && { defaultValue }),
        ...(type === 'plan' && { plans }),
        ...(type === 'percentage' && { percentage: parseInt(percentage, 10) }),
        ...(!isEditing && { key: key.trim() }),
      };

      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handlePlanToggle = (plan: string, checked: boolean) => {
    if (checked) {
      setPlans((prev) => [...prev, plan]);
    } else {
      setPlans((prev) => prev.filter((p) => p !== plan));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Key (create only) */}
      {!isEditing && (
        <div className="space-y-2">
          <Label htmlFor="key">
            Key <span className="text-destructive">*</span>
          </Label>
          <Input
            id="key"
            value={key}
            onChange={(e) => setKey(e.target.value.toLowerCase())}
            placeholder="advanced-analytics"
            disabled={isSubmitting}
            required
          />
          <p className="text-xs text-muted-foreground">
            Lowercase letters, numbers, hyphens, and underscores only
          </p>
        </div>
      )}

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Advanced Analytics"
          disabled={isSubmitting}
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What does this feature do?"
          rows={3}
          disabled={isSubmitting}
        />
      </div>

      {/* Type */}
      <div className="space-y-2">
        <Label htmlFor="type">
          Type <span className="text-destructive">*</span>
        </Label>
        <Select value={type} onValueChange={(value) => setType(value as FlagType)} disabled={isSubmitting}>
          <SelectTrigger id="type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="boolean">Boolean - Simple on/off toggle</SelectItem>
            <SelectItem value="plan">Plan-Based - Enabled by subscription plan</SelectItem>
            <SelectItem value="percentage">Percentage Rollout - Enabled for X% of orgs</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Type-specific fields */}
      {type === 'boolean' && (
        <div className="flex items-center space-x-2">
          <Switch id="defaultValue" checked={defaultValue} onCheckedChange={setDefaultValue} disabled={isSubmitting} />
          <Label htmlFor="defaultValue">Default Value (enabled by default)</Label>
        </div>
      )}

      {type === 'plan' && (
        <div className="space-y-2">
          <Label>Plans with Access</Label>
          <div className="space-y-2">
            {PLANS.map((plan) => (
              <div key={plan} className="flex items-center space-x-2">
                <Checkbox
                  id={`plan-${plan}`}
                  checked={plans.includes(plan)}
                  onCheckedChange={(checked) => handlePlanToggle(plan, checked as boolean)}
                  disabled={isSubmitting}
                />
                <Label htmlFor={`plan-${plan}`} className="font-normal">
                  {formatPlanName(plan)}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {type === 'percentage' && (
        <div className="space-y-2">
          <Label htmlFor="percentage">Percentage (0-100)</Label>
          <Input
            id="percentage"
            type="number"
            min="0"
            max="100"
            value={percentage}
            onChange={(e) => setPercentage(e.target.value)}
            disabled={isSubmitting}
          />
          <p className="text-xs text-muted-foreground">
            {percentage}% of organizations will have this feature enabled
          </p>
        </div>
      )}

      {/* Enabled */}
      <div className="flex items-center space-x-2">
        <Switch id="enabled" checked={enabled} onCheckedChange={setEnabled} disabled={isSubmitting} />
        <Label htmlFor="enabled">Enabled (master switch)</Label>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Save Changes' : 'Create Flag'}
        </Button>
      </div>
    </form>
  );
}

