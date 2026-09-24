import type {
  AgendaDoCentralizador,
  ICentralizadorDeMapa,
  OpcoesDeCentralizacao,
  Retangulo,
  TamanhoDaTela,
} from './centralizador-de-mapa.types';

/**
 * O `padding` que o componente de mapa do Directus passa ao `fitBounds`, em
 * pixels, de cada lado. Está escrito na fonte deles; o retângulo que mantém o
 * zoom desconta exatamente isso.
 */
const PADDING_DO_FIT_BOUNDS_DO_DIRECTUS = 100;
const LATITUDE_MAXIMA_DE_MERCATOR = 85.05112878;
/** De quanto em quanto tempo reentregar o `bounds` enquanto o mapa carrega. */
const INTERVALO_DE_INSISTENCIA_MS = 250;
/** Quanto esperar o mapa carregar antes de desistir de um alvo. */
const PRAZO_PARA_O_MAPA_CARREGAR_MS = 10_000;

interface Insistencia {
  cancelar: () => void;
  destino: Retangulo;
  geojson: { bbox?: unknown };
  original: unknown;
  tentativas: number;
}

/**
 * Centraliza o mapa do layout de mapa do Directus, composto dentro do MapGrid.
 *
 * ## Isto é o contorno de uma limitação do componente do Directus
 *
 * Medido no Directus 10.13.1 (`app/src/layouts/map/components/map.vue`): o
 * componente de mapa **não oferece como mover a câmera depois de montado**.
 *
 * - A instância do MapLibre é um `let map` privado do `<script setup>`, sem
 *   `defineExpose`; nada fora do componente a alcança.
 * - A prop `camera` só é lida no `new Map({ ...props.camera })`. Trocá-la depois
 *   não move o mapa.
 * - Remontar o componente com uma câmera nova funciona, mas recria o mapa e
 *   recarrega os tiles a cada chamada — inviável para a navegação entre
 *   registros, que centraliza a cada passo.
 *
 * O que o componente faz, e este contorno usa: ele **observa a prop `bounds`** e,
 * quando ela muda, chama `map.fitBounds(props.data.bbox, { padding: 100,
 * speed: 1.3, maxZoom: 14 })` — com animação, na mesma instância. O layout
 * repassa ao componente o `geojson` do seu estado como `data` e o
 * `geojsonBounds` como `bounds`. Então, para centralizar:
 *
 * 1. troca-se o `bbox` do `geojson` pelo retângulo do alvo, **no mesmo objeto**
 *    — o `watch` de `data` deles é raso, e assim a coleção não é reenviada à
 *    fonte do mapa a cada passo;
 * 2. entrega-se um `geojsonBounds` novo, que dispara o `fitBounds`;
 * 3. depois da atualização, devolve-se o `bbox` original, para o "enquadrar
 *    tudo" deles não herdar o retângulo do alvo.
 *
 * ### Antes de o mapa carregar
 *
 * O `watch` de `bounds` deles só é registrado no `load` do MapLibre — estilo e
 * tiles baixados. Um pedido que chega antes disso (medido no e2e: a grade fica
 * clicável cerca de um segundo antes do mapa) troca `bounds` sem ninguém
 * escutando e se perde. Não há sinal de "carregou" fora do componente; o que há
 * é o `moveend`, que também só é ligado no `load` e grava `cameraOptions` no
 * estado. Então, enquanto a câmera nunca foi vista mudando, o centralizador
 * **insiste**: reentrega um `bounds` novo a cada 250 ms, com o `bbox` do alvo
 * mantido no `geojson`, até `aoMoverACamera` ser chamado (ou 10 s passarem).
 * Nessa hora entrega **mais um** `bounds` e encerra: o primeiro `moveend` só
 * prova que o mapa passou a escutar — ele pode ser o do `fitBounds` inicial
 * deles, dos dados, e não o nosso (medido no e2e). Visto o mapa se mover uma
 * vez, os pedidos seguintes vão direto, sem insistência.
 *
 * Para um ponto, o retângulo é a área visível de agora, descontado o `padding`
 * que o `fitBounds` deles aplica, e centrado no ponto: o zoom fica o mesmo. O
 * `maxZoom: 14` deles continua valendo — acima dele o mapa afasta até o 14.
 *
 * **Isto é provisório.** Três detalhes internos do Directus sustentam o
 * contorno: os nomes `geojson`/`geojsonBounds` no estado do layout, o `watch` de
 * `bounds` e o `fitBounds` ler `data.bbox`. O teste de contrato e o e2e do
 * enquadramento reprovam se uma atualização mudar algum deles. Quando o
 * componente de mapa do Directus ganhar suporte nativo a centralizar (uma
 * câmera observada, ou a instância exposta), esta classe deve ser trocada por
 * uma chamada a esse suporte — e é o único lugar que precisa mudar.
 */
export class CentralizadorDoMapaDirectus implements ICentralizadorDeMapa {
  private readonly estado: Record<string, unknown>;
  private readonly tamanhoDaTela: () => TamanhoDaTela | null;
  private readonly agenda: AgendaDoCentralizador;
  private mapaPronto = false;
  private insistencia: Insistencia | null = null;

  /**
   * @param estado o estado do layout de mapa embutido (`LayoutEmbutido.state`)
   * @param tamanhoDaTela o tamanho da área do mapa, para descontar o padding
   * @param agenda o relógio — `nextTick` e `setInterval` em produção
   */
  constructor(
    estado: Record<string, unknown>,
    tamanhoDaTela: () => TamanhoDaTela | null,
    agenda: AgendaDoCentralizador
  ) {
    this.estado = estado;
    this.tamanhoDaTela = tamanhoDaTela;
    this.agenda = agenda;
  }

  centralizar(geometria: unknown, opcoes: OpcoesDeCentralizacao = {}): boolean {
    const somenteSeFora = opcoes.somenteSeFora ?? true;
    const pontos = this.pontosDe(geometria);
    if (pontos.length === 0) return false;

    const alvo = this.retanguloDe(pontos);
    const visivel = this.areaVisivel();
    if (somenteSeFora && visivel && this.contem(visivel, alvo)) return false;

    const geojson = this.estado.geojson as { bbox?: unknown } | null | undefined;
    if (typeof geojson !== 'object' || geojson === null) return false;

    const [unico] = pontos;
    const destino =
      pontos.length === 1 && unico && !opcoes.aproximar
        ? this.retanguloQueMantemOZoom(unico, visivel)
        : alvo;

    // o bbox a devolver é o de antes do primeiro pedido, não o de um alvo anterior
    const original = this.insistencia?.original ?? geojson.bbox;
    this.insistencia?.cancelar();
    this.insistencia = null;

    this.entregar(geojson, destino);
    if (this.mapaPronto) {
      this.agenda.depoisDaAtualizacao(() => {
        geojson.bbox = original;
      });
      return true;
    }

    const insistencia: Insistencia = {
      cancelar: () => {},
      destino,
      geojson,
      original,
      tentativas: 0,
    };
    const limite = Math.ceil(PRAZO_PARA_O_MAPA_CARREGAR_MS / INTERVALO_DE_INSISTENCIA_MS);
    insistencia.cancelar = this.agenda.repetir(() => {
      insistencia.tentativas += 1;
      if (insistencia.tentativas >= limite) {
        this.encerrarInsistencia();
        return;
      }
      this.entregar(geojson, destino);
    }, INTERVALO_DE_INSISTENCIA_MS);
    this.insistencia = insistencia;
    return true;
  }

  /**
   * Avisa que o mapa gravou uma câmera nova — o `moveend` do Directus chegou ao
   * `cameraOptions` do estado. É a única prova, de fora, de que o mapa terminou
   * de carregar e o `watch` de `bounds` deles existe.
   */
  aoMoverACamera(): void {
    this.mapaPronto = true;
    const insistencia = this.insistencia;
    if (!insistencia) return;

    insistencia.cancelar();
    this.insistencia = null;
    this.entregar(insistencia.geojson, insistencia.destino);
    this.agenda.depoisDaAtualizacao(() => {
      insistencia.geojson.bbox = insistencia.original;
    });
  }

  private encerrarInsistencia(): void {
    const insistencia = this.insistencia;
    if (!insistencia) return;
    insistencia.cancelar();
    insistencia.geojson.bbox = insistencia.original;
    this.insistencia = null;
  }

  /** Põe o alvo onde o `fitBounds` deles lê, e troca o `bounds` que eles observam. */
  private entregar(geojson: { bbox?: unknown }, destino: Retangulo): void {
    geojson.bbox = destino;
    this.estado.geojsonBounds = [...destino];
  }

  private areaVisivel(): Retangulo | null {
    const bbox = (this.estado.cameraOptions as { bbox?: unknown } | null | undefined)?.bbox;
    return this.ehRetangulo(bbox) ? bbox : null;
  }

  private contem(externo: Retangulo, interno: Retangulo): boolean {
    return (
      interno[0] >= externo[0] &&
      interno[1] >= externo[1] &&
      interno[2] <= externo[2] &&
      interno[3] <= externo[3]
    );
  }

  private ehRetangulo(valor: unknown): valor is Retangulo {
    return (
      Array.isArray(valor) &&
      valor.length === 4 &&
      valor.every((n) => typeof n === 'number' && Number.isFinite(n))
    );
  }

  private latitudeDeMercator(y: number): number {
    return ((2 * Math.atan(Math.exp(y)) - Math.PI / 2) * 180) / Math.PI;
  }

  private mercator(latitude: number): number {
    const limitada = Math.max(
      -LATITUDE_MAXIMA_DE_MERCATOR,
      Math.min(LATITUDE_MAXIMA_DE_MERCATOR, latitude)
    );
    return Math.log(Math.tan(Math.PI / 4 + (limitada * Math.PI) / 360));
  }

  /** Todo par `[lng, lat]` válido da geometria, em qualquer profundidade. */
  private pontosDe(geometria: unknown): [number, number][] {
    const coordenadas = (geometria as { coordinates?: unknown } | null | undefined)?.coordinates;
    const pontos: [number, number][] = [];
    const visitar = (valor: unknown): boolean => {
      if (!Array.isArray(valor)) return false;
      if (valor.length >= 2 && typeof valor[0] === 'number' && typeof valor[1] === 'number') {
        const [lng, lat] = valor as [number, number];
        if (
          !Number.isFinite(lng) ||
          !Number.isFinite(lat) ||
          Math.abs(lat) > 90 ||
          Math.abs(lng) > 180
        ) {
          return false;
        }
        pontos.push([lng, lat]);
        return true;
      }
      return valor.every(visitar);
    };
    return visitar(coordenadas) ? pontos : [];
  }

  private retanguloDe(pontos: [number, number][]): Retangulo {
    const lngs = pontos.map((p) => p[0]);
    const lats = pontos.map((p) => p[1]);
    return [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)];
  }

  /**
   * A área visível de agora, menos o padding do `fitBounds` do Directus,
   * centrada no ponto. Em Mercator, porque é nessa projeção que o zoom do mapa
   * é linear: dividir graus de latitude distorceria a proporção longe do
   * equador. Sem área visível conhecida, ou numa tela menor que o padding, não
   * há zoom a manter e o ponto é enquadrado por si mesmo.
   */
  private retanguloQueMantemOZoom(ponto: [number, number], visivel: Retangulo | null): Retangulo {
    const tela = this.tamanhoDaTela();
    const folga = 2 * PADDING_DO_FIT_BOUNDS_DO_DIRECTUS;
    if (!visivel || !tela || tela.largura <= folga || tela.altura <= folga) {
      return [ponto[0], ponto[1], ponto[0], ponto[1]];
    }

    const largura = ((visivel[2] - visivel[0]) * (tela.largura - folga)) / tela.largura;
    const altura =
      ((this.mercator(visivel[3]) - this.mercator(visivel[1])) * (tela.altura - folga)) /
      tela.altura;
    const centroY = this.mercator(ponto[1]);
    return [
      ponto[0] - largura / 2,
      this.latitudeDeMercator(centroY - altura / 2),
      ponto[0] + largura / 2,
      this.latitudeDeMercator(centroY + altura / 2),
    ];
  }
}
