import { useExternalRoute, useI18nSync } from '@/composables'
import { kCriticalStatus, useCriticalStatus } from '@/composables/criticalStatus'
import { kCurseforgeCategories, useCurseforgeCategories } from '@/composables/curseforge'
import { kDropHandler, useDropHandler } from '@/composables/dropHandler'
import { kEnvironment, useEnvironment } from '@/composables/environment'
import { kImageDialog, useImageDialog } from '@/composables/imageDialog'
import { kInstance, useInstance } from '@/composables/instance'
import { kInstanceDefaultSource, useInstanceDefaultSource } from '@/composables/instanceDefaultSource'
import { kInstanceFiles, useInstanceFiles } from '@/composables/instanceFiles'
import { kInstanceJava, useInstanceJava } from '@/composables/instanceJava'
import { kInstanceJavaDiagnose, useInstanceJavaDiagnose } from '@/composables/instanceJavaDiagnose'
import { kInstanceLaunch, useInstanceLaunch } from '@/composables/instanceLaunch'
import { kInstanceModsContext, useInstanceMods } from '@/composables/instanceMods'
import { kInstanceOptions, useInstanceOptions } from '@/composables/instanceOptions'
import { kInstanceResourcePacks, useInstanceResourcePacks } from '@/composables/instanceResourcePack'
import { kInstanceSave, useInstanceSaves } from '@/composables/instanceSave'
import { kInstanceShaderPacks, useInstanceShaderPacks } from '@/composables/instanceShaderPack'
import { kInstanceTheme, useInstanceTheme } from '@/composables/instanceTheme'
import { kInstanceVersion, useInstanceVersion } from '@/composables/instanceVersion'
import { kInstanceVersionInstall, useInstanceVersionInstallInstruction } from '@/composables/instanceVersionInstall'
import { kInstances, useInstances } from '@/composables/instances'
import { kJavaContext, useJavaContext } from '@/composables/java'
import { kLaunchTask, useLaunchTask } from '@/composables/launchTask'
import { kModDependenciesCheck, useModDependenciesCheck } from '@/composables/modDependenciesCheck'
import { kModLibCleaner, useModLibCleaner } from '@/composables/modLibCleaner'
import { kModsSearch, useModsSearch } from '@/composables/modSearch'
import { kModUpgrade, useModUpgrade } from '@/composables/modUpgrade'
import { kModpackExport, useModpackExport } from '@/composables/modpack'
import { kModrinthTags, useModrinthTags } from '@/composables/modrinth'
import { kModrinthAuthenticatedAPI, useModrinthAuthenticatedAPI } from '@/composables/modrinthAuthenticatedAPI'
import { kPeerShared, usePeerConnections } from '@/composables/peers'
import { kResourcePackSearch, useResourcePackSearch } from '@/composables/resourcePackSearch'
import { kSaveSearch, useSavesSearch } from '@/composables/savesSearch'
import { kSearchModel, useSearchModel } from '@/composables/search'
import { kServerStatusCache, useServerStatusCache } from '@/composables/serverStatus'
import { kSettingsState, useSettingsState } from '@/composables/setting'
import { kShaderPackSearch, useShaderPackSearch } from '@/composables/shaderPackSearch'
import { useTelemetryTrack } from '@/composables/telemetryTrack'
import { BackgroundType, UIThemeDataV1, kTheme, useTheme } from '@/composables/theme'
import { kTutorial, useTutorialModel } from '@/composables/tutorial'

import { kNetworkStatus, useNetworkStatus } from '@/composables/useNetworkStatus'
import { kUserContext, useUserContext } from '@/composables/user'
import { kLatestMinecraftVersion, useMinecraftLatestRelease } from '@/composables/version'
import { kLocalVersions, useLocalVersions } from '@/composables/versionLocal'
import { kSupportedAuthorityMetadata, useSupportedAuthority } from '@/composables/yggrasil'
import { vuetify } from '@/vuetify'
import 'virtual:uno.css'
import { provide } from 'vue'

export default defineComponent({
  setup(props, ctx) {
    const brasilcraftTheme = ref<UIThemeDataV1>({
      dark: true,
      backgroundMusic: [],
      backgroundMusicPlayOrder: 'sequential',
      backgroundImage: undefined,
      backgroundImageDark: undefined,
      backgroundColorOverlay: true,
      backgroundVolume: 0,
      backgroundImageFit: 'cover',
      backgroundType: BackgroundType.NONE,
      font: undefined,
      fontSize: 16,
      particleMode: undefined,
      blur: {
        background: 2,
        card: 20,
        appBar: 6,
        sideBar: 8,
      },
      colors: {
        lightAppBarColor: '#10200FFF',
        lightSideBarColor: '#142613F0',
        darkAppBarColor: '#081207F2',
        darkSideBarColor: '#0D180CF0',
        darkPrimaryColor: '#2F8F1E',
        darkBackground: '#0710068F',
        darkInfoColor: '#E0B93F',
        darkErrorColor: '#FF6B57',
        darkWarningColor: '#F5A90A',
        darkSuccessColor: '#2F8F1E',
        darkAccentColor: '#FFD34B',
        darkCardColor: '#111D12CC',
        lightPrimaryColor: '#2F8F1E',
        lightBackground: '#EFF6D8FF',
        lightInfoColor: '#B8860B',
        lightErrorColor: '#D94D39',
        lightWarningColor: '#C98909',
        lightSuccessColor: '#2F8F1E',
        lightAccentColor: '#E0B93F',
        lightCardColor: '#F4F3D8D9',
      },
    })

    provide(kServerStatusCache, useServerStatusCache())

    provide(kDropHandler, useDropHandler())

    const user = useUserContext()
    const java = useJavaContext()
    const localVersions = useLocalVersions()
    const instances = useInstances()
    const instance = useInstance(instances.selectedInstance, instances.instances)
    provide(kPeerShared, usePeerConnections())

    const settings = useSettingsState()
    const instanceVersion = useInstanceVersion(instance.instance, localVersions.versions, localVersions.servers)
    const instanceJava = useInstanceJava(instance.instance, instanceVersion.resolvedVersion, java.all)
    provide(kInstanceJavaDiagnose, useInstanceJavaDiagnose(instanceJava))
    const instanceDefaultSource = useInstanceDefaultSource(instance.path)
    const options = useInstanceOptions(instance.path)
    const saves = useInstanceSaves(instance.path)
    const resourcePacks = useInstanceResourcePacks(instance.path, options.gameOptions)
    const instanceMods = useInstanceMods(instance.path, instance.runtime, instanceJava.java)
    const shaderPacks = useInstanceShaderPacks(instance.path, instance.runtime, instanceMods.mods, options.gameOptions)
    const files = useInstanceFiles(instance.path)
    const task = useLaunchTask(instance.path, instance.runtime, instanceVersion.versionId)
    const instanceLaunch = useInstanceLaunch(instance.instance, instanceVersion.versionId, instanceVersion.serverVersionId, instanceJava.java, user.userProfile, settings, instanceMods.mods)

    const modrinthAPI = useModrinthAuthenticatedAPI()
    provide(kModrinthAuthenticatedAPI, modrinthAPI)
    const searchModel = useSearchModel(instance.runtime)
    provide(kSearchModel, searchModel)
    const modsSearch = useModsSearch(instance.path, instance.runtime, instanceMods.mods, instanceMods.isValidating, settings.state, modrinthAPI, searchModel)
    const modUpgrade = useModUpgrade(instance.path, instance.runtime, instanceMods.mods)

    const resourcePackSearch = useResourcePackSearch(resourcePacks.enabled, resourcePacks.disabled, modrinthAPI, searchModel)
    const shaderPackSearch = useShaderPackSearch(shaderPacks.shaderPacks, modrinthAPI, searchModel)

    const install = useInstanceVersionInstallInstruction(instance.path, instance.instances, instanceVersion.resolvedVersion, instanceVersion.refreshResolvedVersion, localVersions.versions, localVersions.servers, java.all, java.refresh)

    useTelemetryTrack(settings.state)

    provide(kCriticalStatus, useCriticalStatus(settings.state))

    provide(kLatestMinecraftVersion, useMinecraftLatestRelease())
    provide(kUserContext, user)
    provide(kJavaContext, java)
    provide(kSettingsState, settings)
    provide(kInstances, instances)
    provide(kInstance, instance)
    provide(kLocalVersions, localVersions)
    provide(kInstanceLaunch, instanceLaunch)

    provide(kInstanceVersion, instanceVersion)
    provide(kInstanceDefaultSource, instanceDefaultSource)
    provide(kInstanceJava, instanceJava)
    provide(kInstanceOptions, options)
    provide(kInstanceSave, saves)
    provide(kInstanceResourcePacks, resourcePacks)
    provide(kInstanceModsContext, instanceMods)
    provide(kInstanceFiles, files)
    provide(kLaunchTask, task)

    provide(kInstanceVersionInstall, install)

    provide(kInstanceShaderPacks, shaderPacks)
    provide(kResourcePackSearch, resourcePackSearch)
    provide(kShaderPackSearch, shaderPackSearch)
    provide(kModsSearch, modsSearch)
    provide(kModDependenciesCheck, useModDependenciesCheck(instance.path, instance.runtime, instanceMods.mods, instanceVersion.refreshResolvedVersion))
    provide(kModLibCleaner, useModLibCleaner(instanceMods.mods, instanceMods.allowLoaders))
    provide(kSaveSearch, useSavesSearch(saves.saves, saves.sharedSaves, searchModel))
    provide(kModUpgrade, modUpgrade)
    provide(kEnvironment, useEnvironment())

    const instanceTheme = useInstanceTheme(instance.path)
    provide(kInstanceTheme, instanceTheme)
    provide(kTheme, useTheme(brasilcraftTheme, vuetify.framework))


    useI18nSync(vuetify.framework, settings.state)

    const router = useRouter()
    useExternalRoute(router)

    provide(kImageDialog, useImageDialog())
    provide(kSupportedAuthorityMetadata, useSupportedAuthority())
    provide(kTutorial, useTutorialModel())
    provide(kModrinthTags, useModrinthTags())
    provide(kCurseforgeCategories, useCurseforgeCategories())
    provide(kModpackExport, useModpackExport())
    provide(kNetworkStatus, useNetworkStatus())

    return () => ctx.slots.default?.()
  },
})
