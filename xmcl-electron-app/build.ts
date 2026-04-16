import { rebuild } from '@electron/rebuild'
import chalk from 'chalk'
import { execFile } from 'child_process'
import { createHash } from 'crypto'
import { Configuration, build as electronBuilder } from 'electron-builder'
import { BuildOptions, build as esbuild } from 'esbuild'
import { createReadStream, createWriteStream, existsSync } from 'fs'
import { copy, emptyDir, ensureFile } from 'fs-extra'
import { copyFile, readFile, readdir, stat, writeFile } from 'fs/promises'
import { createRequire } from 'module'
import path, { join, resolve } from 'path'
import createPrintPlugin from 'plugins/esbuild.print.plugin'
import { pipeline } from 'stream'
import { promisify } from 'util'
import { createGzip } from 'zlib'
import { buildAppInstaller } from './build/appinstaller-builder'
import { config as electronBuilderConfig } from './build/electron-builder.config'
import esbuildConfig from './esbuild.config'
import { version } from './package.json'

const require = createRequire(import.meta.url)

/**
 * @returns Hash string
 */
async function writeHash(algorithm: string, path: string) {
  const hash = createHash(algorithm).setEncoding('hex')
  await promisify(pipeline)(createReadStream(path), hash, createWriteStream(path + '.sha256'))
}

/**
 * Use esbuild to build main process
 */
async function buildMain(options: BuildOptions, slient = false) {
  await emptyDir(path.join(__dirname, './dist'))
  if (!slient) console.log(chalk.bold.underline('Build main process & preload'))
  const startTime = Date.now()
  if (!slient) options.plugins?.push(createPrintPlugin())
  const out = await esbuild({
    ...options,
    outdir: resolve(__dirname, './dist'),
    entryPoints: [path.join(__dirname, './main/index.ts')],
  })

  if (options.metafile) {
    await writeFile('./meta.json', JSON.stringify(out.metafile, null, 2))
  }
  const time = ((Date.now() - startTime) / 1000).toFixed(2)
  if (!slient) console.log(`Build completed in ${time}s.`)
  await copy(path.join(__dirname, '../xmcl-keystone-ui/dist'), path.join(__dirname, './dist/renderer'))
  if (!slient) console.log('\n')
  return time
}

async function findRcedit(): Promise<string | undefined> {
  const localAppData = process.env.LOCALAPPDATA
  if (!localAppData) return
  const cacheDir = join(localAppData, 'electron-builder', 'Cache', 'winCodeSign')
  if (!existsSync(cacheDir)) return

  for (const entry of await readdir(cacheDir)) {
    const candidate = join(cacheDir, entry, process.arch === 'ia32' ? 'rcedit-ia32.exe' : 'rcedit-x64.exe')
    if (existsSync(candidate)) {
      return candidate
    }
  }
}

async function patchWindowsExecutableIcon(appOutDir: string) {
  if (process.platform !== 'win32') return

  const executablePath = join(appOutDir, 'Brasilcraft-Laucher.exe')
  const iconPath = join(__dirname, 'icons', 'dark.ico')
  if (!existsSync(executablePath) || !existsSync(iconPath)) return

  const rceditPath = await findRcedit()
  if (!rceditPath) {
    console.log(`  ${chalk.yellow('•')} skip executable icon patch ${chalk.yellow('reason')}=rcedit-not-found`)
    return
  }

  await promisify(execFile)(rceditPath, [
    executablePath,
    '--set-icon', iconPath,
    '--set-version-string', 'ProductName', 'Brasilcraft Launcher',
    '--set-version-string', 'FileDescription', 'Brasilcraft Launcher',
    '--set-version-string', 'CompanyName', 'Brasilcraft',
  ])
  console.log(`  ${chalk.blue('•')} patched executable icon ${chalk.blue('path')}=${executablePath}`)
}

/**
 * Use electron builder to build your app to installer, zip, or etc.
 *
 * @param config The electron builder config
 * @param dir Use dir mode to build
 */
async function buildElectron(config: Configuration, dir: boolean) {
  console.log(chalk.bold.underline('Build electron'))
  const start = Date.now()
  const files = await electronBuilder({
    publish: 'never',
    config,
    ...(dir ? {
      dir: true,
      x64: true,
      arm64: process.platform !== 'win32',
    } : {}),
  })

  for (const file of files) {
    const fstat = await stat(file)
    console.log(
      `${chalk.gray('[write]')} ${chalk.yellow(file)} ${(
        fstat.size /
        1024 /
        1024
      ).toFixed(2)}mb`,
    )
  }

  for (const file of files) {
    if (!file.endsWith('.blockmap')) {
      await writeHash('sha256', file)
    }
  }

  console.log(
    `Build completed in ${((Date.now() - start) / 1000).toFixed(2)}s.`,
  )
}

async function prepareNsisTemplateWorkaround() {
  if (process.platform !== 'win32') {
    return
  }

  const nsisTargetPath = require.resolve('app-builder-lib/out/targets/nsis/NsisTarget.js')
  const appBuilderLibDir = path.dirname(path.dirname(path.dirname(path.dirname(nsisTargetPath))))
  const shortNsisDir = 'C:\\bc-nsis'
  const shortIncludeDir = join(shortNsisDir, 'include')

  const original = await readFile(nsisTargetPath, 'utf8')
  let patched = original

  if (!patched.includes('BC_NSIS_TEMPLATES_DIR')) {
    patched = patched.replace(
      'const USE_NSIS_BUILT_IN_COMPRESSOR = false;\n',
      'const USE_NSIS_BUILT_IN_COMPRESSOR = false;\nconst bcNsisTemplatesDir = process.env.BC_NSIS_TEMPLATES_DIR || nsisUtil_1.nsisTemplatesDir;\n',
    )
    patched = patched.replace(
      '? await (0, fs_extra_1.readFile)(path.join(nsisUtil_1.nsisTemplatesDir, "portable.nsi"), "utf8")',
      '? await (0, fs_extra_1.readFile)(path.join(bcNsisTemplatesDir, "portable.nsi"), "utf8")',
    )
    patched = patched.replace(
      'const script = await (0, fs_extra_1.readFile)(customScriptPath || path.join(nsisUtil_1.nsisTemplatesDir, "installer.nsi"), "utf8");',
      'const script = await (0, fs_extra_1.readFile)(customScriptPath || path.join(bcNsisTemplatesDir, "installer.nsi"), "utf8");',
    )
    patched = patched.replace(
      'cwd: nsisUtil_1.nsisTemplatesDir,',
      'cwd: bcNsisTemplatesDir,',
    )
    patched = patched.replace(
      'const includeDir = path.join(nsisUtil_1.nsisTemplatesDir, "include");\n        scriptGenerator.include(path.join(includeDir, "StdUtils.nsh"));',
      'const includeDir = process.env.BC_NSIS_INCLUDE_DIR || path.join(bcNsisTemplatesDir, "include");\n        scriptGenerator.include(path.join(includeDir, "StdUtils.nsh"));',
    )
    patched = patched.replace(
      'scriptGenerator.include(path.join(path.join(nsisUtil_1.nsisTemplatesDir, "include"), "FileAssociation.nsh"));',
      'scriptGenerator.include(path.join(path.join(bcNsisTemplatesDir, "include"), "FileAssociation.nsh"));',
    )
  }

  if (patched !== original) {
    await writeFile(nsisTargetPath, patched)
  }

  await copy(join(appBuilderLibDir, 'templates', 'nsis'), shortNsisDir, { overwrite: true })
  process.env.BC_NSIS_TEMPLATES_DIR = shortNsisDir
  process.env.BC_NSIS_INCLUDE_DIR = shortIncludeDir
}

async function start() {
  if (process.env.BUILD_TARGET === 'none') {
    await buildMain(esbuildConfig)
    return
  }
  const dir = !(process.env.BUILD_TARGET || (process.env.RELEASE === 'true'))
  // Create empty binding.gyp to let electron-rebuild trigger rebuild to it
  await ensureFile(resolve(__dirname, 'node_modules', 'node_datachannel', 'binding.gyp'))
  await prepareNsisTemplateWorkaround()
  const config: Configuration = {
    ...electronBuilderConfig,
    async beforeBuild(context) {
      const shouldSkipNativeRebuild = process.env.SKIP_NATIVE_REBUILD !== 'false'
      if (shouldSkipNativeRebuild) {
        console.log(`  ${chalk.blue('â€¢')} skip native rebuild ${chalk.blue('reason')}=SKIP_NATIVE_REBUILD`)
      } else {
        const rebuildProcess = rebuild({
          buildPath: context.appDir,
          electronVersion: context.electronVersion,
          arch: context.arch,
          types: ['dev'],
        })
        rebuildProcess.lifecycle.on('module-found', (path: string) => {
          console.log(`  ${chalk.blue('â€¢')} rebuild module ${chalk.blue('path')}=${path}`)
        })
        await rebuildProcess
        console.log(`  ${chalk.blue('â€¢')} rebuilt native modules ${chalk.blue('electron')}=${context.electronVersion} ${chalk.blue('arch')}=${context.arch}`)
      }
      const time = await buildMain({ ...esbuildConfig, metafile: true }, true)
      console.log(`  ${chalk.blue('â€¢')} compiled main process & preload in ${chalk.blue('time')}=${time}s`)
    },
    async afterPack(context) {
      await patchWindowsExecutableIcon(context.appOutDir)

      const suffix = context.arch === 3 ? '-arm64' : context.arch === 0 ? '-ia32' : ''
      const platformName = (process.platform === 'win32' ? 'win' : process.platform === 'darwin' ? 'mac' : 'linux') + suffix

      const dest = `build/output/app-${version}-${platformName}.asar`
      const gzipDest = dest + '.gz'
      let src = join(context.appOutDir, 'resources/app.asar')
      if (!existsSync(src)) {
        const possiblePaths = [
          'Brasilcraft-Laucher.app/Contents/Resources/app.asar',
          'X Minecraft Launcher.app/Contents/Resources/app.asar',
        ]
        for (const possiblePath of possiblePaths) {
          const test = join(context.appOutDir, possiblePath)
          if (existsSync(test)) {
            src = test
            break
          }
        }
      }
      if (!existsSync(src)) {
        console.log(`  ${chalk.yellow('â€¢')} fallback to ${chalk.yellow('Resources/app.asar')} for ${chalk.yellow('resources/app.asar')} not found`)
      }
      await copyFile(src, dest)
      await writeHash('sha256', dest)
      await promisify(pipeline)(createReadStream(dest), createGzip(), createWriteStream(gzipDest))
      console.log(`  ${chalk.blue('â€¢')} prepare asar with checksum ${chalk.blue('from')}=${src} ${chalk.blue('to')}=${dest}`)
    },
    async artifactBuildStarted(context) {
      if (context.targetPresentableName.toLowerCase() === 'appx') {
        console.log(`  ${chalk.blue('â€¢')} copy appx icons`)
        const files = await readdir(path.join(__dirname, './icons'))
        const storeFiles = files.filter(f => f.endsWith('.png') &&
          !f.endsWith('256x256.png') &&
          !f.endsWith('tray.png'))
          .map((f) => [
            path.join(__dirname, 'icons', f),
            path.join(__dirname, 'build', 'appx', f.substring(f.indexOf('@') + 1)),
          ] as const)
        await Promise.all(storeFiles.map(v => ensureFile(v[1]).then(() => copyFile(v[0], v[1]))))
      }
    },
    async artifactBuildCompleted(context) {
      if (!context.arch) return
      if (context.target && context.target.name === 'appx') {
        await buildAppInstaller(version, path.join(__dirname, './build/output/brasilcraft-launcher.appinstaller'), electronBuilderConfig.appx!.publisher!)
      }
    },
  }

  await buildElectron(config, dir)
  process.exit(0)
}

start().catch((e) => {
  console.error(chalk.red(e.toString()))
  process.exit(1)
})
