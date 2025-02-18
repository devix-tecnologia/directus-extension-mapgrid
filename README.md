# Directus - MapGrid Layout Extension

This project is a Layout-type extension for Directus, designed for viewing content in both map and grid formats simultaneously. Developed by [Devix Tecnologia](https://devix.co).

## 💎 Using the Extension

- Ensure that your collection has a field of type "Map" and select the field in the Layout Options: Geolocation.
- Enable the Layout in the settings menu on the right by selecting "MapGrid" from the dropdown.

![Extension visualization screen](https://github.com/devix-tecnologia/directus-extension-mapgrid/raw/main/docs/tela.jpg)

## 🚀 Running Directus with Docker Compose

- Download this project or copy the `docker-compose.yml` file and start a fresh installation.
- With Docker installed on your machine ([learn more](https://docs.docker.com/get-docker/)), run the command:

```
 docker compose up
```

> [!IMPORTANT]
> _The docker-compose used in this project is configured to allow iframes from any domain. In production, you should only allow trusted domains._
>
> Additionally, for the map to function properly, ensure the following CSP (Content Security Policy) settings are correctly configured:

```yaml
CONTENT_SECURITY_POLICY_DIRECTIVES__FRAME_SRC: "*" # allows iframes from any domain
CONTENT_SECURITY_POLICY_DIRECTIVES__IMG_SRC: "self http://0.0.0.0:8055 https: https://*.tile.openstreetmap.org data:" # allows map images
DIRECTUS_HTTP_HEADERS__CONTENT_SECURITY_POLICY: "default-src *; img-src * 'self' data: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' *; style-src 'self' 'unsafe-inline' *" # sets a global security policy for your application via the Content-Security-Policy HTTP header
```

## 📌 Important Links

- [Directus Quickstart](https://docs.directus.io/getting-started/quickstart.html) (under the Docker Installation tab)
- [How to Create an Extension](https://docs.directus.io/extensions/creating-extensions.html)
- [Access Directus Services](https://docs.directus.io/extensions/services/introduction.html)
- [Access Stored Collection Items](https://docs.directus.io/extensions/services/accessing-items.html)

