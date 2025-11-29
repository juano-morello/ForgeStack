import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      <main className="text-center px-4">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Welcome to <span className="text-indigo-600">ForgeStack</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl">
          A modern multi-tenant SaaS starter kit built with Next.js, NestJS, and PostgreSQL.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-500 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-6 py-3 bg-white text-indigo-600 border border-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </main>
    </div>
  );
}

