import type { ReactElement } from 'react';

jest.mock('next/font/google', () => ({
  Geist: () => ({ variable: 'sans' }),
  Geist_Mono: () => ({ variable: 'mono' }),
}));
jest.mock('@/contexts/AuthContext', () => ({ AuthProvider: () => null }));
jest.mock('@/components/AuthGuard', () => () => null);

const originalBasePath = process.env.BASE_PATH;
afterEach(() => {
  if (originalBasePath === undefined) delete process.env.BASE_PATH;
  else process.env.BASE_PATH = originalBasePath;
});

it.each([
  ['', '/'],
  ['/', '/'],
  ['/fide-calculator/', '/fide-calculator/'],
])('keeps PWA URLs on the site for BASE_PATH=%s', (basePath, root) => {
  process.env.BASE_PATH = basePath;
  jest.resetModules();
  const manifest = jest.requireActual<typeof import('../manifest')>('../manifest').default();
  expect(manifest.start_url).toBe(root);
  for (const icon of manifest.icons ?? []) {
    expect(icon.src.startsWith(root)).toBe(true);
    expect(new URL(icon.src, 'https://fide-calc.truongthings.site').origin).toBe('https://fide-calc.truongthings.site');
  }
  const layout = jest.requireActual<typeof import('../layout')>('../layout').default({ children: null });
  const head = (layout.props.children as ReactElement<{ children: ReactElement<{ href: string }>[] }>[]) [0];
  expect(head.props.children[0].props.href).toBe(`${root}manifest.webmanifest`);
});
