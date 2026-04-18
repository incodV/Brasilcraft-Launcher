<template>
  <section class="quickplay-shell">
    <div class="quickplay-hero">
      <div class="quickplay-copy">
        <p class="quickplay-kicker">Brasilcraft Launcher</p>
        <h2 class="quickplay-title">Perfil oficial pronto para jogar</h2>
        <p class="quickplay-subtitle">
          Um unico perfil com Fabric e mods de performance compativeis para a versao atual do servidor.
        </p>
        <div class="quickplay-links">
          <v-btn text class="quickplay-link" @click="openExternal('https://www.brasilcraft.net')">
            Site oficial
          </v-btn>
          <v-btn text class="quickplay-link" @click="openExternal('https://discord.com/invite/pzzfBB5f4H')">
            Discord
          </v-btn>
        </div>
      </div>

      <div class="quickplay-status">
        <img :src="logo" alt="Brasilcraft" class="quickplay-logo" />
        <div class="quickplay-status-card">
          <span class="quickplay-status-label">Servidor</span>
          <strong class="quickplay-status-host">jogarbrasilcraft.com</strong>
          <span class="quickplay-status-online">{{ onlineLabel }}</span>
        </div>
      </div>
    </div>

    <article class="quickplay-card" :class="{ active: currentPath === profilePath }">
      <div class="quickplay-card-top">
        <div>
          <p class="quickplay-card-tag">Fabric + performance</p>
          <h3 class="quickplay-card-title">Brasilcraft Oficial</h3>
          <p class="quickplay-card-description">
            Perfil unico com ajustes focados em desempenho e compatibilidade. Sem minimapa, sem mods de vantagem e sem criar perfis extras automaticamente.
          </p>
        </div>
        <span class="quickplay-version">Minecraft 1.21.11</span>
      </div>

      <div class="quickplay-meta">
        <div class="quickplay-meta-item">
          <span class="quickplay-meta-label">Versao</span>
          <strong>1.21.11</strong>
        </div>
        <div class="quickplay-meta-item">
          <span class="quickplay-meta-label">Loader</span>
          <strong>Fabric</strong>
        </div>
        <div class="quickplay-meta-item">
          <span class="quickplay-meta-label">Status</span>
          <strong>{{ onlineLabel }}</strong>
        </div>
      </div>

      <ul class="quickplay-list">
        <li>Sodium</li>
        <li>Lithium</li>
        <li>FerriteCore</li>
        <li>EntityCulling</li>
        <li>ImmediatelyFast</li>
        <li>Fabric API</li>
      </ul>

      <div class="quickplay-actions">
        <v-btn outlined class="quickplay-secondary" @click="selectProfile">
          {{ currentPath === profilePath ? 'Selecionado' : 'Selecionar' }}
        </v-btn>
        <v-btn class="quickplay-primary" :loading="busy" @click="onPrimaryAction">
          Preparar e jogar
        </v-btn>
      </div>
    </article>
  </section>
</template>

<script lang="ts" setup>
import logo from '@/assets/logobrasilcraft.webp'
import { useService } from '@/composables'
import { kInstanceLaunch } from '@/composables/instanceLaunch'
import { useInstanceModLoaderDefault } from '@/composables/instanceModLoaderDefault'
import { kInstanceVersionInstall } from '@/composables/instanceVersionInstall'
import { kInstances } from '@/composables/instances'
import { useNotifier } from '@/composables/notifier'
import { useServerStatus } from '@/composables/serverStatus'
import { clientModrinthV2 } from '@/util/clients'
import { injection } from '@/util/inject'
import { InstanceServiceKey, InstanceModsServiceKey, MarketType } from '@xmcl/runtime-api'
import type { RuntimeVersions } from '@xmcl/instance'
import type { Project, ProjectVersion } from '@xmcl/modrinth'
import { useLocalStorage } from '@vueuse/core'

type OfficialMod = {
  slug: string
  required: boolean
}

type ResolvedOfficialMod = {
  project: Project
  version: ProjectVersion
}

const OFFICIAL_PROFILE_ID = 'brasilcraft-official'
const OFFICIAL_PROFILE_NAME = 'Brasilcraft Oficial'
const OFFICIAL_SERVER = {
  host: 'jogarbrasilcraft.com',
  port: 25565,
}
const OFFICIAL_RUNTIME: RuntimeVersions = {
  minecraft: '1.21.11',
  forge: '',
  fabricLoader: '0.18.4',
  quiltLoader: '',
  neoForged: '',
  optifine: '',
  labyMod: '',
}
const OFFICIAL_MODS: OfficialMod[] = [
  { slug: 'fabric-api', required: true },
  { slug: 'sodium', required: true },
  { slug: 'lithium', required: true },
  { slug: 'ferrite-core', required: true },
  { slug: 'entityculling', required: true },
  { slug: 'immediatelyfast', required: false },
]

const profilePath = ref('')
const busy = ref(false)
const resolvedModsPromise = shallowRef<Promise<ResolvedOfficialMod[]> | undefined>()
const officialProfileBootstrapped = useLocalStorage('brasilcraftOfficialProfileBootstrapped', false)

const { acquireInstanceById, editInstance } = useService(InstanceServiceKey)
const { installFromMarket, watch: watchInstalledMods } = useService(InstanceModsServiceKey)
const { selectedInstance, instances } = injection(kInstances)
const { launch } = injection(kInstanceLaunch)
const { fix, instruction } = injection(kInstanceVersionInstall)
const installDefaultModLoader = useInstanceModLoaderDefault()
const { notify } = useNotifier()

const { status, refresh } = useServerStatus(ref({ ...OFFICIAL_SERVER }), ref(undefined))

const currentPath = computed(() => selectedInstance.value)
const launcherInstances = computed(() => instances.value)
const onlineLabel = computed(() => {
  if (status.value.players.online >= 0 && status.value.players.max >= 0) {
    return `${status.value.players.online}/${status.value.players.max} online`
  }
  if (typeof status.value.description === 'string' && status.value.description) {
    return status.value.description
  }
  return 'Status indisponivel'
})

async function resolveFabricLoaderVersion() {
  const response = await fetch(`https://meta.fabricmc.net/v2/versions/loader/${OFFICIAL_RUNTIME.minecraft}`)
  if (!response.ok) {
    throw new Error('Nao foi possivel consultar a versao do Fabric Loader.')
  }

  const versions = await response.json() as Array<{ loader: { version: string }; stable: boolean }>
  const stable = versions.find(version => version.stable)
  const resolved = stable ?? versions[0]

  if (!resolved?.loader?.version) {
    throw new Error('Nenhuma versao compativel do Fabric Loader foi encontrada.')
  }

  return resolved.loader.version
}

function findExistingProfilePath() {
  const byExactName = launcherInstances.value.find(instance => instance.name === OFFICIAL_PROFILE_NAME)
  if (byExactName) {
    return byExactName.path
  }

  const byServer = launcherInstances.value.find(instance =>
    instance.server?.host === OFFICIAL_SERVER.host &&
    instance.server?.port === OFFICIAL_SERVER.port &&
    instance.runtime.minecraft === OFFICIAL_RUNTIME.minecraft)
  if (byServer) {
    return byServer.path
  }

  const byLegacyId = launcherInstances.value.find(instance =>
    instance.path.endsWith(`\\${OFFICIAL_PROFILE_ID}`) || instance.path.endsWith(`/${OFFICIAL_PROFILE_ID}`))
  if (byLegacyId) {
    return byLegacyId.path
  }

  return ''
}

async function ensureProfile() {
  const existingPath = findExistingProfilePath()
  if (!existingPath) {
    if (officialProfileBootstrapped.value) {
      notify({
        level: 'warning',
        title: 'Perfil oficial removido',
        body: 'O perfil oficial ja foi apagado anteriormente e nao sera recriado automaticamente.',
      })
      return ''
    }
    return ''
  }

  const path = existingPath

  await editInstance({
    instancePath: path,
    name: OFFICIAL_PROFILE_NAME,
    author: 'Brasilcraft',
    description: 'Perfil oficial com Fabric e mods de performance para o Brasilcraft.',
    url: 'https://www.brasilcraft.net',
    server: { ...OFFICIAL_SERVER },
    runtime: { ...OFFICIAL_RUNTIME },
    hideLauncher: true,
    fastLaunch: true,
  })

  profilePath.value = path
  return path
}

async function bootstrapOfficialProfileOnce() {
  const existingPath = findExistingProfilePath()
  if (existingPath) {
    selectedInstance.value = existingPath
    await nextTick()
    officialProfileBootstrapped.value = true
    profilePath.value = existingPath
    await ensureOfficialRuntime(existingPath)
    await ensureOfficialMods(existingPath)
    return
  }

  if (officialProfileBootstrapped.value) {
    return
  }

  const path = await acquireInstanceById(OFFICIAL_PROFILE_ID)
  await editInstance({
    instancePath: path,
    name: OFFICIAL_PROFILE_NAME,
    author: 'Brasilcraft',
    description: 'Perfil oficial com Fabric e mods de performance para o Brasilcraft.',
    url: 'https://www.brasilcraft.net',
    server: { ...OFFICIAL_SERVER },
    runtime: { ...OFFICIAL_RUNTIME },
    hideLauncher: true,
    fastLaunch: true,
  })

  selectedInstance.value = path
  await nextTick()
  await ensureOfficialRuntime(path)
  await ensureOfficialMods(path)

  officialProfileBootstrapped.value = true
  profilePath.value = path
  if (!selectedInstance.value) {
    selectedInstance.value = path
  }
}

async function selectProfile() {
  const path = profilePath.value || await ensureProfile()
  if (!path) {
    return ''
  }
  selectedInstance.value = path
  await nextTick()
  return path
}

async function resolveOfficialMods() {
  if (!resolvedModsPromise.value) {
    resolvedModsPromise.value = (async () => {
      const resolved = await Promise.all(OFFICIAL_MODS.map(async (mod) => {
        const project = await clientModrinthV2.getProject(mod.slug)
        const versions = await clientModrinthV2.getProjectVersions(project.id, {
          loaders: ['fabric'],
          gameVersions: [OFFICIAL_RUNTIME.minecraft],
        })
        const version = versions.find(v => v.version_type === 'release') || versions[0]
        if (!version) {
          if (mod.required) {
            throw new Error(`Nao foi encontrada uma versao compativel para ${project.title}`)
          }
          return undefined
        }
        return { project, version }
      }))

      return resolved.filter((value): value is ResolvedOfficialMod => !!value)
    })()
  }

  return resolvedModsPromise.value
}

async function ensureOfficialRuntime(path: string) {
  selectedInstance.value = path
  await nextTick()

  let fabricLoader = launcherInstances.value.find(instance => instance.path === path)?.runtime.fabricLoader || ''
  if (!fabricLoader) {
    fabricLoader = await resolveFabricLoaderVersion()
    await editInstance({
      instancePath: path,
      runtime: {
        ...OFFICIAL_RUNTIME,
        fabricLoader,
      },
      version: '',
    })
  }

  const runtimeReady = await installDefaultModLoader(path, {
    ...OFFICIAL_RUNTIME,
    fabricLoader,
  }, ['fabric'])
  if (!runtimeReady) {
    throw new Error('Nao foi possivel configurar o Fabric para o perfil oficial.')
  }

  await nextTick()

  if (instruction.value?.instance === path) {
    await fix()
    await new Promise(resolve => setTimeout(resolve, 120))
  }
}

async function ensureOfficialMods(path: string) {
  const installedState = await watchInstalledMods(path)
  const installedProjectIds = new Set(
    installedState.files
      .map(file => (file as any).metadata?.modrinth?.projectId)
      .filter(Boolean),
  )

  const resolvedMods = await resolveOfficialMods()
  const versionIds = new Map<string, { versionId: string; icon?: string }>()

  for (const mod of resolvedMods) {
    if (!installedProjectIds.has(mod.project.id)) {
      versionIds.set(mod.version.id, {
        versionId: mod.version.id,
        icon: mod.project.icon_url ?? '',
      })
    }
  }

  if (versionIds.size === 0) {
    return
  }

  await installFromMarket({
    market: MarketType.Modrinth,
    version: Array.from(versionIds.values()),
    instancePath: path,
  })
}

async function playProfile() {
  busy.value = true
  try {
    const path = await selectProfile()
    if (!path) {
      return
    }

    await ensureOfficialRuntime(path)
    await ensureOfficialMods(path)

    await new Promise(resolve => setTimeout(resolve, 120))
    await launch()
  } finally {
    busy.value = false
  }
}

async function onPrimaryAction() {
  await playProfile()
}

function openExternal(url: string) {
  window.open(url, 'browser')
}

onMounted(() => {
  bootstrapOfficialProfileOnce().catch(console.error)
  profilePath.value = findExistingProfilePath()
  if (profilePath.value) {
    officialProfileBootstrapped.value = true
  }
  refresh().catch(console.error)
})
</script>

<style scoped>
.quickplay-shell {
  --bc-green: #86f12d;
  --bc-gold: #ffd34b;
  --bc-panel: rgba(10, 18, 8, 0.78);
  margin: 0 0 1.5rem;
  padding: 1.5rem;
  border-radius: 28px;
  border: 1px solid rgba(134, 241, 45, 0.24);
  background:
    radial-gradient(circle at top left, rgba(255, 211, 75, 0.2), transparent 28%),
    radial-gradient(circle at top right, rgba(78, 230, 31, 0.22), transparent 30%),
    linear-gradient(145deg, rgba(23, 33, 12, 0.96), rgba(11, 17, 9, 0.92));
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.32);
}

.quickplay-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(280px, 0.9fr);
  gap: 1.5rem;
  align-items: center;
  margin-bottom: 1.5rem;
}

.quickplay-kicker {
  margin: 0 0 0.4rem;
  font-size: 0.82rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(255, 211, 75, 0.9);
}

.quickplay-title {
  margin: 0;
  font-size: clamp(2rem, 4vw, 3.2rem);
  line-height: 0.95;
  color: #fff6cc;
}

.quickplay-subtitle {
  max-width: 40rem;
  margin: 0.9rem 0 0;
  font-size: 1rem;
  line-height: 1.65;
  color: rgba(241, 247, 230, 0.86);
}

.quickplay-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1.1rem;
}

.quickplay-link {
  border-radius: 999px;
  color: var(--bc-gold) !important;
  background: rgba(255, 211, 75, 0.08);
}

.quickplay-status {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
}

.quickplay-logo {
  width: 110px;
  filter: drop-shadow(0 0 24px rgba(134, 241, 45, 0.3));
}

.quickplay-status-card {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 220px;
  padding: 1rem 1.1rem;
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.04));
  border: 1px solid rgba(255, 255, 255, 0.09);
}

.quickplay-status-label,
.quickplay-meta-label,
.quickplay-card-tag {
  font-size: 0.78rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 211, 75, 0.82);
}

.quickplay-status-host {
  font-size: 1.2rem;
  color: #fefefe;
}

.quickplay-status-online {
  color: rgba(217, 255, 191, 0.86);
}

.quickplay-card {
  padding: 1.35rem;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.05), transparent),
    var(--bc-panel);
  transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}

.quickplay-card:hover,
.quickplay-card.active {
  transform: translateY(-3px);
  border-color: rgba(134, 241, 45, 0.45);
  box-shadow: 0 16px 42px rgba(78, 230, 31, 0.16);
}

.quickplay-card-top {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.quickplay-card-title {
  margin: 0.2rem 0 0;
  font-size: 1.8rem;
  color: #fff7d2;
}

.quickplay-card-description {
  margin: 0.7rem 0 0;
  max-width: 44rem;
  line-height: 1.65;
  color: rgba(234, 239, 221, 0.82);
}

.quickplay-version {
  align-self: flex-start;
  padding: 0.55rem 0.85rem;
  border-radius: 999px;
  color: #102200;
  background: linear-gradient(135deg, var(--bc-gold), #ffe993);
  font-weight: 700;
}

.quickplay-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.8rem;
  margin-top: 1.2rem;
}

.quickplay-meta-item {
  padding: 0.9rem 1rem;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.quickplay-meta-item strong {
  display: block;
  margin-top: 0.35rem;
  color: #f7f7f7;
}

.quickplay-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.7rem;
  margin: 1.2rem 0 0;
  padding: 0;
  list-style: none;
}

.quickplay-list li {
  padding: 0.85rem 0.95rem;
  border-radius: 16px;
  color: #f4f8eb;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.quickplay-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.25rem;
}

.quickplay-secondary,
.quickplay-primary {
  border-radius: 16px;
}

.quickplay-secondary {
  color: #fff3bf !important;
  border-color: rgba(255, 211, 75, 0.42) !important;
}

.quickplay-primary {
  color: #122400 !important;
  background: linear-gradient(135deg, #b7ff66, #ffd34b) !important;
  font-weight: 700;
}

@media (max-width: 960px) {
  .quickplay-hero {
    grid-template-columns: 1fr;
  }

  .quickplay-status {
    justify-content: flex-start;
  }

  .quickplay-card-top {
    flex-direction: column;
  }
}

@media (max-width: 640px) {
  .quickplay-shell {
    padding: 1.1rem;
  }

  .quickplay-status {
    flex-direction: column;
    align-items: flex-start;
  }

  .quickplay-logo {
    width: 88px;
  }

  .quickplay-status-card {
    min-width: 100%;
  }

  .quickplay-actions {
    flex-direction: column;
  }
}
</style>
