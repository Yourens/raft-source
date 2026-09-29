export const STAGING_COMPUTER_SERVER_URL = "https://api-aws-staging.botiverse.dev";
export const DEFAULT_COMPUTER_SERVER_URL = "https://api.raft.build";
export const LEGACY_DEFAULT_COMPUTER_SERVER_URL = "https://api.slock.ai";

// The Computer ships as a self-contained SEA binary installed by the native
// shell script (`install.sh` on macOS/Linux, `install.ps1` on Windows), not
// npm — no Node/npm required. The installer resolves the latest version from
// the release base `manifest.json`. Prod uses the formal
// computer-v* channel; staging uses a branch snapshot channel isolated under
// /computer/staging. The installed binary is `raft-computer`.
export const COMPUTER_CDN_BASE_STAGING = "https://slock-cdn-staging.botiverse.dev/computer/staging";
export const COMPUTER_CDN_BASE_PROD = "https://cdn.raft.build/computer";

export type ComputerCommandPlatform = "mac-linux" | "windows";

function normalizeComputerVersionPin(version?: string | null): string | null {
  const normalized = version?.trim() ?? "";
  return /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(normalized)
    ? normalized
    : null;
}

export function computerInstallCommand(
  deploymentEnv?: string,
  version?: string | null,
): string {
  const base = deploymentEnv === "staging" ? COMPUTER_CDN_BASE_STAGING : COMPUTER_CDN_BASE_PROD;
  const versionPin = normalizeComputerVersionPin(version);
  const installEnv = [
    ...(deploymentEnv === "staging"
      ? [
          `RAFT_COMPUTER_RELEASE_BASE=${base}`,
          "RAFT_COMPUTER_INSTALL_CHANNEL=alpha",
        ]
      : []),
    ...(versionPin ? [`RAFT_COMPUTER_VERSION=${versionPin}`] : []),
  ];
  return `curl -fsSL ${base}/install.sh | ${installEnv.length > 0 ? `${installEnv.join(" ")} ` : ""}sh`;
}

export function windowsComputerInstallCommand(
  deploymentEnv?: string,
  version?: string | null,
): string {
  const base = deploymentEnv === "staging" ? COMPUTER_CDN_BASE_STAGING : COMPUTER_CDN_BASE_PROD;
  const versionPin = normalizeComputerVersionPin(version);
  const installEnv = [
    ...(deploymentEnv === "staging"
      ? [
          `$env:RAFT_COMPUTER_RELEASE_BASE = "${base}"`,
          '$env:RAFT_COMPUTER_INSTALL_CHANNEL = "alpha"',
        ]
      : []),
    ...(versionPin ? [`$env:RAFT_COMPUTER_VERSION = "${versionPin}"`] : []),
  ];
  const installUrl = deploymentEnv === "staging"
    ? '"$env:RAFT_COMPUTER_RELEASE_BASE/install.ps1"'
    : `${base}/install.ps1`;
  return `${installEnv.length > 0 ? `${installEnv.join("; ")}; ` : ""}irm ${installUrl} | iex`;
}

export interface ComputerSetupCommandOptions {
  // Retained as a no-op input so existing callsites (AddMachineDialog,
  // MachineDetailPanel) keep passing the daemon-side legacy key without
  // churn. The CLI removed `--adopt-legacy` / `--legacy-api-key` in
  // RFC v9 PR-impl-3 commit 3 — legacy-daemon adoption is now driven by
  // an interactive TTY prompt inside `raft-computer setup`, not flags.
  legacyApiKey?: string | null;
  // Identity-carried adoption (task #239 PR-D/PR-E): when the calling
  // surface knows WHICH machine row this computer is (machine detail
  // page), the command carries `--machine <id>` and `raft-computer setup`
  // adopts that row directly — no fingerprint matching, no local
  // evidence, works after key rotation. The id is an identifier, not a
  // secret.
  machineId?: string | null;
  platform?: ComputerCommandPlatform;
  // Optional deterministic installer target. Manual fresh-install recovery
  // uses the currently published Computer artifact instead of relying on a
  // CDN edge's potentially stale latest manifest.
  version?: string | null;
}

export interface ComputerCommands {
  install: string;
  setup: string;
  status: string;
  doctor: string;
  // Restart the whole Computer service and every attached server runner.
  restartService: string;
  // Restart while scoping lifecycle readback to one server.
  restart: string;
  stop: string;
  start: string;
}

export interface DaemonConnectCommandOptions {
  apiKey: string;
  serverName?: string | null;
  serverUrl: string;
  distTag?: string;
  platform?: ComputerCommandPlatform;
}

export function getDaemonConnectCommand({
  apiKey,
  serverName,
  serverUrl,
  distTag = "latest",
  platform = "mac-linux",
}: DaemonConnectCommandOptions): string {
  const packageSpec = `@botiverse/raft-daemon@${distTag}`;
  if (platform === "windows") {
    return `npx.cmd ${packageSpec} --server-url ${serverUrl} --api-key ${apiKey}`;
  }
  const suffix = serverName ? ` # ${serverName}` : "";
  return `npx ${packageSpec} --server-url ${serverUrl} --api-key ${apiKey}${suffix}`;
}

// Self-hosted build knobs (siltok). Both default off, so an unconfigured build
// keeps upstream behaviour.
// - VITE_COMPUTER_VERSION_PIN: pin the Computer version the install command
//   installs when the caller did not pass one, so a self-hosted server is not
//   paired with a newer hosted-only Computer release.
// - VITE_COMPUTER_WINDOWS_PATHEXT_FIX=1: Computer 1.0.28 stages itself on
//   Windows as `k/slots/stable/artifact.bin` and the agent `raft.ps1` wrapper
//   runs it with `& artifact.bin`; PowerShell only executes extensions listed
//   in PATHEXT, so every agent `raft` call fails with "operation not
//   supported". The install command then first adds `.BIN` to the user PATHEXT
//   (persisted) and to the current session (so the service `setup` starts from
//   this terminal inherits it).
const SELF_HOSTED_COMPUTER_VERSION_PIN = import.meta.env?.VITE_COMPUTER_VERSION_PIN;
const WINDOWS_PATHEXT_FIX_ENABLED = import.meta.env?.VITE_COMPUTER_WINDOWS_PATHEXT_FIX === "1";

export const WINDOWS_PATHEXT_BIN_FIX =
  "$pe = [Environment]::GetEnvironmentVariable('PATHEXT','User'); "
  + "if (-not $pe) { $pe = [Environment]::GetEnvironmentVariable('PATHEXT','Machine') }; "
  + "if (($pe -split ';') -notcontains '.BIN') { [Environment]::SetEnvironmentVariable('PATHEXT', \"$pe;.BIN\", 'User') }; "
  + "if (($env:PATHEXT -split ';') -notcontains '.BIN') { $env:PATHEXT += ';.BIN' }";

// Runs before the installer: the hosted install.ps1 ends with `exit`, which
// under `irm | iex` ends the whole PowerShell session.
export function withWindowsPathextFix(installCommand: string, enabled = WINDOWS_PATHEXT_FIX_ENABLED): string {
  return enabled ? `${WINDOWS_PATHEXT_BIN_FIX}; ${installCommand}` : installCommand;
}

// Non-production deployments (staging / slockdev) are internal test surfaces.
// A tester frequently runs the connect command on a machine that already runs
// a real prod Computer; without isolation the command would install over
// ~/.local/bin/raft-computer and write state into ~/.slock, clobbering their
// prod Computer (binary + channel + state). For these envs every command
// carries the same per-server home/bin, while remaining a separate copy step:
// install only installs, setup only runs the installed binary, and terminal
// actions address that same isolated Computer. Production stays default — real
// users legitimately want a single Computer at the default location.
const ISOLATED_DEPLOYMENT_ENVS = new Set(["staging", "slockdev"]);

export function getComputerCommands(
  serverSlug: string | undefined | null,
  deploymentEnv = import.meta.env?.VITE_DEPLOYMENT_ENV,
  serverUrl?: string,
  options: ComputerSetupCommandOptions = {},
): ComputerCommands | null {
  const slug = serverSlug?.trim().replace(/^\/+/, "");
  if (!slug) return null;

  const platform = options.platform ?? "mac-linux";

  // An unset deployment env is a self-hosted build: like production, any
  // non-hosted API origin must be passed explicitly, or `raft-computer setup`
  // falls back to the hosted default and attaches to the wrong server.
  const commandServerUrl = deploymentEnv === "production" || !deploymentEnv
    ? isDefaultComputerServerUrl(serverUrl) ? null : serverUrl
    : deploymentEnv === "staging"
    ? STAGING_COMPUTER_SERVER_URL
    : deploymentEnv === "slockdev"
      ? serverUrl
      : null;
  const serverUrlArg = commandServerUrl ? ` --server-url ${commandServerUrl}` : "";
  const machineArg = options.machineId ? ` --machine ${options.machineId}` : "";
  const setupArgs = `${serverUrlArg}${machineArg}`;
  const installVersion = options.version ?? SELF_HOSTED_COMPUTER_VERSION_PIN ?? null;
  if (deploymentEnv && ISOLATED_DEPLOYMENT_ENVS.has(deploymentEnv)) {
    // `slug` is the canonical setup slug (same one used in `setup /${slug}`),
    // so the isolated home matches across web-generated command, #105 harness,
    // and manual QA. Every independent command carries the same env and invokes
    // the isolated binary by full path because it is intentionally not installed
    // on the tester's default PATH. `paths.ts` reads
    // `RAFT_HOME || SLOCK_HOME`, so RAFT_HOME alone carries the state root.
    if (platform === "windows") {
      const home = `$env:USERPROFILE\\.raft-computer-${slug}`;
      const environment = `$env:RAFT_HOME = "${home}"; $env:RAFT_COMPUTER_INSTALL_DIR = "$env:RAFT_HOME\\bin";`;
      const binary = `& "$env:RAFT_COMPUTER_INSTALL_DIR\\raft-computer.exe"`;
      return {
        install: `${environment} ${windowsComputerInstallCommand(deploymentEnv, options.version)}`,
        setup: `${environment} ${binary} setup /${slug}${setupArgs}`,
        status: `${environment} ${binary} status`,
        doctor: `${environment} ${binary} doctor`,
        restartService: `${environment} ${binary} restart`,
        restart: `${environment} ${binary} restart /${slug}`,
        stop: `${environment} ${binary} stop`,
        start: `${environment} ${binary} start`,
      };
    }

    const home = `$HOME/.raft-computer-${slug}`;
    const environment = `RAFT_HOME="${home}" RAFT_COMPUTER_INSTALL_DIR="${home}/bin"`;
    const binary = `"${home}/bin/raft-computer"`;
    return {
      install: `${environment} sh -c '${computerInstallCommand(deploymentEnv, options.version)}'`,
      setup: `${environment} ${binary} setup /${slug}${setupArgs}`,
      status: `${environment} ${binary} status`,
      doctor: `${environment} ${binary} doctor`,
      restartService: `${environment} ${binary} restart`,
      restart: `${environment} ${binary} restart /${slug}`,
      stop: `${environment} ${binary} stop`,
      start: `${environment} ${binary} start`,
    };
  }

  return {
    install: platform === "windows"
      ? withWindowsPathextFix(windowsComputerInstallCommand(deploymentEnv, installVersion))
      : computerInstallCommand(deploymentEnv, installVersion),
    setup: `raft-computer setup /${slug}${setupArgs}`,
    status: "raft-computer status",
    doctor: "raft-computer doctor",
    restartService: "raft-computer restart",
    restart: `raft-computer restart /${slug}`,
    stop: "raft-computer stop",
    start: "raft-computer start",
  };
}

export function getComputerSetupCommand(
  serverSlug: string | undefined | null,
  deploymentEnv = import.meta.env?.VITE_DEPLOYMENT_ENV,
  serverUrl?: string,
  options: ComputerSetupCommandOptions = {},
): string | null {
  return getComputerCommands(serverSlug, deploymentEnv, serverUrl, options)?.setup ?? null;
}

function isDefaultComputerServerUrl(serverUrl: string | undefined): boolean {
  const normalized = serverUrl?.trim().replace(/\/+$/, "");
  return normalized === DEFAULT_COMPUTER_SERVER_URL || normalized === LEGACY_DEFAULT_COMPUTER_SERVER_URL;
}
