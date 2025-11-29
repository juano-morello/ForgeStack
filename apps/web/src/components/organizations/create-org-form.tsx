'use client';

/**
 * Create Organization Form Component
 *
 * Form for creating a new organization.
 * Validates input and handles submission.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOrgContext } from '@/components/providers/org-provider';
import { ApiError } from '@/lib/api';

interface CreateOrgFormProps {
  onSuccess?: () => void;
}

export function CreateOrgForm({ onSuccess }: CreateOrgFormProps) {
  const router = useRouter();
  const { createOrganization } = useOrgContext();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Organization name is required');
      return;
    }
    if (trimmedName.length > 100) {
      setError('Organization name must be 100 characters or less');
      return;
    }

    setIsLoading(true);

    try {
      await createOrganization({ name: trimmedName });
      setName('');
      onSuccess?.();
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to create organization';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="org-name" className="block text-sm font-medium text-gray-700">
          Organization Name
        </label>
        <input
          id="org-name"
          name="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
          placeholder="My Organization"
          disabled={isLoading}
          maxLength={100}
        />
        <p className="mt-1 text-xs text-gray-500">
          This will be the name of your organization. You can change it later.
        </p>
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating...' : 'Create Organization'}
        </button>
      </div>
    </form>
  );
}

