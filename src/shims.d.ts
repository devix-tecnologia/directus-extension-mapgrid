declare module '*.vue' {
  import { DefineComponent } from 'vue';

  const component: DefineComponent<{}, {}, unknown>;
  export default component;
}

declare module 'maplibre-gl/dist/maplibre-gl.css' {
  const value: string;
  export default value;
}
