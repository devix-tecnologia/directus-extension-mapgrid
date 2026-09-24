import { describe, expect, it } from 'vitest';
import { CHAVES_QUE_EXPLODEM_FORA_DO_RENDER, leitorDeEstadoEmbutido } from './leitor-de-estado';

describe('ler o estado de um layout embutido', () => {
  it('devolve as chaves como estão quando nenhum getter explode', () => {
    const ler = leitorDeEstadoEmbutido();
    expect(ler({ items: [1, 2], loading: false })).toEqual({ items: [1, 2], loading: false });
  });

  it('sem estado, devolve um objeto vazio', () => {
    expect(leitorDeEstadoEmbutido()(undefined)).toEqual({});
  });

  it('a chave que explode fora do render não é nem lida', () => {
    const ler = leitorDeEstadoEmbutido();
    let leituras = 0;
    const estado = {
      items: [1],
      get showingCount(): string {
        leituras += 1;
        return '1-2 of 2';
      },
    };
    expect(CHAVES_QUE_EXPLODEM_FORA_DO_RENDER).toContain('showingCount');
    expect(ler(estado)).toEqual({ items: [1] });
    expect(leituras).toBe(0);
  });

  it('a chave que explode na primeira leitura fica de fora, e as outras passam', () => {
    const ler = leitorDeEstadoEmbutido();
    const estado = {
      items: [1],
      get contagem(): string {
        throw new SyntaxError('Must be called at the top of a `setup` function');
      },
    };
    const lido = ler(estado);
    expect(lido).toEqual({ items: [1] });
    expect('contagem' in lido).toBe(false);
  });

  it('a chave que explode depois de uma leitura boa fica com o último valor bom', () => {
    const ler = leitorDeEstadoEmbutido();
    let explode = false;
    const estado = {
      get contagem(): string {
        if (explode) throw new SyntaxError('Must be called at the top of a `setup` function');
        return '1-2 of 2';
      },
    };
    expect(ler(estado)).toEqual({ contagem: '1-2 of 2' });
    explode = true;
    expect(ler(estado)).toEqual({ contagem: '1-2 of 2' });
  });

  it('cada leitor guarda o seu: o do mapa não empresta valor ao da grade', () => {
    const doMapa = leitorDeEstadoEmbutido();
    const daGrade = leitorDeEstadoEmbutido();
    let explode = false;
    const estado = {
      get contagem(): string {
        if (explode) throw new Error('não');
        return 'bom';
      },
    };
    doMapa(estado);
    explode = true;
    expect(daGrade(estado)).toEqual({});
  });

  it('a chave volta ao valor novo assim que o getter para de explodir', () => {
    const ler = leitorDeEstadoEmbutido();
    let explode = false;
    let valor = 'um';
    const estado = {
      get contagem(): string {
        if (explode) throw new Error('não');
        return valor;
      },
    };
    ler(estado);
    explode = true;
    ler(estado);
    explode = false;
    valor = 'dois';
    expect(ler(estado)).toEqual({ contagem: 'dois' });
  });
});
