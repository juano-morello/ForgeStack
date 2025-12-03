'use client';

/**
 * Error Boundary
 *
 * This component handles errors that occur in the app.
 * It must be a client component.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="mb-4 text-4xl font-bold">Error</h1>
      <h2 className="mb-4 text-xl text-muted-foreground">
        Something went wrong!
      </h2>
      <p className="mb-8 text-center text-muted-foreground">
        {error.message || 'An unexpected error occurred'}
      </p>
      <button
        onClick={() => reset()}
        className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
      >
        Try again
      </button>
    </div>
  );
}

