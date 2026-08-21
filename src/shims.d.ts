declare module '*.vue' {
  import type { DefineComponent } from 'vue';

  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>;
  export default component;
}

declare module 'maplibre-gl/dist/maplibre-gl.css' {
  const value: string;
  export default value;
}
