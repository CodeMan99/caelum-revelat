#!/usr/bin/env bash

set -eEuo pipefail

if [[ -d /deno-dir ]]; then {
	chmod 2775 /deno-dir
} fi

usermod -aG deno $USERNAME
