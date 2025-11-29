/**
 * Auth Layout
 *
 * Centered layout with gradient background for authentication pages.
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">ForgeStack</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Multi-tenant SaaS Starter Kit
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}

