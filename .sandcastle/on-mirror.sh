#!/usr/bin/env bash
#
# Runs a command that talks to Docker from the MIRROR path of the worktree.
#
# Why this exists, and why it cannot be skipped: the agent works in
# `/home/agent/workspace`, but the Docker daemon is the HOST's — the socket is
# mounted in. Every path `docker-compose.test.yml` writes (`./`,
# `./dist/index.js`) is resolved by the daemon **on the host**, where
# `/home/agent/workspace` does not exist.
#
# And Docker does not complain about that. It CREATES the empty directory and
# carries on: Directus comes up without the extension, the runner mounts an
# empty `/workspace`, and the suite fails for a reason that is not its own —
# far from the cause, with the wrong message.
#
# The way out is path parity: `main.ts` mounts the host's worktrees directory
# into the container at the **same absolute path**. The same files show up in
# two places, and one of them has the name the host understands. That is the one
# compose has to be called from.
#
# Usage:
#   .sandcastle/on-mirror.sh pnpm test:e2e
#   .sandcastle/on-mirror.sh pnpm screenshot
set -euo pipefail

if [ "$#" -eq 0 ]; then
  echo "usage: .sandcastle/on-mirror.sh <command> [args...]" >&2
  exit 64
fi

gitdir=$(git rev-parse --git-dir)
case "$gitdir" in
  */.git/worktrees/*) ;;
  *)
    echo "on-mirror: this is not a Sandcastle worktree (git-dir: $gitdir)." >&2
    echo "  Outside the sandbox, run the command directly — the mirror is not needed." >&2
    exit 1
    ;;
esac

name=$(basename "$gitdir")
# A worktree's git-dir is `<repo>/.git/worktrees/<name>`: that is THREE levels up
# to the repository root, not two. With two, `repo` stopped at `<repo>/.git` and
# the mirror was looked for inside the git directory, which never existed — the
# script aborted saying the mount had not arrived, with the mount in place.
repo=$(dirname "$(dirname "$(dirname "$gitdir")")")
mirror="$repo/.sandcastle/worktrees/$name"

# The proof that the mirror is the SAME tree, and not a directory with the same
# name: two bind mounts of the same source show the same inode. Without this
# check, an empty mirror — which is exactly what Docker creates on its own when
# the path does not exist — would pass for good and the suite would run on
# nothing.
if [ ! -e "$mirror/package.json" ]; then
  echo "on-mirror: $mirror has no package.json — the mirror mount did not arrive." >&2
  exit 1
fi
if [ "$(stat -c %i "$mirror/package.json")" != "$(stat -c %i ./package.json)" ]; then
  echo "on-mirror: $mirror is another tree, not this worktree's mirror." >&2
  exit 1
fi

echo "on-mirror: $mirror"
cd "$mirror"
exec "$@"
