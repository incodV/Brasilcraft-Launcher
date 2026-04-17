import { useEventBus, useLocalStorage } from '@vueuse/core'
import type { EditInstanceOptions, Instance, InstanceDataWithTime } from '@xmcl/instance'
import { InstanceServiceKey, InstanceState } from '@xmcl/runtime-api'
import { InjectionKey } from 'vue'
import filenamify from 'filenamify'
import { useService } from './service'
import { useState } from './syncableState'
import { InstanceOrGroupData } from './instanceGroup'

export const kInstances: InjectionKey<ReturnType<typeof useInstances>> = Symbol('Instances')

const BRASILCRAFT_SERVER = {
  host: 'jogarbrasilcraft.com',
  port: 25565,
}

type BrasilcraftProfileDefault = {
  id: string
  name: string
  author: string
  description: string
  url: string
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
  hideLauncher: boolean
  fastLaunch: boolean
  preserveRuntime?: boolean
}

const BRASILCRAFT_PROFILE_DEFAULTS: BrasilcraftProfileDefault[] = [
  {
    id: 'brasilcraft-minigames',
    name: 'Brasilcraft Minigames',
    author: 'Brasilcraft',
    description: 'Perfil rapido dos Minigames Brasilcraft',
    url: 'https://www.brasilcraft.net',
    runtime: {
      minecraft: '1.8',
      forge: '',
      fabricLoader: '',
      quiltLoader: '',
      neoForged: '',
      optifine: '',
      labyMod: '',
    },
    server: BRASILCRAFT_SERVER,
    hideLauncher: true,
    fastLaunch: true,
  },
  {
    id: 'brasilcraft-survival',
    name: 'Brasilcraft Survival',
    author: 'Brasilcraft',
    description: 'Perfil rapido do Survival Brasilcraft',
    url: 'https://www.brasilcraft.net',
    runtime: {
      minecraft: '1.21.11',
      forge: '',
      fabricLoader: '',
      quiltLoader: '',
      neoForged: '',
      optifine: '',
      labyMod: '',
    },
    server: BRASILCRAFT_SERVER,
    hideLauncher: true,
    fastLaunch: true,
  },
]

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
  const _profilesBootstrapped = useLocalStorage('brasilcraftProfilesBootstrapped', false)
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

  function getManagedProfilePath(name: string) {
    const firstInstance = state.value?.instances[0]
    if (!firstInstance) return ''

    const separatorIndex = Math.max(firstInstance.path.lastIndexOf('/'), firstInstance.path.lastIndexOf('\\'))
    if (separatorIndex === -1) return ''

    const root = firstInstance.path.slice(0, separatorIndex)
    return `${root}\\${filenamify(name, { replacement: '_' })}`
  }

  function findBrasilcraftProfilePath(profile: BrasilcraftProfileDefault) {
    const allInstances = state.value?.instances ?? []
    const managedPath = getManagedProfilePath(profile.name)
    if (managedPath && state.value?.all[managedPath]) {
      return managedPath
    }

    const byName = allInstances.find(instance => instance.name === profile.name)
    if (byName) {
      return byName.path
    }

    const legacyPath = allInstances.find(instance =>
      instance.path.endsWith(`\\${profile.id}`) || instance.path.endsWith(`/${profile.id}`))
    if (legacyPath) {
      return legacyPath.path
    }

    return ''
  }

  async function ensureBrasilcraftProfile(profile: BrasilcraftProfileDefault) {
    const existingPath = findBrasilcraftProfilePath(profile)
    const instancePath = existingPath || await acquireInstanceById(profile.id)
    const currentInstance = state.value?.all[instancePath]
    const shouldPreserveRuntime = profile.preserveRuntime && currentInstance?.runtime?.minecraft

    await editInstance({
      instancePath,
      name: profile.name,
      author: profile.author,
      description: profile.description,
      url: profile.url,
      server: { ...profile.server },
      runtime: shouldPreserveRuntime ? { ...currentInstance.runtime } : { ...profile.runtime },
      hideLauncher: profile.hideLauncher,
      fastLaunch: profile.fastLaunch,
    })

    return instancePath
  }

  async function ensureBrasilcraftProfiles() {
    const paths = await Promise.all(BRASILCRAFT_PROFILE_DEFAULTS.map(ensureBrasilcraftProfile))
    return {
      minigames: paths[0],
      survival: paths[1],
    }
  }

  async function createDefaultBrasilcraftInstance() {
    const profiles = await ensureBrasilcraftProfiles()
    _profilesBootstrapped.value = true
    return profiles.survival
  }
  async function remove(instancePath: string, deleteData = true) {
    const index = instances.value.findIndex(i => i.path === instancePath)
    const lastSelected = path.value
    await deleteInstance(instancePath, deleteData)
    if (instancePath === lastSelected) {
      path.value = instances.value[Math.max(index - 1, 0)]?.path ?? ''
    }
  }
  watch(state, async (newVal, oldVal) => {
    if (!newVal) return
    if (!oldVal) {
      const instances = [...state.value?.instances ?? newVal.instances]
      const lastSelectedPath = _path.value

      const selectDefault = async () => {
        // Select the first instance
        let defaultPath = instances[0]?.path as string | undefined
        if (!defaultPath && !_profilesBootstrapped.value) {
          // Create a default instance
          defaultPath = await createDefaultBrasilcraftInstance()
        }
        _path.value = defaultPath ?? ''
        if (defaultPath) {
          _profilesBootstrapped.value = true
        }
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
