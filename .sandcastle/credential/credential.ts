import { execFileSync } from 'node:child_process';
import type { IClaudeToken, IKeyring } from './credential.types.ts';

const TOKEN_FORMAT = /^sk-ant-oat01-[\w-]{40,}$/;

export class ClaudeToken implements IClaudeToken {
  normalise(raw: string): string | null {
    const token = raw.replace(/\s+/g, '');
    return TOKEN_FORMAT.test(token) ? token : null;
  }
}

/** The system keyring, through `secret-tool` (libsecret). */
export class SystemKeyring implements IKeyring {
  private readonly attributes = ['service', 'claude-code', 'key', 'oauth-token'];

  read(): string | null {
    try {
      return (
        execFileSync('secret-tool', ['lookup', ...this.attributes], { encoding: 'utf8' }) || null
      );
    } catch {
      return null;
    }
  }

  write(token: string): void {
    execFileSync('secret-tool', ['store', '--label=Claude Code OAuth', ...this.attributes], {
      input: token,
    });
  }
}
