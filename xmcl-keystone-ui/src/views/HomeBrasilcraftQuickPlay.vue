<template>
  <section class="quickplay-shell">
    <div class="quickplay-hero">
      <div class="quickplay-copy">
        <p class="quickplay-kicker">Brasilcraft Launcher</p>
        <h2 class="quickplay-title">Entrar e jogar</h2>
        <p class="quickplay-subtitle">
          Escolha seu modo, deixe o launcher preparar a versao certa e entre no servidor com um clique.
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

    <div class="quickplay-grid">
      <article
        v-for="profile in profiles"
        :key="profile.id"
        class="quickplay-card"
        :class="{ active: currentPath === profilePaths[profile.id] }"
      >
        <div class="quickplay-card-top">
          <div>
            <p class="quickplay-card-tag">{{ profile.tag }}</p>
            <h3 class="quickplay-card-title">{{ profile.name }}</h3>
            <p class="quickplay-card-description">{{ profile.description }}</p>
          </div>
          <span class="quickplay-version">{{ profile.versionLabel }}</span>
        </div>

        <div class="quickplay-meta">
          <div class="quickplay-meta-item">
            <span class="quickplay-meta-label">Versao</span>
            <strong>{{ profile.runtime.minecraft }}</strong>
          </div>
          <div class="quickplay-meta-item">
            <span class="quickplay-meta-label">Servidor</span>
            <strong>{{ profile.server.host }}</strong>
          </div>
          <div class="quickplay-meta-item">
            <span class="quickplay-meta-label">Status</span>
            <strong>{{ onlineLabel }}</strong>
          </div>
        </div>

        <div class="quickplay-actions">
          <v-btn outlined class="quickplay-secondary" @click="selectProfile(profile)">
            {{ currentPath === profilePaths[profile.id] ? 'Selecionado' : 'Selecionar' }}
          </v-btn>
          <v-btn
            class="quickplay-primary"
            :loading="busyProfileId === profile.id"
            @click="onPrimaryAction(profile)"
          >
            {{ profile.action === 'configure' ? 'Escolher versao' : 'Jogar agora' }}
          </v-btn>
        </div>
      </article>
    </div>
  </section>
</template>

<script lang="ts" setup>
import logo from '@/assets/logobrasilcraft.webp'
import { useService } from '@/composables'
import { kInstanceLaunch } from '@/composables/instanceLaunch'
import { kInstanceVersionInstall } from '@/composables/instanceVersionInstall'
import { kInstances } from '@/composables/instances'
import { useServerStatus } from '@/composables/serverStatus'
import { injection } from '@/util/inject'
import { useLocalStorage } from '@vueuse/core'
import { InstanceServiceKey } from '@xmcl/runtime-api'
import filenamify from 'filenamify'

type QuickPlayProfile = {
  id: string
  tag: string
  name: string
  description: string
  versionLabel: string
  action: 'launch'
  runtime: {
    minecraft: string
    forge: string
    fabricLoader: string
    quiltLoader: string
    neoForged: string
    optifine: string
    labyMod: string
  }
  server: {
    host: string
    port: number
  }
}

const profiles: QuickPlayProfile[] = [
  {
    id: 'brasilcraft-minigames',
    tag: 'PvP rapido',
    name: 'Minigames',
    description: 'Perfil focado na jogabilidade classica e veloz da linha 1.8.',
    versionLabel: 'Minecraft 1.8',
    action: 'launch',
    runtime: {
      minecraft: '1.8',
      forge: '',
      fabricLoader: '',
      quiltLoader: '',
      neoForged: '',
      optifine: '',
      labyMod: '',
    },
    server: {
      host: 'jogarbrasilcraft.com',
      port: 25565,
    },
  },
  {
    id: 'brasilcraft-survival',
    tag: 'Modo principal',
    name: 'Survival',
    description: 'Perfil pronto para o survival atual do servidor, com entrada direta.',
    versionLabel: 'Minecraft 1.21.11',
    action: 'launch',
    runtime: {
      minecraft: '1.21.11',
      forge: '',
      fabricLoader: '',
      quiltLoader: '',
      neoForged: '',
      optifine: '',
      labyMod: '',
    },
    server: {
      host: 'jogarbrasilcraft.com',
      port: 25565,
    },
  },
]

const profilePaths = reactive<Record<string, string>>({})
const busyProfileId = ref('')

const { acquireInstanceById, editInstance } = useService(InstanceServiceKey)
const { selectedInstance, instances } = injection(kInstances)
const { launch } = injection(kInstanceLaunch)
const { fix, instruction } = injection(kInstanceVersionInstall)

const { status, refresh } = useServerStatus(ref({ host: 'jogarbrasilcraft.com', port: 25565 }), ref(undefined))
const profilesBootstrapped = useLocalStorage('brasilcraftProfilesBootstrapped', false)

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

function getManagedProfilePath(name: string) {
  const firstInstance = launcherInstances.value[0]
  if (!firstInstance) return ''

  const separatorIndex = Math.max(firstInstance.path.lastIndexOf('/'), firstInstance.path.lastIndexOf('\\'))
  if (separatorIndex === -1) return ''

  const root = firstInstance.path.slice(0, separatorIndex)
  return `${root}\\${filenamify(name, { replacement: '_' })}`
}

function findExistingProfilePath(profile: QuickPlayProfile) {
  const expectedName = `Brasilcraft ${profile.name}`
  const managedPath = getManagedProfilePath(expectedName)
  if (managedPath && launcherInstances.value.some(instance => instance.path === managedPath)) {
    return managedPath
  }

  const byName = launcherInstances.value.find(instance => instance.name === expectedName)
  if (byName) {
    return byName.path
  }

  const legacyPath = launcherInstances.value.find(instance =>
    instance.path.endsWith(`\\${profile.id}`) || instance.path.endsWith(`/${profile.id}`))
  if (legacyPath) {
    return legacyPath.path
  }

  return ''
}

async function ensureProfile(profile: QuickPlayProfile) {
  const existingPath = findExistingProfilePath(profile)
  if (!existingPath && profilesBootstrapped.value) {
    return ''
  }

  const path = existingPath || await acquireInstanceById(profile.id)
  profilePaths[profile.id] = path
  await editInstance({
    instancePath: path,
    name: `Brasilcraft ${profile.name}`,
    author: 'Brasilcraft',
    description: profile.description,
    url: 'https://www.brasilcraft.net',
    server: { ...profile.server },
    runtime: { ...profile.runtime },
    hideLauncher: true,
    fastLaunch: true,
  })
  profilesBootstrapped.value = true
  return path
}

async function ensureProfiles() {
  for (const profile of profiles) {
    const path = findExistingProfilePath(profile)
    if (path) {
      profilePaths[profile.id] = path
    }
  }
}

async function selectProfile(profile: QuickPlayProfile) {
  const path = profilePaths[profile.id] || await ensureProfile(profile)
  if (!path) {
    return ''
  }
  selectedInstance.value = path
  await nextTick()
  return path
}

async function playProfile(profile: QuickPlayProfile) {
  busyProfileId.value = profile.id
  try {
    const path = await selectProfile(profile)
    if (!path) {
      return
    }
    await new Promise(resolve => setTimeout(resolve, 80))
    if (instruction.value?.instance === path) {
      await fix()
      await new Promise(resolve => setTimeout(resolve, 80))
    }
    await launch()
  } finally {
    busyProfileId.value = ''
  }
}

async function onPrimaryAction(profile: QuickPlayProfile) {
  await playProfile(profile)
}

function openExternal(url: string) {
  window.open(url, 'browser')
}

onMounted(() => {
  ensureProfiles().catch(console.error)
  refresh().catch(console.error)
})
</script>

<style scoped>
.quickplay-shell {
  --bc-green: #86f12d;
  --bc-gold: #ffd34b;
  --bc-gold-deep: #f5a90a;
  --bc-panel: rgba(10, 18, 8, 0.78);
  --bc-panel-soft: rgba(255, 255, 255, 0.06);
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
  font-size: clamp(2rem, 4vw, 3.4rem);
  line-height: 0.95;
  color: #fff6cc;
}

.quickplay-subtitle {
  max-width: 38rem;
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

.quickplay-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.quickplay-card {
  padding: 1.25rem;
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
  font-size: 1.7rem;
  color: #fff9de;
}

.quickplay-card-description {
  margin: 0.55rem 0 0;
  max-width: 32rem;
  line-height: 1.6;
  color: rgba(238, 245, 226, 0.82);
}

.quickplay-version {
  flex-shrink: 0;
  align-self: flex-start;
  padding: 0.5rem 0.8rem;
  border-radius: 999px;
  color: #1c1c0d;
  background: linear-gradient(135deg, var(--bc-gold), var(--bc-gold-deep));
  font-weight: 700;
}

.quickplay-meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
}

.quickplay-meta-item {
  padding: 0.9rem;
  border-radius: 18px;
  background: var(--bc-panel-soft);
}

.quickplay-meta-item strong {
  display: block;
  margin-top: 0.35rem;
  color: #fcfff3;
}

.quickplay-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}

.quickplay-secondary,
.quickplay-primary {
  flex: 1;
  min-height: 48px;
  border-radius: 16px;
  font-weight: 700;
}

.quickplay-secondary {
  border-color: rgba(255, 211, 75, 0.45) !important;
  color: var(--bc-gold) !important;
}

.quickplay-primary {
  color: #132306 !important;
  background: linear-gradient(135deg, var(--bc-green), var(--bc-gold)) !important;
  box-shadow: 0 14px 28px rgba(134, 241, 45, 0.22);
}

@media (max-width: 1100px) {
  .quickplay-hero {
    grid-template-columns: 1fr;
  }

  .quickplay-status {
    justify-content: flex-start;
  }
}

@media (max-width: 700px) {
  .quickplay-shell {
    padding: 1rem;
    border-radius: 22px;
  }

  .quickplay-status {
    flex-direction: column;
    align-items: flex-start;
  }

  .quickplay-logo {
    width: 86px;
  }

  .quickplay-meta {
    grid-template-columns: 1fr;
  }

  .quickplay-actions {
    flex-direction: column;
  }
}
</style>
