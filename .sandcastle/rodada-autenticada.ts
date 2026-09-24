import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { ChaveiroDoSistema, type IChaveiro, type ITokenDoClaude, TokenDoClaude } from './credencial/index.ts';

/**
 * A rodada do Sandcastle com a credencial resolvida antes: acha o token no ambiente
 * ou no chaveiro, pede quando falta ou foi recusado, confere com o `claude` e só
 * então lança `pnpm sandcastle:rodada`. `--novo` ignora o que está guardado.
 */
class RodadaAutenticada {
  private readonly token: ITokenDoClaude;
  private readonly chaveiro: IChaveiro;
  private readonly claude: string;

  constructor(token: ITokenDoClaude, chaveiro: IChaveiro) {
    this.token = token;
    this.chaveiro = chaveiro;
    const local = join(homedir(), '.local', 'bin', 'claude');
    this.claude = existsSync(local) ? local : 'claude';
  }

  async executar(pedirNovo: boolean): Promise<number> {
    const valido = (await this.resolver(pedirNovo)) ?? null;
    if (!valido) {
      console.error('Sem token válido. Gere um com `claude setup-token` e rode de novo com --novo.');
      return 1;
    }
    if (this.chaveiro.ler() !== valido) this.chaveiro.gravar(valido);

    const iteracoes = process.env.ITERACOES ?? '1';
    console.log(`Token conferido. Lançando a rodada com ITERACOES=${iteracoes}.`);
    const rodada = spawnSync('pnpm', ['sandcastle:rodada'], {
      env: { ...process.env, CLAUDE_CODE_OAUTH_TOKEN: valido, ITERACOES: iteracoes },
      stdio: 'inherit',
    });
    return rodada.status ?? 1;
  }

  private async resolver(pedirNovo: boolean): Promise<string | null> {
    const guardados = pedirNovo ? [] : [process.env.CLAUDE_CODE_OAUTH_TOKEN, this.chaveiro.ler()];
    for (const bruto of guardados) {
      const token = bruto ? this.token.normalizar(bruto) : null;
      if (token && this.aceito(token)) return token;
    }

    console.log('Cole o token do `claude setup-token` (não aparece na tela) e tecle Enter.');
    for (let tentativa = 1; tentativa <= 3; tentativa++) {
      const token = this.token.normalizar(await this.lerEscondido());
      if (!token) {
        console.error('Isso não é um token do `claude setup-token` (sk-ant-oat01-…). Tente de novo.');
        continue;
      }
      if (this.aceito(token)) return token;
      console.error('O Claude recusou esse token. Gere outro com `claude setup-token` e cole de novo.');
    }
    return null;
  }

  private aceito(token: string): boolean {
    process.stdout.write('Conferindo o token com o Claude… ');
    const conferencia = spawnSync(this.claude, ['-p', 'Responda apenas: ok', '--max-turns', '1'], {
      encoding: 'utf8',
      env: { ...process.env, CLAUDE_CODE_OAUTH_TOKEN: token },
      timeout: 90_000,
    });
    const saida = `${conferencia.stdout ?? ''}${conferencia.stderr ?? ''}`;
    const ok = conferencia.status === 0 && !/401|invalid bearer|not logged in|authenticate/i.test(saida);
    console.log(ok ? 'aceito.' : 'recusado.');
    return ok;
  }

  private lerEscondido(): Promise<string> {
    return new Promise((resolver) => {
      const entrada = process.stdin;
      let lido = '';
      entrada.setRawMode?.(true);
      entrada.resume();
      entrada.setEncoding('utf8');
      const aoLer = (pedaco: string) => {
        for (const caractere of pedaco) {
          if (caractere === '\u0003') process.exit(130);
          if (caractere === '\r' || caractere === '\n') {
            entrada.off('data', aoLer);
            entrada.setRawMode?.(false);
            entrada.pause();
            process.stdout.write('\n');
            resolver(lido);
            return;
          }
          lido = caractere === '\u007f' ? lido.slice(0, -1) : lido + caractere;
        }
      };
      entrada.on('data', aoLer);
    });
  }
}

const codigo = await new RodadaAutenticada(new TokenDoClaude(), new ChaveiroDoSistema()).executar(
  process.argv.includes('--novo')
);
process.exit(codigo);
