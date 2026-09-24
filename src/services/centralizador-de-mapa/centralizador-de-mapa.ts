import type {
  AgendaDoCentralizador,
  ICentralizadorDeMapa,
  OpcoesDeCentralizacao,
  Retangulo,
  TamanhoDaTela,
} from './centralizador-de-mapa.types';

const PADDING_DO_FIT_BOUNDS_DO_DIRECTUS = 100;
const LATITUDE_MAXIMA_DE_MERCATOR = 85.05112878;
const LARGURA_DO_MUNDO_NO_ZOOM_0_DO_MAPLIBRE = 512;
const INTERVALO_DE_INSISTENCIA_MS = 250;
const PRAZO_PARA_O_MAPA_CARREGAR_MS = 10_000;

interface Insistencia {
  cancelar: () => void;
  destino: Retangulo;
  geojson: { bbox?: unknown };
  original: unknown;
  tentativas: number;
}

/**
 * Contorno provisório de uma limitação do componente de mapa do Directus
 * (medida na 10.13.1): ele não move a câmera depois de montado — a instância do
 * MapLibre é privada e a prop `camera` só é lida na construção. Remontar o
 * componente a cada passo, como a navegação entre registros exige, é inviável.
 *
 * O contorno usa o `watch` de `bounds` do componente, que chama
 * `fitBounds(data.bbox)`: troca o `bbox` do `geojson` pelo alvo, entrega um
 * `geojsonBounds` novo e devolve o `bbox` original depois. Esse `watch` só existe
 * após o `load` do MapLibre, então, até o primeiro `moveend`, o pedido é
 * reentregue periodicamente.
 *
 * Depende de `geojson`, `geojsonBounds` e do `watch` de `bounds` internos do
 * Directus. Quando o componente tiver suporte nativo a centralizar, esta classe
 * é o único lugar a trocar.
 */
export class CentralizadorDoMapaDirectus implements ICentralizadorDeMapa {
  private readonly estado: Record<string, unknown>;
  private readonly tamanhoDaTela: () => TamanhoDaTela | null;
  private readonly agenda: AgendaDoCentralizador;
  private readonly itensDaGrade: () => readonly Record<string, unknown>[];
  private mapaPronto = false;
  private insistencia: Insistencia | null = null;

  /**
   * @param estado o estado do layout de mapa embutido (`LayoutEmbutido.state`)
   * @param tamanhoDaTela o tamanho da área do mapa, para descontar o padding
   * @param agenda o relógio — `nextTick` e `setInterval` em produção
   * @param itensDaGrade os itens da página da grade, que não são filtrados pela
   *   área visível como os do mapa são com geometria nativa
   */
  constructor(
    estado: Record<string, unknown>,
    tamanhoDaTela: () => TamanhoDaTela | null,
    agenda: AgendaDoCentralizador,
    itensDaGrade: () => readonly Record<string, unknown>[] = () => []
  ) {
    this.estado = estado;
    this.tamanhoDaTela = tamanhoDaTela;
    this.agenda = agenda;
    this.itensDaGrade = itensDaGrade;
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

    const bboxAntesDosPedidos = this.insistencia?.original ?? geojson.bbox;
    this.insistencia?.cancelar();
    this.insistencia = null;

    this.entregar(geojson, destino);
    if (this.mapaPronto) {
      this.agenda.depoisDaAtualizacao(() => {
        geojson.bbox = bboxAntesDosPedidos;
      });
      return true;
    }

    const insistencia: Insistencia = {
      cancelar: () => {},
      destino,
      geojson,
      original: bboxAntesDosPedidos,
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

  /** Chamar a cada mudança de `cameraOptions` no estado — o `moveend` do Directus. */
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

  centralizarItem(item: Record<string, unknown>, opcoes: OpcoesDeCentralizacao = {}): boolean {
    const chave = this.estado.featureId;
    if (typeof chave !== 'string') return false;
    const features = (this.estado.geojson as { features?: unknown } | null | undefined)?.features;
    if (!Array.isArray(features)) return false;
    const feature = features.find(
      (candidata) =>
        (candidata as { properties?: Record<string, unknown> } | null)?.properties?.[chave] ===
        item[chave]
    ) as { geometry?: unknown } | undefined;
    if (feature) return this.centralizar(feature.geometry, opcoes);
    const campo = this.campoDeGeometriaNativa();
    return campo ? this.centralizar(item[campo], opcoes) : false;
  }

  enquadrarTudo(): void {
    this.encerrarInsistencia();
    const campo = this.campoDeGeometriaNativa();
    const pontos = campo ? this.itensDaGrade().flatMap((item) => this.pontosDe(item[campo])) : [];
    if (pontos.length > 0) {
      this.centralizar({ coordinates: pontos, type: 'MultiPoint' }, { somenteSeFora: false });
      return;
    }
    (this.estado.fitDataBounds as (() => void) | undefined)?.();
  }

  // com geometria nativa o Directus só busca os itens da área visível
  private campoDeGeometriaNativa(): string | null {
    const campo = this.estado.geometryField;
    return this.estado.isGeometryFieldNative === true && typeof campo === 'string' ? campo : null;
  }

  private encerrarInsistencia(): void {
    const insistencia = this.insistencia;
    if (!insistencia) return;
    insistencia.cancelar();
    insistencia.geojson.bbox = insistencia.original;
    this.insistencia = null;
  }

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

  // em Mercator, a projeção em que o zoom do mapa é linear
  private retanguloQueMantemOZoom(ponto: [number, number], visivel: Retangulo | null): Retangulo {
    const tela = this.tamanhoDaTela();
    const folga = 2 * PADDING_DO_FIT_BOUNDS_DO_DIRECTUS;
    const zoom = (this.estado.cameraOptions as { zoom?: unknown } | null | undefined)?.zoom;
    const temZoom = typeof zoom === 'number' && Number.isFinite(zoom);
    if ((!visivel && !temZoom) || !tela || tela.largura <= folga || tela.altura <= folga) {
      return [ponto[0], ponto[1], ponto[0], ponto[1]];
    }

    let largura: number;
    let altura: number;
    if (visivel) {
      largura = ((visivel[2] - visivel[0]) * (tela.largura - folga)) / tela.largura;
      altura =
        ((this.mercator(visivel[3]) - this.mercator(visivel[1])) * (tela.altura - folga)) /
        tela.altura;
    } else {
      const mundo = LARGURA_DO_MUNDO_NO_ZOOM_0_DO_MAPLIBRE * 2 ** (zoom as number);
      largura = (360 * (tela.largura - folga)) / mundo;
      altura = (2 * Math.PI * (tela.altura - folga)) / mundo;
    }
    const centroY = this.mercator(ponto[1]);
    return [
      ponto[0] - largura / 2,
      this.latitudeDeMercator(centroY - altura / 2),
      ponto[0] + largura / 2,
      this.latitudeDeMercator(centroY + altura / 2),
    ];
  }
}
