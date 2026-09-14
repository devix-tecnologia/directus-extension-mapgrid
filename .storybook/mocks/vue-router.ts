const noop = (): void => undefined;

export function useRouter() {
  return {
    push: noop,
    replace: noop,
    back: noop,
    currentRoute: { value: { path: '/' } },
  };
}

export function useRoute() {
  return { path: '/', params: {}, query: {} };
}
