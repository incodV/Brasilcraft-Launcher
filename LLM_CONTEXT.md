# LLM Context: Brasilcraft Launcher

This file is intended to help an LLM resume work on this repository quickly.

## Project goal

Turn the XMCL-based launcher into a fully branded launcher for the Brasilcraft community.

## Product direction

- Launcher name: `Brasilcraft-Laucher`
- Target audience: Brasilcraft community
- Main usage:
  - direct entry into Brasilcraft server
  - fixed profiles for supported game modes

## Supported profiles

- `Brasilcraft Minigames`
  - Minecraft `1.8`
- `Brasilcraft Survival`
  - Minecraft `1.21.11`

## Important product decisions already made

- Remove `Custom` profile
- Keep launcher focused on Brasilcraft only
- Force instances to use the Brasilcraft multiplayer server
- Disable free editing of host and port in launcher UI

## Server lock

- host: `jogarbrasilcraft.com`
- port: `25565`

## Branding work already done

- replaced many `X Minecraft Launcher` references with Brasilcraft branding
- replaced internal launcher icon protocol assets
- added Brasilcraft logo assets
- added Brasilcraft loading / background artwork
- customized parts of the UI theme toward BC green/gold palette
- removed some upstream feedback/help references

## Known build/distribution status

- UI production build works
- Electron compile works
- Windows `.zip` artifact was successfully produced
- packed `.exe` generation is still blocked by local machine/tooling issues

## Distribution artifacts currently available

- `xmcl-electron-app/build/output/brasilcraft-launcher-0.54.4-win32-x64.zip`
- unpacked executable:
  - `xmcl-electron-app/build/output/win-unpacked/Brasilcraft-Laucher.exe`

## GitHub target

- owner: `incodV`
- repo: `Brasilcraft-Launcher`
- remote URL:
  - `https://github.com/incodV/Brasilcraft-Launcher.git`

## API status

### CurseForge

- support exists in code
- needs `CURSEFORGE_API_KEY` in `xmcl-electron-app/.env`

### Modrinth

- current flow still depends on inherited XMCL infrastructure
- long-term fix:
  - register a Brasilcraft OAuth app
  - replace inherited auth exchange endpoint

## Build blockers encountered on this machine

- native rebuild initially wanted Visual Studio Build Tools
- `winCodeSign` extraction failed due to symlink privilege issue
- NSIS include resolution failed during `.exe` packaging
- IExpress path produced intermediary output but not final usable `.exe`

## Recommended next actions

1. Push current code to the Brasilcraft GitHub repository
2. Publish the generated `.zip` to GitHub Releases
3. Retry `.exe` packaging in a cleaner environment:
   - shorter path
   - different Windows machine
   - or CI runner
4. Later:
   - configure release owner/repo permanently
   - configure app update pipeline
   - wire CurseForge key
   - replace inherited Modrinth auth flow
