/* eslint-disable no-template-curly-in-string */
import { config as dotenv } from 'dotenv'
import type { Configuration } from 'electron-builder'

dotenv()

export const config = {
  productName: 'Brasilcraft-Laucher',
  appId: 'brasilcraft.launcher',
  directories: {
    output: 'build/output',
    buildResources: 'build',
    app: '.',
  },
  protocols: {
    name: 'Brasilcraft-Laucher',
    schemes: ['brasilcraft'],
  },
  // assign publish for auto-updater
  // set this to your own repo!
  publish: [{
    provider: 'github',
    owner: process.env.GITHUB_RELEASE_OWNER || 'incodV',
    repo: process.env.GITHUB_RELEASE_REPO || 'Brasilcraft-Launcher',
  }],
  files: [{
    from: 'dist',
    to: '.',
    filter: ['**/*.js', '**/*.ico', '**/*.png', '**/*.webp', '**/*.svg', '*.node', '**/*.html', '**/*.css', '**/*.woff2'],
  }, {
    from: '.',
    to: '.',
    filter: 'package.json',
  }],
  artifactName: 'brasilcraft-launcher-${version}-${platform}-${arch}.${ext}',
  appx: {
    displayName: 'Brasilcraft-Laucher',
    applicationId: 'brasilcraft.launcher',
    identityName: 'brasilcraft-launcher',
    backgroundColor: 'transparent',
    publisher: process.env.PUBLISHER,
    publisherDisplayName: 'CI010',
    setBuildNumber: true,
  },
  dmg: {
    artifactName: 'brasilcraft-launcher-${version}-${arch}.${ext}',
    contents: [
      {
        x: 410,
        y: 150,
        type: 'link',
        path: '/Applications',
      },
      {
        x: 130,
        y: 150,
        type: 'file',
      },
    ],
  },
  mac: {
    icon: 'icons/dark.icns',
    darkModeSupport: true,
    target: [
      {
        target: 'dmg',
        arch: ['arm64', 'x64'],
      },
    ],
    extendInfo: {
      NSMicrophoneUsageDescription: 'A Minecraft mod wants to access your microphone.',
      NSCameraUsageDescription: 'Please give us access to your camera',
      'com.apple.security.device.audio-input': true,
      'com.apple.security.device.camera': true,
    },
  },
  win: {
    certificateFile: process.env.WINDOWS_CERT_FILE || undefined as string | undefined,
    publisherName: 'Brasilcraft',
    icon: 'icons/dark.ico',
    signAndEditExecutable: false,
    verifyUpdateCodeSignature: false,
    target: [
      {
        target: 'nsis',
        arch: [
          'x64',
        ],
      },
      {
        target: 'zip',
        arch: [
          'x64',
        ],
      },
    ],
  },
  nsis: {
    artifactName: 'Brasilcraft-Launcher-Setup-${version}-${arch}.${ext}',
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    allowElevation: true,
    perMachine: false,
    installerIcon: 'icons/dark.ico',
    uninstallerIcon: 'icons/dark.ico',
    installerHeaderIcon: 'icons/dark.ico',
    installerSidebar: 'build/installerSidebar.bmp',
    uninstallerSidebar: 'build/uninstallerSidebar.bmp',
    installerHeader: 'build/installerHeader.bmp',
    createDesktopShortcut: 'always',
    createStartMenuShortcut: true,
    shortcutName: 'Brasilcraft Launcher',
    uninstallDisplayName: 'Brasilcraft Launcher',
  },
  linux: {
    executableName: 'brasilcraft-launcher',
    desktop: {
      MimeType: 'x-scheme-handler/brasilcraft',
      StartupWMClass: 'brasilcraft-launcher',
    },
    category: 'Game',
    icon: 'icons/dark.icns',
    artifactName: 'brasilcraft-launcher-${version}-${arch}.${ext}',
    target: [
      { target: 'deb', arch: ['x64', 'arm64'] },
      { target: 'rpm', arch: ['x64', 'arm64'] },
      { target: 'AppImage', arch: ['x64', 'arm64'] },
      { target: 'tar.xz', arch: ['x64', 'arm64'] },
      { target: 'pacman', arch: ['x64', 'arm64'] },
    ],
  },
  snap: {
    publish: [
      'github',
    ],
  },
} satisfies Configuration
