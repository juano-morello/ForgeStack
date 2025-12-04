// Mock Next.js navigation hooks for Storybook

export function usePathname() {
  return '/docs';
}

export function useRouter() {
  return {
    push: (url: string) => console.log('router.push:', url),
    replace: (url: string) => console.log('router.replace:', url),
    back: () => console.log('router.back'),
    forward: () => console.log('router.forward'),
    refresh: () => console.log('router.refresh'),
    prefetch: (url: string) => console.log('router.prefetch:', url),
  };
}

export function useSearchParams() {
  return new URLSearchParams();
}

export function useParams() {
  return {};
}

export function notFound() {
  console.log('notFound called');
}

export function redirect(url: string) {
  console.log('redirect:', url);
}

