import { DocsSidebar } from '@/components/docs/docs-sidebar';

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <DocsSidebar />
      <main className="flex-1 px-8 py-12 max-w-4xl">{children}</main>
    </div>
  );
}

