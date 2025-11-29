'use client';

/**
 * Project Form Component
 *
 * Reusable form for creating and editing projects.
 * Uses shadcn/ui components for consistent styling.
 */

import { useState, FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import type { Project } from '@/types/project';

// The form always requires name when submitting
interface ProjectFormData {
  name: string;
  description?: string;
}

interface ProjectFormProps {
  project?: Project | null;
  onSubmit: (data: ProjectFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ProjectForm({
  project,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ProjectFormProps) {
  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!project;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate name
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    if (name.length > 255) {
      setError('Project name must be 255 characters or less');
      return;
    }

    if (description.length > 2000) {
      setError('Description must be 2000 characters or less');
      return;
    }

    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">
          Project Name <span className="text-destructive">*</span>
        </Label>
        <Input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter project name"
          maxLength={255}
          disabled={isSubmitting}
        />
        <p className="text-xs text-muted-foreground">{name.length}/255 characters</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter project description (optional)"
          rows={4}
          maxLength={2000}
          disabled={isSubmitting}
        />
        <p className="text-xs text-muted-foreground">
          {description.length}/2000 characters
        </p>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEditing ? 'Save Changes' : 'Create Project'}
        </Button>
      </div>
    </form>
  );
}

