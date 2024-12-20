# Directus - Extensão Layout MapGrid

Este projeto é uma extensão do tipo Layout para o Directus voltada para visualização de conteúdo em mapa e grid ao mesmo tempo.

## 💎 Usando a extensão

- Garanta que sua coleção tenha um campo com nome `geolocation`, do tipo "Mapa".
- Ative o Layout no menu de configurações a direita selecionando "MapGrid" no dropdown;

![Tela de visualização da extensão](docs/tela.jpg)

##  🚀  Levantando um Directus a partir de docker-compose

- Baixe este projeto ou copie o arquivo `docker-compose.yml` e inicie uma instalação do zero;
- Com o docker instalado na máquina ([saiba mais](https://docs.docker.com/get-docker/)), rode o comando:
```
 docker compose up
```


> [!IMPORTANT] 
> _O docker-compose usado neste projeto está configurado para permitir iframe de qualquer domínio. Em produção você deve liberar apenas domínios confiáveis."_
>
> Além disso, para que o mapa usado funcione, é preciso estar atento para duas configurações em relação ao CSP (content security policy): 
 ```yaml
CONTENT_SECURITY_POLICY_DIRECTIVES__FRAME_SRC: "*" # permite iframe de qualquer domínio
CONTENT_SECURITY_POLICY_DIRECTIVES__IMG_SRC: "self http://0.0.0.0:8055 https: https://*.tile.openstreetmap.org data:" # permite imagens do mapa
DIRECTUS_HTTP_HEADERS__CONTENT_SECURITY_POLICY: "default-src *; img-src * 'self' data: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' *; style-src 'self' 'unsafe-inline' *" # define uma política global de segurança para sua aplicação através do cabeçalho HTTP Content-Security-Policy
```

## 📌 Links importantes

- [Quickstart Directus](https://docs.directus.io/getting-started/quickstart.html) (na aba Docker Installation)
- [Como Criar uma extensão](https://docs.directus.io/extensions/creating-extensions.html) 
- [Acessar serviços do Directus](https://docs.directus.io/extensions/services/introduction.html)
- [Acessar itens gravados nas coleções](https://docs.directus.io/extensions/services/accessing-items.html) 
