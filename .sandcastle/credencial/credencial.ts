import { execFileSync } from 'node:child_process';
import type { IChaveiro, ITokenDoClaude } from './credencial.types.ts';

const FORMATO_DO_TOKEN = /^sk-ant-oat01-[\w-]{40,}$/;

export class TokenDoClaude implements ITokenDoClaude {
  normalizar(bruto: string): string | null {
    const token = bruto.replace(/\s+/g, '');
    return FORMATO_DO_TOKEN.test(token) ? token : null;
  }
}

/** O chaveiro do sistema, pelo `secret-tool` (libsecret). */
export class ChaveiroDoSistema implements IChaveiro {
  private readonly atributos = ['service', 'claude-code', 'key', 'oauth-token'];

  ler(): string | null {
    try {
      return execFileSync('secret-tool', ['lookup', ...this.atributos], { encoding: 'utf8' }) || null;
    } catch {
      return null;
    }
  }

  gravar(token: string): void {
    execFileSync('secret-tool', ['store', '--label=Claude Code OAuth', ...this.atributos], { input: token });
  }
}
