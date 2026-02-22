import { useOpenInExplorer } from "@/api/hooks/explorer.hooks"
import { useSaveSettings } from "@/api/hooks/settings.hooks"
import { CustomLibraryBanner } from "@/app/(main)/_features/anime-library/_containers/custom-library-banner"
import { __issueReport_overlayOpenAtom } from "@/app/(main)/_features/issue-report/issue-report"
import { useServerDisabledFeatures, useServerStatus, useSetServerStatus } from "@/app/(main)/_hooks/use-server-status"
import { ExternalPlayerLinkSettings, MediaplayerSettings } from "@/app/(main)/settings/_components/mediaplayer-settings"
import { PlaybackSettings } from "@/app/(main)/settings/_components/playback-settings"
import { __settings_tabAtom } from "@/app/(main)/settings/_components/settings-page.atoms"
import { SettingsIsDirty, SettingsSubmitButton } from "@/app/(main)/settings/_components/settings-submit-button"
import { AnimeLibrarySettings } from "@/app/(main)/settings/_containers/anime-library-settings"
import { DebridSettings } from "@/app/(main)/settings/_containers/debrid-settings"
import { FilecacheSettings } from "@/app/(main)/settings/_containers/filecache-settings"
import { LogsSettings } from "@/app/(main)/settings/_containers/logs-settings"
import { MangaSettings } from "@/app/(main)/settings/_containers/manga-settings"
import { MediastreamSettings } from "@/app/(main)/settings/_containers/mediastream-settings"
import { ServerSettings } from "@/app/(main)/settings/_containers/server-settings"
import { UISettings } from "@/app/(main)/settings/_containers/ui-settings"
import { PageWrapper } from "@/components/shared/page-wrapper"
import { SeaLink } from "@/components/shared/sea-link"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/components/ui/core/styling"
import { Field, Form } from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter, useSearchParams } from "@/lib/navigation"
import { settingsSchema } from "@/lib/server/settings"
import { __isElectronDesktop__ } from "@/types/constants"
import { useSetAtom } from "jotai"
import { useAtom } from "jotai/react"
import capitalize from "lodash/capitalize"
import React from "react"
import { UseFormReturn } from "react-hook-form"
import { BiDonateHeart } from "react-icons/bi"
import { CgMediaPodcast } from "react-icons/cg"
import { FaDiscord } from "react-icons/fa"
import { HiOutlineServerStack } from "react-icons/hi2"
import {
    LuBookKey,
    LuBookOpen,
    LuCircleArrowOutUpRight,
    LuCirclePlay,
    LuFileSearch,
    LuLibrary,
    LuMonitorPlay,
    LuPalette,
    LuTabletSmartphone,
    LuWandSparkles,
} from "react-icons/lu"
import { MdOutlineConnectWithoutContact, MdOutlineDownloading, MdOutlinePalette } from "react-icons/md"
import { RiFolderDownloadFill } from "react-icons/ri"
import { TbDatabaseExclamation } from "react-icons/tb"
import { VscDebugAlt } from "react-icons/vsc"
import { SettingsCard, SettingsNavCard, SettingsPageHeader } from "./_components/settings-card"
import { DiscordRichPresenceSettings } from "./_containers/discord-rich-presence-settings"
import { LocalSettings } from "./_containers/local-settings"
import { NakamaSettings } from "./_containers/nakama-settings"

const tabContentClass = cn(
    "space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300",
)


export default function Page() {
    const status = useServerStatus()
    const { isFeatureDisabled, showFeatureWarning } = useServerDisabledFeatures()
    const setServerStatus = useSetServerStatus()
    const router = useRouter()

    const searchParams = useSearchParams()

    const { mutate, data, isPending } = useSaveSettings()

    const [tab, setTab] = useAtom(__settings_tabAtom)
    const formRef = React.useRef<UseFormReturn<any>>(null)



    const { mutate: openInExplorer, isPending: isOpening } = useOpenInExplorer()

    React.useEffect(() => {
        if (!isPending && !!data?.settings) {
            setServerStatus(data)
        }
    }, [data, isPending])

    const setIssueRecorderOpen = useSetAtom(__issueReport_overlayOpenAtom)

    function handleOpenIssueRecorder() {
        if (isFeatureDisabled("UpdateSettings")) return showFeatureWarning()

        setIssueRecorderOpen(true)
        router.push("/")
    }

    const previousTab = React.useRef(tab)
    React.useEffect(() => {
        if (tab !== previousTab.current) {
            previousTab.current = tab
            formRef.current?.reset()
        }
    }, [tab])

    React.useEffect(() => {
        const initialTab = searchParams.get("tab")
        if (initialTab) {
            setTab(initialTab)
            setTimeout(() => {
                // Remove search param
                if (searchParams.has("tab")) {
                    const newParams = new URLSearchParams(searchParams)
                    newParams.delete("tab")
                    router.replace(`?${newParams.toString()}`, { scroll: false })
                }
            }, 500)
        }
    }, [searchParams])

    return (
        <>
            <CustomLibraryBanner discrete />
            <PageWrapper data-settings-page-container className="p-4 sm:p-8 space-y-4 relative">
                {/*<Separator/>*/}


                {/*<Card className="p-0 overflow-hidden">*/}
                <Tabs
                    value={tab}
                    onValueChange={setTab}
                    className={cn("w-full grid grid-cols-1 lg:grid lg:grid-cols-[300px,1fr] gap-4")}
                    triggerClass={cn(
                        "text-base px-6 rounded-[--radius-md] w-fit lg:w-full rounded-lg border-0 data-[state=active]:bg-[--subtle] data-[state=active]:text-white dark:hover:text-white",
                        "h-9 lg:justify-start px-3 transition-all duration-200 hover:bg-[--subtle]/50 hover:transform",
                    )}
                    listClass={cn(
                        "w-full flex flex-wrap lg:flex-nowrap h-fit",
                        "lg:block p-2 lg:p-0",
                    )}
                    data-settings-page-tabs
                >
                    <TabsList className="flex-wrap max-w-full lg:space-y-2 lg:sticky lg:top-10">
                        <SettingsNavCard>
                            <div className="flex flex-col gap-4 md:flex-row justify-between items-center">

                            </div>
                            <div className="overflow-x-none overflow-y-hidden rounded-[--radius-md] space-y-1 lg:space-y-3 flex justify-center flex-wrap lg:block">

                                <Card className="lg:p-2 contents lg:block border-0 bg-transparent lg:border lg:bg-gray-950/80">
                                    <div className="space-y-2 p-4 w-full">
                                        <h4 className="text-center text-xl font-bold">Settings</h4>
                                        <div className="space-y-1">
                                            <p className="text-[--muted] text-sm text-center w-full">
                                                {status?.version} {status?.versionName}
                                            </p>
                                            <p className="text-[--muted] text-sm text-center w-full">
                                                {capitalize(status?.os)}{__isElectronDesktop__ &&
                                                    <span className="font-medium"> - Denshi</span>}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                                <Card className="lg:p-2 contents lg:block border-0 bg-transparent lg:border lg:bg-gray-950/80">
                                    <TabsTrigger
                                        value="seanime"
                                        className="group"
                                    ><LuWandSparkles className="text-xl mr-3 transition-transform duration-200" /> App</TabsTrigger>
                                    {/* <TabsTrigger
                                     value="local"
                                     className="group"
                                     ><LuUserCog className="text-xl mr-3 transition-transform duration-200" /> Local Account</TabsTrigger> */}
                                    <TabsTrigger
                                        value="library"
                                        className="group"
                                    ><LuLibrary className="text-xl mr-3 transition-transform duration-200" /> Local Anime Library</TabsTrigger>
                                    <TabsTrigger
                                        value="playback"
                                        className="group"
                                    ><LuCirclePlay className="text-xl mr-3 transition-transform duration-200" /> Video Playback</TabsTrigger>
                                </Card>

                                {/*<div className="text-xs lg:text-[--muted] text-center py-1.5 uppercase px-3 border-gray-800 tracking-wide font-medium">*/}
                                {/*    Anime playback*/}
                                {/*</div>*/}

                                <Card className="lg:p-2 contents lg:block border-0 bg-transparent lg:border lg:bg-gray-950/80">

                                    <TabsTrigger
                                        value="media-player"
                                        className="group"
                                    ><LuMonitorPlay className="text-xl mr-3 transition-transform duration-200" /> Desktop Media Player</TabsTrigger>
                                    <TabsTrigger
                                        value="external-player-link"
                                        className="group"
                                    ><LuCircleArrowOutUpRight className="text-xl mr-3 transition-transform duration-200" /> External Player
                                        Link</TabsTrigger>
                                    <TabsTrigger
                                        value="mediastream"
                                        className="relative group"
                                    ><LuTabletSmartphone className="text-xl mr-3 transition-transform duration-200" /> Transcoding / Direct
                                        Play</TabsTrigger>
                                </Card>

                                {/*<div className="text-xs lg:text-[--muted] text-center py-1.5 uppercase px-3 border-gray-800 tracking-wide font-medium">*/}
                                {/*    Torrenting*/}
                                {/*</div>*/}

                                <Card className="lg:p-2 contents lg:block border-0 bg-transparent lg:border lg:bg-gray-950/80">
                                    <TabsTrigger
                                        value="debrid"
                                        className="group"
                                    ><HiOutlineServerStack className="text-xl mr-3 transition-transform duration-200" /> Debrid Service</TabsTrigger>
                                </Card>

                                {/*<div className="text-xs lg:text-[--muted] text-center py-1.5 uppercase px-3 border-gray-800 tracking-wide font-medium">*/}
                                {/*    Other features*/}
                                {/*</div>*/}

                                <Card className="lg:p-2 contents lg:block border-0 bg-transparent lg:border lg:bg-gray-950/80">
                                    <TabsTrigger
                                        value="onlinestream"
                                        className="group"
                                    ><CgMediaPodcast className="text-xl mr-3 transition-transform duration-200" /> Online Streaming</TabsTrigger>

                                    <TabsTrigger
                                        value="manga"
                                        className="group"
                                    ><LuBookOpen className="text-xl mr-3 transition-transform duration-200" /> Manga</TabsTrigger>
                                    <TabsTrigger
                                        value="nakama"
                                        className="group relative"
                                    ><MdOutlineConnectWithoutContact className="text-xl mr-3 transition-transform duration-200" /> Nakama</TabsTrigger>
                                    <TabsTrigger
                                        value="discord"
                                        className="group"
                                    ><FaDiscord className="text-xl mr-3 transition-transform duration-200" /> Discord</TabsTrigger>
                                </Card>

                                {/*<div className="text-xs lg:text-[--muted] text-center py-1.5 uppercase px-3 border-gray-800 tracking-wide font-medium">*/}
                                {/*    Server & Interface*/}
                                {/*</div>*/}

                                <Card className="lg:p-2 contents lg:block border-0 bg-transparent lg:border lg:bg-gray-950/80">
                                    <TabsTrigger
                                        value="ui"
                                        className="group"
                                    ><MdOutlinePalette className="text-xl mr-3 transition-transform duration-200" /> User Interface</TabsTrigger>
                                    {/* <TabsTrigger
                                     value="cache"
                                     className="group"
                                     ><TbDatabaseExclamation className="text-xl mr-3 transition-transform duration-200" /> Cache</TabsTrigger> */}
                                    <TabsTrigger
                                        value="logs"
                                        className="group"
                                    ><LuBookKey className="text-xl mr-3 transition-transform duration-200" /> Logs & Cache</TabsTrigger>
                                </Card>
                            </div>
                        </SettingsNavCard>

                        <div className="flex justify-center !mt-0 pb-4">
                            <SeaLink
                                href="https://github.com/sponsors/5rahim"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Button
                                    intent="gray-link"
                                    size="md"
                                    leftIcon={<BiDonateHeart className="text-lg" />}
                                >
                                    Donate
                                </Button>
                            </SeaLink>
                        </div>
                    </TabsList>

                    <div className="">
                        <Form
                            schema={settingsSchema}
                            mRef={formRef}
                            onSubmit={data => {
                                mutate({
                                    library: {
                                        libraryPath: data.libraryPath,
                                        autoUpdateProgress: data.autoUpdateProgress,
                                        disableUpdateCheck: data.disableUpdateCheck,
                                        torrentProvider: "none",
                                        autoSelectTorrentProvider: "none",
                                        autoScan: data.autoScan,
                                        enableOnlinestream: data.enableOnlinestream,
                                        includeOnlineStreamingInLibrary: data.includeOnlineStreamingInLibrary ?? false,
                                        disableAnimeCardTrailers: data.disableAnimeCardTrailers,
                                        enableManga: false,
                                        dohProvider: data.dohProvider === "-" ? "" : data.dohProvider,
                                        openTorrentClientOnStart: false,
                                        openWebURLOnStart: data.openWebURLOnStart,
                                        refreshLibraryOnStart: data.refreshLibraryOnStart,
                                        autoPlayNextEpisode: data.autoPlayNextEpisode ?? false,
                                        enableWatchContinuity: data.enableWatchContinuity ?? false,
                                        libraryPaths: data.libraryPaths ?? [],
                                        autoSyncOfflineLocalData: data.autoSyncOfflineLocalData ?? false,
                                        scannerMatchingThreshold: data.scannerMatchingThreshold,
                                        scannerMatchingAlgorithm: data.scannerMatchingAlgorithm === "-" ? "" : data.scannerMatchingAlgorithm,
                                        autoSyncToLocalAccount: data.autoSyncToLocalAccount ?? false,
                                        autoSaveCurrentMediaOffline: data.autoSaveCurrentMediaOffline ?? false,
                                        useFallbackMetadataProvider: data.useFallbackMetadataProvider ?? false,
                                        scannerUseLegacyMatching: data.scannerUseLegacyMatching ?? false,
                                        scannerConfig: data.scannerConfig ?? "",
                                    },
                                    nakama: {
                                        enabled: data.nakamaEnabled ?? false,
                                        username: data.nakamaUsername,
                                        isHost: data.nakamaIsHost ?? false,
                                        remoteServerURL: data.nakamaRemoteServerURL,
                                        remoteServerPassword: data.nakamaRemoteServerPassword,
                                        hostShareLocalAnimeLibrary: data.nakamaHostShareLocalAnimeLibrary ?? false,
                                        hostPassword: data.nakamaHostPassword,
                                        includeNakamaAnimeLibrary: data.includeNakamaAnimeLibrary ?? false,
                                        hostUnsharedAnimeIds: data?.nakamaHostUnsharedAnimeIds ?? [],
                                        hostEnablePortForwarding: data.nakamaHostEnablePortForwarding ?? false,
                                    },
                                    manga: {
                                        defaultMangaProvider: data.defaultMangaProvider === "-" ? "" : data.defaultMangaProvider,
                                        mangaAutoUpdateProgress: data.mangaAutoUpdateProgress ?? false,
                                        mangaLocalSourceDirectory: data.mangaLocalSourceDirectory || "",
                                    },
                                    mediaPlayer: {
                                        host: data.mediaPlayerHost,
                                        defaultPlayer: data.defaultPlayer,
                                        vlcPort: data.vlcPort,
                                        vlcUsername: data.vlcUsername || "",
                                        vlcPassword: data.vlcPassword,
                                        vlcPath: data.vlcPath || "",
                                        mpcPort: data.mpcPort,
                                        mpcPath: data.mpcPath || "",
                                        mpvSocket: data.mpvSocket || "",
                                        mpvPath: data.mpvPath || "",
                                        mpvArgs: data.mpvArgs || "",
                                        iinaSocket: data.iinaSocket || "",
                                        iinaPath: data.iinaPath || "",
                                        iinaArgs: data.iinaArgs || "",
                                        vcTranslate: data.vcTranslate ?? false,
                                        vcTranslateApiKey: data.vcTranslateApiKey || "",
                                        vcTranslateProvider: data.vcTranslateProvider || "",
                                        vcTranslateTargetLanguage: data.vcTranslateTargetLanguage || "",
                                    },
                                    torrent: {
                                        defaultTorrentClient: "none",
                                        qbittorrentPath: "",
                                        qbittorrentHost: "",
                                        qbittorrentPort: 8080,
                                        qbittorrentPassword: "",
                                        qbittorrentUsername: "",
                                        qbittorrentTags: "",
                                        qbittorrentCategory: "",
                                        transmissionPath: "",
                                        transmissionHost: "",
                                        transmissionPort: 9091,
                                        transmissionUsername: "",
                                        transmissionPassword: "",
                                        showActiveTorrentCount: false,
                                        hideTorrentList: true,
                                    },
                                    discord: {
                                        enableRichPresence: data?.enableRichPresence ?? false,
                                        enableAnimeRichPresence: data?.enableAnimeRichPresence ?? false,
                                        enableMangaRichPresence: data?.enableMangaRichPresence ?? false,
                                        richPresenceHideSeanimeRepositoryButton: data?.richPresenceHideSeanimeRepositoryButton ?? false,
                                        richPresenceShowAniListMediaButton: data?.richPresenceShowAniListMediaButton ?? false,
                                        richPresenceShowAniListProfileButton: data?.richPresenceShowAniListProfileButton ?? false,
                                        richPresenceUseMediaTitleStatus: data?.richPresenceUseMediaTitleStatus ?? false,
                                    },
                                    anilist: {
                                        hideAudienceScore: data.hideAudienceScore,
                                        enableAdultContent: data.enableAdultContent,
                                        blurAdultContent: data.blurAdultContent,
                                        disableCacheLayer: data.disableCacheLayer,
                                    },
                                    notifications: {
                                        disableNotifications: data?.disableNotifications ?? false,
                                        disableAutoDownloaderNotifications: true,
                                        disableAutoScannerNotifications: data?.disableAutoScannerNotifications ?? false,
                                    },
                                }, {
                                    onSuccess: () => {
                                        formRef.current?.reset(formRef.current.getValues())
                                    },
                                })
                            }}
                            defaultValues={{
                                libraryPath: status?.settings?.library?.libraryPath,
                                mediaPlayerHost: status?.settings?.mediaPlayer?.host,
                                autoScan: status?.settings?.library?.autoScan,
                                defaultPlayer: status?.settings?.mediaPlayer?.defaultPlayer,
                                vlcPort: status?.settings?.mediaPlayer?.vlcPort,
                                vlcUsername: status?.settings?.mediaPlayer?.vlcUsername,
                                vlcPassword: status?.settings?.mediaPlayer?.vlcPassword,
                                vlcPath: status?.settings?.mediaPlayer?.vlcPath,
                                mpcPort: status?.settings?.mediaPlayer?.mpcPort,
                                mpcPath: status?.settings?.mediaPlayer?.mpcPath,
                                mpvSocket: status?.settings?.mediaPlayer?.mpvSocket,
                                mpvPath: status?.settings?.mediaPlayer?.mpvPath,
                                mpvArgs: status?.settings?.mediaPlayer?.mpvArgs,
                                iinaSocket: status?.settings?.mediaPlayer?.iinaSocket,
                                iinaPath: status?.settings?.mediaPlayer?.iinaPath,
                                iinaArgs: status?.settings?.mediaPlayer?.iinaArgs,
                                defaultTorrentClient: "none",
                                hideAudienceScore: status?.settings?.anilist?.hideAudienceScore ?? false,
                                autoUpdateProgress: status?.settings?.library?.autoUpdateProgress ?? false,
                                disableUpdateCheck: status?.settings?.library?.disableUpdateCheck ?? false,
                                enableOnlinestream: status?.settings?.library?.enableOnlinestream ?? false,
                                includeOnlineStreamingInLibrary: status?.settings?.library?.includeOnlineStreamingInLibrary ?? false,
                                disableAnimeCardTrailers: status?.settings?.library?.disableAnimeCardTrailers ?? false,
                                enableManga: status?.settings?.library?.enableManga ?? false,
                                enableRichPresence: status?.settings?.discord?.enableRichPresence ?? false,
                                enableAnimeRichPresence: status?.settings?.discord?.enableAnimeRichPresence ?? false,
                                enableMangaRichPresence: status?.settings?.discord?.enableMangaRichPresence ?? false,
                                enableAdultContent: status?.settings?.anilist?.enableAdultContent ?? false,
                                blurAdultContent: status?.settings?.anilist?.blurAdultContent ?? false,
                                dohProvider: status?.settings?.library?.dohProvider || "-",
                                openWebURLOnStart: status?.settings?.library?.openWebURLOnStart ?? false,
                                refreshLibraryOnStart: status?.settings?.library?.refreshLibraryOnStart ?? false,
                                richPresenceHideSeanimeRepositoryButton: status?.settings?.discord?.richPresenceHideSeanimeRepositoryButton ?? false,
                                richPresenceShowAniListMediaButton: status?.settings?.discord?.richPresenceShowAniListMediaButton ?? false,
                                richPresenceShowAniListProfileButton: status?.settings?.discord?.richPresenceShowAniListProfileButton ?? false,
                                richPresenceUseMediaTitleStatus: status?.settings?.discord?.richPresenceUseMediaTitleStatus ?? false,
                                disableNotifications: status?.settings?.notifications?.disableNotifications ?? false,
                                disableAutoScannerNotifications: status?.settings?.notifications?.disableAutoScannerNotifications ?? false,
                                defaultMangaProvider: status?.settings?.manga?.defaultMangaProvider || "-",
                                mangaAutoUpdateProgress: status?.settings?.manga?.mangaAutoUpdateProgress ?? false,
                                autoPlayNextEpisode: status?.settings?.library?.autoPlayNextEpisode ?? false,
                                enableWatchContinuity: status?.settings?.library?.enableWatchContinuity ?? false,
                                libraryPaths: status?.settings?.library?.libraryPaths ?? [],
                                autoSyncOfflineLocalData: status?.settings?.library?.autoSyncOfflineLocalData ?? false,
                                scannerMatchingThreshold: status?.settings?.library?.scannerMatchingThreshold ?? 0.5,
                                scannerMatchingAlgorithm: status?.settings?.library?.scannerMatchingAlgorithm || "-",
                                mangaLocalSourceDirectory: status?.settings?.manga?.mangaLocalSourceDirectory || "",
                                autoSyncToLocalAccount: status?.settings?.library?.autoSyncToLocalAccount ?? false,
                                nakamaEnabled: status?.settings?.nakama?.enabled ?? false,
                                nakamaUsername: status?.settings?.nakama?.username ?? "",
                                nakamaIsHost: status?.settings?.nakama?.isHost ?? false,
                                nakamaRemoteServerURL: status?.settings?.nakama?.remoteServerURL ?? "",
                                nakamaRemoteServerPassword: status?.settings?.nakama?.remoteServerPassword ?? "",
                                nakamaHostShareLocalAnimeLibrary: status?.settings?.nakama?.hostShareLocalAnimeLibrary ?? false,
                                nakamaHostPassword: status?.settings?.nakama?.hostPassword ?? "",
                                includeNakamaAnimeLibrary: status?.settings?.nakama?.includeNakamaAnimeLibrary ?? false,
                                nakamaHostUnsharedAnimeIds: status?.settings?.nakama?.hostUnsharedAnimeIds ?? [],
                                autoSaveCurrentMediaOffline: status?.settings?.library?.autoSaveCurrentMediaOffline ?? false,
                                useFallbackMetadataProvider: status?.settings?.library?.useFallbackMetadataProvider ?? false,
                                vcTranslate: status?.settings?.mediaPlayer?.vcTranslate ?? false,
                                vcTranslateApiKey: status?.settings?.mediaPlayer?.vcTranslateApiKey ?? "",
                                vcTranslateProvider: status?.settings?.mediaPlayer?.vcTranslateProvider ?? "",
                                vcTranslateTargetLanguage: status?.settings?.mediaPlayer?.vcTranslateTargetLanguage ?? "",
                                scannerUseLegacyMatching: status?.settings?.library?.scannerUseLegacyMatching ?? false,
                                scannerConfig: status?.settings?.library?.scannerConfig ?? "",
                            }}
                            stackClass="space-y-0 relative"
                        >
                            {(f) => {
                                return <>
                                    <SettingsIsDirty />
                                    <TabsContent value="seanime" className={tabContentClass}>

                                        <SettingsPageHeader
                                            title="App"
                                            description="General app settings"
                                            icon={LuWandSparkles}
                                        />

                                        <div className="flex flex-wrap gap-2 slide-in-from-bottom duration-500 delay-150">
                                            {!!status?.dataDir && <Button
                                                size="sm"
                                                intent="gray-outline"
                                                onClick={() => openInExplorer({
                                                    path: status?.dataDir,
                                                })}
                                                className="transition-all duration-200 hover:scale-105 hover:shadow-md"
                                                leftIcon={
                                                    <RiFolderDownloadFill className="transition-transform duration-200 group-hover:scale-110" />}
                                            >
                                                Open Data directory
                                            </Button>}
                                            <Button
                                                size="sm"
                                                intent="gray-outline"
                                                onClick={handleOpenIssueRecorder}
                                                leftIcon={<VscDebugAlt className="transition-transform duration-200 group-hover:scale-110" />}
                                                className="transition-all duration-200 hover:scale-105 hover:shadow-md group"
                                                data-open-issue-recorder-button
                                            >
                                                Record an issue
                                            </Button>
                                        </div>

                                        <ServerSettings isPending={isPending} />

                                    </TabsContent>

                                    <TabsContent value="library" className={tabContentClass}>

                                        <SettingsPageHeader
                                            title="Local Anime Library"
                                            description="Manage your local anime library"
                                            icon={LuLibrary}
                                        />

                                        <AnimeLibrarySettings isPending={isPending} />

                                    </TabsContent>

                                    <TabsContent value="local" className={tabContentClass}>

                                        <LocalSettings isPending={isPending} />

                                    </TabsContent>

                                    <TabsContent value="manga" className={tabContentClass}>

                                        <MangaSettings isPending={isPending} />

                                    </TabsContent>

                                    <TabsContent value="onlinestream" className={tabContentClass}>

                                        <SettingsPageHeader
                                            title="Online Streaming"
                                            description="Configure online streaming settings"
                                            icon={CgMediaPodcast}
                                        />

                                        <SettingsCard>
                                            <Field.Switch
                                                side="right"
                                                name="enableOnlinestream"
                                                label="Enable"
                                                help="Watch anime episodes from online sources."
                                            />
                                        </SettingsCard>

                                        <SettingsCard title="Home Screen">
                                            <Field.Switch
                                                side="right"
                                                name="includeOnlineStreamingInLibrary"
                                                label="Include in anime library"
                                                help="Add non-downloaded shows that are in your currently watching list to the anime library."
                                            />
                                        </SettingsCard>

                                        <SettingsSubmitButton isPending={isPending} />

                                    </TabsContent>

                                    <TabsContent value="discord" className={tabContentClass}>

                                        <SettingsPageHeader
                                            title="Discord"
                                            description="Configure Discord rich presence settings"
                                            icon={FaDiscord}
                                        />

                                        <DiscordRichPresenceSettings />

                                        <SettingsSubmitButton isPending={isPending} />

                                    </TabsContent>


                                    <TabsContent value="media-player" className={tabContentClass}>
                                        <MediaplayerSettings isPending={isPending} />
                                    </TabsContent>


                                    <TabsContent value="external-player-link" className={tabContentClass}>
                                        <ExternalPlayerLinkSettings />
                                    </TabsContent>

                                    <TabsContent value="playback" className={tabContentClass}>
                                        <PlaybackSettings />
                                    </TabsContent>

                                    <TabsContent value="nakama" className={tabContentClass}>

                                        <NakamaSettings isPending={isPending} />

                                    </TabsContent>
                                </>
                            }}
                        </Form>

                        {/* <TabsContent value="cache" className={tabContentClass}>

                         <SettingsPageHeader
                         title="Cache"
                         description="Manage the cache"
                         icon={TbDatabaseExclamation}
                         />

                         <FilecacheSettings />

                         </TabsContent> */}

                        <TabsContent value="mediastream" className={tabContentClass}>

                            <MediastreamSettings />

                        </TabsContent>

                        <TabsContent value="ui" className={tabContentClass}>

                            <SettingsPageHeader
                                title="User Interface"
                                description="Customize the user interface"
                                icon={LuPalette}
                            />

                            <UISettings />

                        </TabsContent>

                        <TabsContent value="logs" className={tabContentClass}>

                            <SettingsPageHeader
                                title="Logs"
                                description="View the logs"
                                icon={LuBookKey}
                            />


                            <LogsSettings />

                            <Separator />

                            <SettingsPageHeader
                                title="Cache"
                                description="Manage the cache"
                                icon={TbDatabaseExclamation}
                            />

                            <FilecacheSettings />

                        </TabsContent>


                        {/*<TabsContent value="data" className="space-y-4">*/}

                        {/*    <DataSettings />*/}

                        {/*</TabsContent>*/}

                        <TabsContent value="debrid" className={tabContentClass}>

                            <DebridSettings />

                        </TabsContent>
                    </div>
                </Tabs>
                {/*</Card>*/}

            </PageWrapper>
        </>
    )

}
