'use client';

/**
 * Header Component
 *
 * Fixed header at top of viewport with navigation and user controls.
 * Includes logo, navigation links, theme toggle, org selector, and user menu.
 */

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User, Settings, LogOut, CreditCard, Key, Webhook } from 'lucide-react';
import { signOut, useSession } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { MobileNav } from '@/components/layout/mobile-nav';
import { OrgSelector } from '@/components/organizations/org-selector';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/projects', label: 'Projects' },
  { href: '/organizations', label: 'Organizations' },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
    router.refresh();
  };

  const userInitials =
    session?.user?.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="flex h-16 items-center px-4 sm:px-6 lg:px-8">
        {/* Mobile menu button */}
        <MobileNav />

        {/* Logo */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-bold text-xl text-primary ml-2 md:ml-0"
        >
          ForgeStack
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 ml-8">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== '/dashboard' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side controls */}
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:block">
            <OrgSelector />
          </div>
          <ThemeToggle />

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={session?.user?.image || undefined}
                    alt={session?.user?.name || 'User'}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {session?.user?.name || 'User'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session?.user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings/organization">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Organization</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings/billing">
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Billing</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings/api-keys">
                  <Key className="mr-2 h-4 w-4" />
                  <span>API Keys</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings/webhooks">
                  <Webhook className="mr-2 h-4 w-4" />
                  <span>Webhooks</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

