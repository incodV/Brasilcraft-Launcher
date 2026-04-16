import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { readFile, writeFile } from 'fs-extra'
import { join } from 'path'

async function writeMimeList(mimesAppsList: string) {
  if (!existsSync(mimesAppsList)) {
    await writeFile(mimesAppsList, ['[Default Applications]', 'x-scheme-handler/brasilcraft=brasilcraft-launcher.desktop;\n'].join('\n'))
    return
  }
  const content = await readFile(mimesAppsList, 'utf-8')
  if (content.indexOf('x-scheme-handler/brasilcraft=brasilcraft-launcher.desktop') === -1) {
    let lines = content.split('\n')
    const defaultAppsHeaderIndex = lines.indexOf('[Default Applications]')
    if (defaultAppsHeaderIndex === -1) {
      lines.push('[Default Applications]')
      lines.push('x-scheme-handler/brasilcraft=brasilcraft-launcher.desktop;')
    } else {
      lines = [...lines.slice(0, defaultAppsHeaderIndex + 1), 'x-scheme-handler/brasilcraft=brasilcraft-launcher.desktop;', ...lines.slice(defaultAppsHeaderIndex + 1)]
    }
    await writeFile(mimesAppsList, lines.join('\n'))
  }
}

async function ensureDesktopFile(homePath: string, exePath: string, assigned: boolean) {
  const desktopFile = join(homePath, '.local', 'share', 'applications', 'brasilcraft-launcher.desktop')
  if (existsSync(desktopFile) || !assigned) {
    await writeFile(desktopFile, `[Desktop Entry]\nName=Brasilcraft-Laucher\nExec=${exePath} %u\nIcon=${exePath}\nType=Application\nMimeType=x-scheme-handler/brasilcraft;`)
  }
}

export async function setLinuxProtocol(homePath: string, exePath: string) {
  const existed = execSync('xdg-settings get default-url-scheme-handler brasilcraft', { encoding: 'utf-8' }).trim()
  const assigned = existed.length > 0
  await ensureDesktopFile(homePath, exePath, assigned)

  if (!assigned) {
    const mimesAppsList = join(homePath, '.config', 'mimeapps.list')
    await writeMimeList(mimesAppsList)
      .catch(() => writeMimeList(join(homePath, '.local', 'share', 'applications', 'mimeapps.list')))
  }
}
