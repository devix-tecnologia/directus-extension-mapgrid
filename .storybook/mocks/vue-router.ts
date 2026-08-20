const mockFn = () => (() => undefined) as any;

export function useRouter() {
  return {
    push: mockFn(),
    replace: mockFn(),
    back: mockFn(),
    currentRoute: { value: { path: '/' } },
  };
}

export function useRoute() {
  return { path: '/', params: {}, query: {} };
}
