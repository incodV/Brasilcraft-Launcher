import { useEventBus, useLocalStorage } from '@vueuse/core'
import type { EditInstanceOptions, Instance, InstanceDataWithTime } from '@xmcl/instance'
import { InstanceServiceKey, InstanceState } from '@xmcl/runtime-api'
import { InjectionKey } from 'vue'
import { useService } from './service'
import { useState } from './syncableState'
import { InstanceOrGroupData } from './instanceGroup'

export const kInstances: InjectionKey<ReturnType<typeof useInstances>> = Symbol('Instances')

const BRASILCRAFT_SERVER = {
  host: 'jogarbrasilcraft.com',
  port: 25565,
}

const BRASILCRAFT_OFFICIAL_PROFILE = {
  id: 'brasilcraft-official',
  name: 'Brasilcraft Oficial',
  author: 'Brasilcraft',
  description: 'Perfil oficial com Fabric e mods de performance para o Brasilcraft.',
  url: 'https://www.brasilcraft.net',
  runtime: {
    minecraft: '1.21.11',
    forge: '',
    fabricLoader: '0.18.4',
    quiltLoader: '',
    neoForged: '',
    optifine: '',
    labyMod: '',
  },
  server: BRASILCRAFT_SERVER,
  hideLauncher: true,
  fastLaunch: true,
} as const

const BRASILCRAFT_LEGACY_PROFILE_IDS = [
  'brasilcraft-minigames',
  'brasilcraft-survival',
] as const

const BRASILCRAFT_LEGACY_PROFILE_NAMES = [
  'Brasilcraft Minigames',
  'Brasilcraft Survival',
] as const

export function isBrasilcraftOfficialProfile(instance: Pick<Instance, 'name' | 'path'> | { name?: string; path?: string } | undefined) {
  if (!instance) return false
  const name = instance.name ?? ''
  const path = instance.path ?? ''
  return name === BRASILCRAFT_OFFICIAL_PROFILE.name ||
    path.endsWith(`\\${BRASILCRAFT_OFFICIAL_PROFILE.id}`) ||
    path.endsWith(`/${BRASILCRAFT_OFFICIAL_PROFILE.id}`) ||
    path.endsWith('\\Brasilcraft Oficial') ||
    path.endsWith('/Brasilcraft Oficial')
}

/**
 * Hook of a view of all instances & some deletion/selection functions
 */
export function useInstances() {
  const { getSharedInstancesState, editInstance, deleteInstance, validateInstancePath, acquireInstanceById } = useService(InstanceServiceKey)
  const { state, isValidating, error } = useState(getSharedInstancesState, class extends InstanceState {
    constructor() {
      super()
      this.all = markRaw({})
      this.instances = markRaw([])
    }

    override instanceRemove(path: string): void {
      delete this.all[path]
      this.instances = markRaw(this.instances.filter(i => i.path !== path))
    }

    override instanceAdd(instance: Instance) {
      if (!this.all[instance.path]) {
        const object = markRaw({
          ...instance,
        })
        this.all[instance.path] = object
        this.instances = markRaw([...this.instances, this.all[instance.path]])
      }
    }

    override instanceEdit(settings: Partial<InstanceDataWithTime> & { path: string }) {
      const inst = this.instances.find(i => i.path === (settings.path))!
      if ('showLog' in settings) {
        inst.showLog = settings.showLog
      }
      if ('hideLauncher' in settings) {
        inst.hideLauncher = settings.hideLauncher
      }
      if ('fastLaunch' in settings) {
        inst.fastLaunch = settings.fastLaunch
      }
      if ('maxMemory' in settings) {
        inst.maxMemory = settings.maxMemory
      }
      if ('minMemory' in settings) {
        inst.minMemory = settings.minMemory
      }
      if ('assignMemory' in settings) {
        inst.assignMemory = settings.assignMemory
      }
      if ('vmOptions' in settings) {
        inst.vmOptions = settings.vmOptions
      }
      if ('mcOptions' in settings) {
        inst.mcOptions = settings.mcOptions
      }
      super.instanceEdit(settings)

      const idx = this.instances.indexOf(inst)
      this.instances = markRaw([...this.instances.slice(0, idx), inst, ...this.instances.slice(idx + 1)])
    }
  })
  const instances = computed(() => state.value?.instances ?? [])
  const _path = useLocalStorage('selectedInstancePath', '' as string)
  const _officialProfileBootstrapped = useLocalStorage('brasilcraftOfficialProfileBootstrapped', false)
  const _officialBootstrapInFlight = ref(false)
  const path = ref('')

  const migrationBus = useEventBus<{ oldRoot: string; newRoot: string }>('migration')

  migrationBus.once((e) => {
    _path.value = _path.value.replace(e.oldRoot, e.newRoot)
  })

  async function edit(options: EditInstanceOptions & { instancePath: string }) {
    await editInstance({
      ...options,
      server: { ...BRASILCRAFT_SERVER },
    })
  }

  async function ensureBrasilcraftServer(instancePath: string) {
    const currentInstance = state.value?.all[instancePath]
    if (!currentInstance) return

    const hasBrasilcraftServer = currentInstance.server?.host === BRASILCRAFT_SERVER.host &&
      currentInstance.server?.port === BRASILCRAFT_SERVER.port

    if (!hasBrasilcraftServer) {
      await editInstance({
        instancePath,
        server: { ...BRASILCRAFT_SERVER },
      })
    }
  }

  async function createOfficialProfileOnce() {
    if (_officialBootstrapInFlight.value) {
      return ''
    }
    _officialBootstrapInFlight.value = true
    const instancePath = await acquireInstanceById(BRASILCRAFT_OFFICIAL_PROFILE.id)
    try {
      await editInstance({
        instancePath,
        name: BRASILCRAFT_OFFICIAL_PROFILE.name,
        author: BRASILCRAFT_OFFICIAL_PROFILE.author,
        description: BRASILCRAFT_OFFICIAL_PROFILE.description,
        url: BRASILCRAFT_OFFICIAL_PROFILE.url,
        server: { ...BRASILCRAFT_OFFICIAL_PROFILE.server },
        runtime: { ...BRASILCRAFT_OFFICIAL_PROFILE.runtime },
        hideLauncher: BRASILCRAFT_OFFICIAL_PROFILE.hideLauncher,
        fastLaunch: BRASILCRAFT_OFFICIAL_PROFILE.fastLaunch,
      })
      _officialProfileBootstrapped.value = true
      return instancePath
    } finally {
      _officialBootstrapInFlight.value = false
    }
  }

  function hasOfficialProfile(allInstances: Instance[]) {
    return allInstances.some(instance =>
      instance.name === BRASILCRAFT_OFFICIAL_PROFILE.name ||
      (instance.server?.host === BRASILCRAFT_SERVER.host &&
        instance.server?.port === BRASILCRAFT_SERVER.port &&
        instance.runtime.minecraft === BRASILCRAFT_OFFICIAL_PROFILE.runtime.minecraft &&
        !!instance.runtime.fabricLoader) ||
      instance.path.endsWith(`\\${BRASILCRAFT_OFFICIAL_PROFILE.id}`) ||
      instance.path.endsWith(`/${BRASILCRAFT_OFFICIAL_PROFILE.id}`))
  }

  async function cleanupLegacyBrasilcraftProfiles(allInstances: Instance[]) {
    const legacyInstances = allInstances.filter((instance) =>
      BRASILCRAFT_LEGACY_PROFILE_NAMES.includes(instance.name as any) ||
      BRASILCRAFT_LEGACY_PROFILE_IDS.some(id =>
        instance.path.endsWith(`\\${id}`) || instance.path.endsWith(`/${id}`)))

    for (const instance of legacyInstances) {
      await deleteInstance(instance.path, true)
    }
  }

  async function remove(instancePath: string, deleteData = true) {
    const target = instances.value.find(i => i.path === instancePath)
    if (isBrasilcraftOfficialProfile(target ?? { path: instancePath })) {
      return
    }
    const index = instances.value.findIndex(i => i.path === instancePath)
    const lastSelected = path.value
    await deleteInstance(instancePath, deleteData)
    if (instancePath === lastSelected) {
      path.value = instances.value[Math.max(index - 1, 0)]?.path ?? ''
    }
  }

  async function ensureOfficialBootstrap(instances: Instance[]) {
    if (_officialProfileBootstrapped.value || _officialBootstrapInFlight.value) {
      return
    }
    if (hasOfficialProfile(instances)) {
      _officialProfileBootstrapped.value = true
      return
    }
    await cleanupLegacyBrasilcraftProfiles(instances)
    const created = await createOfficialProfileOnce()
    if (created && !_path.value) {
      _path.value = created
      path.value = created
    }
  }

  watch(state, async (newVal, oldVal) => {
    if (!newVal) return
    if (!oldVal) {
      const instances = [...state.value?.instances ?? newVal.instances]
      const lastSelectedPath = _path.value

      const selectDefault = async () => {
        let defaultPath = instances[0]?.path as string | undefined
        if (!_officialProfileBootstrapped.value) {
          await ensureOfficialBootstrap(instances)
          defaultPath = [...state.value?.instances ?? instances].find(i => isBrasilcraftOfficialProfile(i))?.path ?? defaultPath
        }
        _path.value = defaultPath ?? ''
      }

      if (lastSelectedPath) {
        // Validate the last selected path
        if (!instances.some(i => i.path === lastSelectedPath)) {
          const badInstance = await validateInstancePath(lastSelectedPath)
          if (badInstance) {
            await selectDefault()
          }
        }
      } else {
        // No selected, try to select the first instance
        await selectDefault()
      }

      path.value = _path.value
    }
  })
  watch(instances, (newInstances) => {
    ensureOfficialBootstrap(newInstances).catch(console.error)
    for (const instance of newInstances) {
      ensureBrasilcraftServer(instance.path).catch(console.error)
    }
  }, { immediate: true })
  watch(path, (newPath) => {
    if (newPath !== _path.value) {
      // save to local storage
      _path.value = newPath
    }
    editInstance({
      instancePath: newPath,
      lastAccessDate: Date.now(),
    })
  })

  const ready = computed(() => state.value !== undefined)
  const groups = computed(() => state.value?.groups ?? [])
  const groupsSet = (groups: InstanceOrGroupData[]) => {
    state.value?.instanceGroupsSet(groups)
  }
  return {
    selectedInstance: path,
    groups,
    groupsSet,
    ready,
    instances,
    isValidating,
    error,
    edit,
    remove,
  }
}
