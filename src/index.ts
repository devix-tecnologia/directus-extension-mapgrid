import { ref } from "vue";
import { defineLayout } from "@directus/extensions-sdk";
import LayoutComponent from "./layout.vue";

export default defineLayout({
  id: "mapgrid",
  name: "MapGrid",
  icon: "map",
  component: LayoutComponent,
  slots: {
    options: () => null,
    sidebar: () => null,
    actions: () => null,
  },
  setup() {
    const name = ref("Layout customizado");

    return { name };
  },
});
