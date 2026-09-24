/**
 * As chaves do estado embutido que a composição **não pode nem tocar**.
 *
 * Medido no Directus 10.13.1: o `showingCount` dos dois layouts é um `computed`
 * cujo getter chama `useI18n()`, e o vue-i18n levanta um `SyntaxError`
 * (`MUST_BE_CALL_SETUP_TOP`) quando não há instância corrente. É o erro que
 * aparecia no console do e2e a cada busca filtrada pela área visível.
 *
 * Por que a chave tem que sair pelo nome, e um `try` não resolve: quem avalia
 * esse getter fora do render não somos nós, é o agendador do Vue. Antes de
 * repintar ele pergunta ao efeito de render se está sujo, e a resposta percorre
 * os `computed` de que ele depende reavaliando cada um — sem render, sem
 * instância corrente. Basta o `showingCount` ter sido lido **uma vez com
 * sucesso** (no primeiro render, onde há instância) para virar dependência
 * nossa e entrar nessa varredura. Aí explode dentro da pergunta, a varredura
 * morre no meio — em 3.4 sem nem desfazer o `pauseTracking` que ela mesma pôs —
 * e a composição não repinta mais: era isso que segurava o `geojsonBounds` novo
 * longe do mapa depois da busca.
 *
 * Nada se perde: o `showingCount` é o texto "1-25 de 132" que o cabeçalho do
 * Directus desenha, e o cabeçalho do MapGrid monta o dele a partir de
 * `itemCount` e `totalCount`, em `src/index.ts`. O componente do layout
 * embutido não lê essa chave.
 */
export const CHAVES_QUE_EXPLODEM_FORA_DO_RENDER = ['showingCount'];

/**
 * Lê as chaves do estado de um layout embutido para repassá-las ao componente
 * dele.
 *
 * Faz duas coisas que o `{ ...estado }` não fazia:
 *
 * 1. pula as chaves de `CHAVES_QUE_EXPLODEM_FORA_DO_RENDER`, pelo motivo
 *    documentado lá — é a correção do congelamento;
 * 2. isola em `try` cada leitura restante. Isso **não** substitui o item 1: só
 *    alcança o getter que explode já na primeira leitura, que por isso nunca
 *    chega a ser registrado como dependência nossa (o Vue só registra depois
 *    que o getter volta) e fica contido em uma chave. Vale como rede: uma chave
 *    a menos no componente embutido é melhor que a tela inteira parada.
 *
 * O último valor bom fica guardado porque nem toda chave é enfeite: se quem
 * explodir for uma que o layout embutido consome, entregar o valor anterior
 * degrada melhor do que entregar `undefined`.
 */
export function leitorDeEstadoEmbutido(): (
  estado?: Record<string, unknown> | null
) => Record<string, unknown> {
  const ultimoBom = new Map<string, unknown>();

  return (estado) => {
    if (!estado) return {};

    const lido: Record<string, unknown> = {};
    for (const chave of Object.keys(estado)) {
      if (CHAVES_QUE_EXPLODEM_FORA_DO_RENDER.includes(chave)) continue;
      try {
        const valor = estado[chave];
        ultimoBom.set(chave, valor);
        lido[chave] = valor;
      } catch {
        if (ultimoBom.has(chave)) lido[chave] = ultimoBom.get(chave);
      }
    }
    return lido;
  };
}
