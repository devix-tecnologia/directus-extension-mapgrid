# Pages

The **pages** level of Atomic Design — page/container components carrying business logic (stores, router, data).

In this project (a layout extension for Directus) pages are not needed yet: the templates (`mapgrid-layout`) already compose the organisms and receive their data through props. When a container with logic is needed (a full-screen map, say), its components belong here, following the storytype pattern:

```
page-name/
  PageName.vue
  PageName.types.ts
  PageName.mock.ts
  PageName.stories.ts
  PageName.test.ts
  index.ts
```
