import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import {
  ClaudeToken,
  type IClaudeToken,
  type IKeyring,
  SystemKeyring,
} from './credential/index.ts';

/**
 * The Sandcastle round with the credential resolved first: it finds the token
 * in the environment or in the keyring, asks for one when it is missing or was
 * refused, checks it with `claude`, and only then launches
 * `pnpm sandcastle:round`. `--new` ignores whatever is stored.
 */
class AuthenticatedRound {
  private readonly token: IClaudeToken;
  private readonly keyring: IKeyring;
  private readonly claude: string;

  constructor(token: IClaudeToken, keyring: IKeyring) {
    this.token = token;
    this.keyring = keyring;
    const local = join(homedir(), '.local', 'bin', 'claude');
    this.claude = existsSync(local) ? local : 'claude';
  }

  async execute(askForNew: boolean): Promise<number> {
    const valid = (await this.resolve(askForNew)) ?? null;
    if (!valid) {
      console.error('No valid token. Generate one with `claude setup-token` and rerun with --new.');
      return 1;
    }
    if (this.keyring.read() !== valid) this.keyring.write(valid);

    const iterations = process.env.ITERATIONS ?? '1';
    console.log(`Token checked. Launching the round with ITERATIONS=${iterations}.`);
    const round = spawnSync('pnpm', ['sandcastle:round'], {
      env: { ...process.env, CLAUDE_CODE_OAUTH_TOKEN: valid, ITERATIONS: iterations },
      stdio: 'inherit',
    });
    return round.status ?? 1;
  }

  private async resolve(askForNew: boolean): Promise<string | null> {
    const stored = askForNew ? [] : [process.env.CLAUDE_CODE_OAUTH_TOKEN, this.keyring.read()];
    for (const raw of stored) {
      const token = raw ? this.token.normalise(raw) : null;
      if (token && this.accepted(token)) return token;
    }

    console.log('Paste the `claude setup-token` token (it will not show) and press Enter.');
    for (let attempt = 1; attempt <= 3; attempt++) {
      const pasted = await this.readHidden();
      const token = this.token.normalise(pasted);
      console.log(`Pasted: ${this.describe(pasted)}.`);
      if (!token) {
        console.error('That is not a `claude setup-token` token (sk-ant-oat01-…). Try again.');
        continue;
      }
      if (this.accepted(token)) return token;
      console.error('Claude refused that token. Generate another with `claude setup-token`.');
    }
    return null;
  }

  private accepted(token: string): boolean {
    process.stdout.write('Checking the token with Claude… ');
    const check = spawnSync(this.claude, ['-p', 'Answer only: ok', '--max-turns', '1'], {
      encoding: 'utf8',
      env: { ...process.env, CLAUDE_CODE_OAUTH_TOKEN: token },
      timeout: 90_000,
    });
    const output = `${check.stdout ?? ''}${check.stderr ?? ''}`;
    const reason =
      output.split(token).join('<token>').trim().split('\n')[0] || `exit ${check.status}`;
    if (/\b401\b|invalid bearer|not logged in|access token is invalid/i.test(output)) {
      console.log('refused.');
      console.error(`  claude said: ${reason.slice(0, 200)}`);
      return false;
    }
    if (check.status === 0) {
      console.log('accepted.');
      return true;
    }
    // a failure that is not authentication (e.g. an outdated claude on the host): the token passed
    console.log('no authentication refusal.');
    console.warn(`  warning: the check failed for another reason — ${reason.slice(0, 200)}`);
    return true;
  }

  /** What was pasted, without revealing the token: prefix, length, and what should not be there. */
  private describe(pasted: string): string {
    const clean = pasted.replace(/\s+/g, '');
    const strange = [...new Set(clean.replace(/[\w-]/g, ''))].join('');
    return [
      `starts with "${clean.slice(0, 13)}"`,
      `${clean.length} characters`,
      strange
        ? `with unexpected characters: ${JSON.stringify(strange)}`
        : 'no unexpected characters',
    ].join(', ');
  }

  private readHidden(): Promise<string> {
    return new Promise((resolve) => {
      const input = process.stdin;
      let read = '';
      input.setRawMode?.(true);
      input.resume();
      input.setEncoding('utf8');
      const onData = (chunk: string) => {
        for (const character of chunk) {
          if (character === '\u0003') process.exit(130);
          if (character === '\r' || character === '\n') {
            input.off('data', onData);
            input.setRawMode?.(false);
            input.pause();
            process.stdout.write('\n');
            resolve(read);
            return;
          }
          read = character === '\u007f' ? read.slice(0, -1) : read + character;
        }
      };
      input.on('data', onData);
    });
  }
}

const code = await new AuthenticatedRound(new ClaudeToken(), new SystemKeyring()).execute(
  process.argv.includes('--new')
);
process.exit(code);
