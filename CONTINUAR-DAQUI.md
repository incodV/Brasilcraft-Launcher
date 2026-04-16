# Brasilcraft Launcher: Como Continuar

Este arquivo foi criado para retomar o projeto exatamente do ponto atual.

## Estado atual

- Base do projeto: fork/customizacao do `voxelum/x-minecraft-launcher`
- Nome atual do launcher: `Brasilcraft-Laucher`
- Branding principal aplicado:
  - logos do Brasilcraft
  - fundo personalizado
  - textos principais trocados para Brasilcraft
  - icones principais substituidos
- Fluxo principal do launcher:
  - perfil `Minigames` com Minecraft `1.8`
  - perfil `Survival` com Minecraft `1.21.11`
  - perfil `Custom` removido
  - instancias forcadas para o servidor Brasilcraft
- Restricoes implementadas:
  - servidor fixo `jogarbrasilcraft.com`
  - configuracao manual de host/porta bloqueada na UI

## O que ja funciona

- Launcher abre em modo de desenvolvimento
- Minecraft ja foi iniciado com sucesso pelo launcher
- Perfis do Brasilcraft foram criados
- Visual principal foi parcialmente refeito para a identidade BC
- Build da UI e compile do Electron funcionam
- Arquivo de distribuicao `.zip` ja foi gerado com sucesso

## Arquivos de distribuicao prontos

- `xmcl-electron-app/build/output/brasilcraft-launcher-0.54.4-win32-x64.zip`
- executavel desempacotado:
  - `xmcl-electron-app/build/output/win-unpacked/Brasilcraft-Laucher.exe`

## Pendencias principais

### 1. Distribuicao

- Subir o codigo para o GitHub do Brasilcraft
- Publicar o `.zip` em GitHub Releases
- Resolver a geracao do `.exe` empacotado final

### 2. APIs de mods

- CurseForge:
  - suporte ja existe
  - falta colocar `CURSEFORGE_API_KEY` em `xmcl-electron-app/.env`
- Modrinth:
  - fluxo atual ainda depende de infraestrutura herdada do XMCL
  - ideal futuro: criar app OAuth proprio do Brasilcraft

### 3. Revisao final de marca

- ainda vale fazer uma varredura final para remover qualquer mencao antiga remanescente
- revisar titulos, textos secundarios e links herdados

## Problemas encontrados no empacotamento

### `.zip`

- gerado com sucesso

### `.exe` empacotado

Tentativas feitas:

- `nsis`
- `portable`
- `IExpress`

Bloqueios encontrados nesta maquina:

- falta de Visual Studio Build Tools para rebuild nativo inicial
- cache do `winCodeSign` com erro de privilegio para symlink
- erro do `makensis` ao localizar `StdUtils.nsh` no caminho atual do projeto
- tentativa com `IExpress` nao produziu o `.exe` final esperado

## Melhor proximo passo recomendado

1. Fazer push completo para `incodV/Brasilcraft-Launcher`
2. Publicar o `.zip` no GitHub Releases
3. Tentar o build do `.exe` em ambiente mais limpo:
   - pasta curta sem espacos, por exemplo `C:\bc\Brasilcraft-Launcher`
   - ou outra maquina Windows
   - ou GitHub Actions
4. Depois configurar auto-update apontando para o repo do Brasilcraft

## Comandos uteis

### Build da UI

```powershell
$env:NODE_OPTIONS='--max-old-space-size=4096'
npx pnpm --prefix xmcl-keystone-ui build
```

### Compile do Electron

```powershell
npx pnpm run --prefix xmcl-electron-app compile
```

### Build de release

```powershell
$env:RELEASE='true'
$env:SKIP_NATIVE_REBUILD='true'
npx pnpm run --prefix xmcl-electron-app build
```

### Abrir launcher em desenvolvimento

```powershell
$env:ELECTRON_RUN_AS_NODE = $null
Start-Process -FilePath 'c:\Users\Usuario\Desktop\brasilcraft laucher\x-minecraft-launcher\node_modules\.pnpm\electron@29.3.1\node_modules\electron\dist\electron.exe' `
  -WorkingDirectory 'c:\Users\Usuario\Desktop\brasilcraft laucher\x-minecraft-launcher\xmcl-electron-app' `
  -ArgumentList '.'
```

### Limpeza completa de dados locais

```powershell
$targets = @(
  'C:\Users\Usuario\.minecraftx',
  'D:\.minecraftx',
  (Join-Path $env:APPDATA 'xmcl'),
  (Join-Path $env:APPDATA 'brasilcraft-launcher'),
  (Join-Path $env:APPDATA 'BRcraftLaucher'),
  (Join-Path $env:LOCALAPPDATA 'xmcl'),
  (Join-Path $env:LOCALAPPDATA 'brasilcraft-launcher'),
  (Join-Path $env:LOCALAPPDATA 'BRcraftLaucher')
)
foreach ($target in $targets) {
  if (Test-Path $target) {
    Remove-Item -LiteralPath $target -Recurse -Force
  }
}
```
