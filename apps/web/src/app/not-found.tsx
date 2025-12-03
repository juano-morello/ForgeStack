import Link from 'next/link';

/**
 * Not Found Page
 *
 * This page is displayed when a route is not found.
 * It's a server component that doesn't use any hooks.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="mb-4 text-4xl font-bold">404</h1>
      <h2 className="mb-4 text-xl text-muted-foreground">Page Not Found</h2>
      <p className="mb-8 text-center text-muted-foreground">
        The page you are looking for does not exist.
      </p>
      <Link
        href="/"
        className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
      >
        Go Home
      </Link>
    </div>
  );
}

