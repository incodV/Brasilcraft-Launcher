# Brasilcraft Launcher

Launcher customizado da comunidade Brasilcraft, baseado na arquitetura do XMCL e adaptado para entregar uma experiencia mais simples para o jogador final.

## Objetivo

O foco deste projeto e distribuir um launcher proprio da comunidade com:

- identidade visual Brasilcraft
- instalacao simples em `.exe`
- suporte a atualizacao automatica via GitHub Releases
- perfis dedicados para os modos principais do servidor
- fluxo pensado para conectar o jogador ao ecossistema Brasilcraft

## Perfis atuais

- `Minecraft 1.8` para Minigames
- `Brasilcraft Survival 1.21.11`

## Distribuicao

O plano de distribuicao principal no Windows e:

- `Brasilcraft-Launcher-Setup-<versao>-x64.exe`

Esse formato e o mais amigavel para o publico final, porque permite:

- baixar um unico arquivo
- executar o instalador normalmente
- instalar em poucos cliques
- receber suporte a atualizacao automatica no padrao do Electron

## Atualizacao automatica

O launcher agora esta configurado para buscar atualizacoes pelo repositorio:

- `https://github.com/incodV/Brasilcraft-Launcher`

Para a atualizacao funcionar ponta a ponta em producao, a release publicada no GitHub precisa conter os artefatos gerados pelo `electron-builder`, principalmente:

- instalador `nsis` em `.exe`
- arquivo `.yml` gerado para update

## Desenvolvimento

Repositorio principal:

- `https://github.com/incodV/Brasilcraft-Launcher`

Verificacoes locais:

```bash
npm --prefix xmcl-electron-app run check
```

Build do app electron:

```bash
npm --prefix xmcl-electron-app run build
```

## Proximos passos

- gerar o instalador `.exe` final
- publicar assets corretos no GitHub Releases
- validar a atualizacao automatica entre duas versoes reais
- criar a pagina oficial de divulgacao do launcher

## Creditos

Este projeto parte da base open source do XMCL, com customizacoes especificas para a comunidade Brasilcraft.
