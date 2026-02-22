import { Anime_Entry, Anime_Episode } from "@/api/generated/types"
import { useGetAnimeEpisodeCollection } from "@/api/hooks/anime.hooks"
import { useGetAnimeEntry } from "@/api/hooks/anime_entries.hooks"
import { EpisodeGridItem } from "@/app/(main)/_features/anime/_components/episode-grid-item"
import { useAutoPlaySelectedStream } from "@/app/(main)/_features/autoplay/autoplay"
import { useNakamaWatchParty } from "@/app/(main)/_features/nakama/nakama-manager"
import { usePlaylistManager } from "@/app/(main)/_features/playlists/_containers/global-playlist-manager"
import { VideoCoreNextButton, VideoCorePreviousButton } from "@/app/(main)/_features/video-core/video-core-control-bar"
import { VideoCore_PlaybackType, VideoCoreLifecycleState } from "@/app/(main)/_features/video-core/video-core.atoms"
import { useHandleStartDebridStream } from "@/app/(main)/entry/_containers/debrid-stream/_lib/handle-debrid-stream"
import {
    __debridStream_autoSelectFileAtom,
    __debridStream_currentSessionAutoSelectAtom,
} from "@/app/(main)/entry/_containers/debrid-stream/debrid-stream-page"
import { useHandlePlayMedia } from "@/app/(main)/entry/_lib/handle-play-media"
import { HoverCard } from "@/components/ui/hover-card"
import { logger } from "@/lib/helpers/debug"
import { atom, useAtomValue } from "jotai"
import { useAtom } from "jotai/react"
import React from "react"
import { useUpdateEffect } from "react-use"
import { toast } from "sonner"

export type VideoCorePlaylistState = {
    type: VideoCore_PlaybackType
    episodes: Anime_Episode[]
    previousEpisode: Anime_Episode | null
    nextEpisode: Anime_Episode | null
    currentEpisode: Anime_Episode
    animeEntry: Anime_Entry | null
    onPlayEpisode?: VideoCorePlaylistPlayEpisodeFunction
}

type VideoCorePlaylistPlayEpisodeFunction = (which: "previous" | "next") => void

const log = logger("VIDEO CORE PLAYLIST")

export const vc_playlistState = atom<VideoCorePlaylistState | null>(null)

// call once, maintains playlist state
export function useVideoCorePlaylistSetup(providedState: VideoCoreLifecycleState,
    onPlayEpisode: VideoCorePlaylistPlayEpisodeFunction | undefined = undefined,
) {
    const [playlistState, setPlaylistState] = useAtom(vc_playlistState)

    const state = providedState

    const playbackInfo = state?.playbackInfo
    const playbackType = state?.playbackInfo?.playbackType
    const mediaId = state?.playbackInfo?.media?.id

    const currProgressNumber = playbackInfo?.episode?.progressNumber || 0

    // Fetch anime entry and episode collection
    // episode collection will be used for non-localfile streams
    const { data: animeEntry } = useGetAnimeEntry(mediaId)
    const { data: episodeCollection, isLoading, refetch } = useGetAnimeEpisodeCollection(mediaId)

    useUpdateEffect(() => {
        if (mediaId) {
            refetch()
        }
    }, [playbackInfo?.streamUrl, mediaId])

    // Get the episodes depending on the stream type
    const episodes = React.useMemo(() => {
        if (!episodeCollection) return []

        if (playbackType === "localfile" || playbackType === "nakama") {
            return animeEntry?.episodes?.filter(ep => ep.type === "main") ?? []
        }
        if (state.playbackInfo?.playlistExternalEpisodeNumbers) {
            return episodeCollection?.episodes?.filter(ep => state.playbackInfo?.playlistExternalEpisodeNumbers?.includes(ep.episodeNumber)) ?? []
        }

        return episodeCollection?.episodes ?? []
    }, [animeEntry?.episodes, episodeCollection?.episodes, currProgressNumber, playbackType, state.playbackInfo?.playlistExternalEpisodeNumbers])

    const currentEpisode = episodes.find?.(ep => ep.progressNumber === currProgressNumber) ?? null
    const previousEpisode = episodes.find?.(ep => ep.progressNumber === currProgressNumber - 1) ?? null
    const nextEpisode = episodes.find?.(ep => ep.progressNumber === currProgressNumber + 1) ?? null

    React.useEffect(() => {
        if (!playbackInfo || !playbackInfo.streamUrl || !currentEpisode || !episodes.length || !animeEntry) {
            log.info("No playback info or episodes found, clearing playlist state")
            setPlaylistState(null)
            return
        }

        log.info("Updating playlist state", {
            playbackType,
            episodeCount: episodes.length,
            currentEpisode: currentEpisode.episodeNumber,
            nextEpisode: nextEpisode?.episodeNumber,
            previousEpisode: previousEpisode?.episodeNumber,
        })
        setPlaylistState({
            type: playbackType!,
            episodes: episodes ?? [],
            currentEpisode,
            previousEpisode,
            nextEpisode,
            animeEntry,
            onPlayEpisode,
        })
    }, [animeEntry, playbackInfo?.id, currentEpisode, previousEpisode, nextEpisode, onPlayEpisode])
}

export function useVideoCorePlaylist() {
    const playlistState = useAtomValue(vc_playlistState)
    const playbackType = playlistState?.type
    const animeEntry = playlistState?.animeEntry

    const { isPeer: isWatchPartyPeer } = useNakamaWatchParty()

    const { handleStreamSelection: handleDebridstreamSelection, handleAutoSelectStream: handleDebridstreamAutoSelect } = useHandleStartDebridStream()
    const { playMediaFile } = useHandlePlayMedia()

    // If user is auto-selecting the stream
    const [debridStream_currentSessionAutoSelect] = useAtom(__debridStream_currentSessionAutoSelectAtom)
    // If user is auto-selecting the file
    const [debridStream_autoSelectFile] = useAtom(__debridStream_autoSelectFileAtom)

    // The stream to continue playing from
    const { autoPlayStream } = useAutoPlaySelectedStream()

    // Global playlist
    const {
        nextPlaylistEpisode: globalPlaylistNextEpisode,
        prevPlaylistEpisode: globalPlaylistPreviousEpisode,
        currentPlaylist: globalCurrentPlaylist,
        playEpisode: playGlobalPlaylistEpisode,
    } = usePlaylistManager()

    function startStream(episode: Anime_Episode) {
        if (!playlistState?.animeEntry || !episode.aniDBEpisode) return
        log.info("Stream requested for ", episode.episodeNumber)

        if (playbackType === "debrid") {
            log.info("Auto selecting stream for ", episode.episodeNumber)
            if (debridStream_currentSessionAutoSelect) {

                handleDebridstreamAutoSelect({
                    mediaId: playlistState.animeEntry.mediaId,
                    episodeNumber: episode.episodeNumber,
                    aniDBEpisode: episode.aniDBEpisode,
                })
                return
            }
        }

        // If a stream was selected for auto play (i.e. user manually select stream with auto select file)
        if (autoPlayStream?.torrent?.isBatch) {
            log.info("Previous stream selected for auto play", autoPlayStream)
            let fileIndex: number | undefined = undefined
            if (autoPlayStream?.batchFiles) {
                const file = autoPlayStream.batchFiles.files?.find((n: any) => n.index === autoPlayStream.batchFiles!.current + 1)
                if (file) {
                    fileIndex = file.index
                }
            }
            if (playbackType === "debrid") {
                handleDebridstreamSelection({
                    mediaId: playlistState.animeEntry.mediaId,
                    episodeNumber: episode.episodeNumber,
                    aniDBEpisode: episode.aniDBEpisode,
                    torrent: autoPlayStream.torrent,
                    chosenFileId: fileIndex !== undefined ? String(fileIndex) : "",
                    batchEpisodeFiles: (autoPlayStream?.batchFiles && fileIndex !== undefined) ? {
                        ...autoPlayStream.batchFiles,
                        current: fileIndex,
                        currentEpisodeNumber: episode.episodeNumber,
                        currentAniDBEpisode: episode.aniDBEpisode,
                    } : undefined,
                })
            }
        }
    }

    const playEpisode = (which: "previous" | "next" | string) => {
        if (isWatchPartyPeer) return

        if (!playlistState) {
            toast.error("Unexpected error: No playlist state")
            return
        }
        if (!animeEntry) {
            toast.error("Unexpected error: No entry")
            return
        }

        log.info("Requesting episode", which)

        // If global playlist is active, use it instead
        if (globalCurrentPlaylist) {
            log.info("Playing global playlist episode", which)
            switch (which) {
                case "previous":
                    if (globalPlaylistPreviousEpisode) {
                        playGlobalPlaylistEpisode("previous", true)
                    }
                    break
                case "next":
                    if (globalPlaylistNextEpisode) {
                        playGlobalPlaylistEpisode("next", true)
                    }
                    break
            }

            return
        }

        let episode: Anime_Episode | null = null
        switch (which) {
            case "previous":
                if (playlistState?.previousEpisode) {
                    episode = playlistState.previousEpisode
                }
                break
            case "next":
                if (playlistState?.nextEpisode) {
                    episode = playlistState.nextEpisode
                }
                break
            default:
                episode = playlistState?.episodes?.find(n => n.aniDBEpisode === which) ?? null
        }

        if (!episode) {
            log.info("Episode not found for", which)
            return
        }

        log.info("Playing episode", episode)

        switch (playbackType) {
            case "localfile":
            case "nakama":
                if (!episode?.localFile?.path) {
                    toast.error("Local file not found")
                    return
                }
                playMediaFile({
                    path: episode?.localFile?.path,
                    episode: episode,
                    mediaId: animeEntry?.mediaId,
                })
                break
            case "debrid":
                startStream(episode)
                break
            default:
                playlistState.onPlayEpisode?.(which as "previous" | "next")
                if (!playlistState.onPlayEpisode) {
                    log.error("No onPlayEpisode function found for playback type", playbackType)
                }
        }
    }

    return {
        playlistState,
        animeEntry: playlistState?.animeEntry,
        hasPreviousEpisode: !!playlistState?.previousEpisode && !isWatchPartyPeer,
        hasNextEpisode: !!playlistState?.nextEpisode && !isWatchPartyPeer,
        playEpisode,
    }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function PlaylistEpisodeHoverCard({ episode, children }: { episode?: Anime_Episode, children: React.ReactNode }) {
    return (
        <HoverCard
            data-vc-element="playlist-episode-hover-card"
            className="max-w-xl w-fit py-2 px-4 ml-4"
            sideOffset={38}
            closeDelay={200}
            trigger={<span>
                {children}
            </span>}
        >
            <EpisodeGridItem
                key={JSON.stringify(episode)}
                media={episode?.baseAnime as any}
                title={episode?.displayTitle || episode?.baseAnime?.title?.userPreferred || ""}
                image={episode?.episodeMetadata?.image || episode?.baseAnime?.coverImage?.large}
                episodeTitle={episode?.episodeTitle}
                fileName={episode?.localFile?.parsedInfo?.original}
                description={episode?.episodeMetadata?.summary || episode?.episodeMetadata?.overview}
                isFiller={episode?.episodeMetadata?.isFiller}
                length={episode?.episodeMetadata?.length}
                className="flex-none w-full"
                episodeNumber={episode?.episodeNumber}
                progressNumber={episode?.progressNumber}
            />
        </HoverCard>
    )
}

export function VideoCorePlaylistControl() {
    const { animeEntry, hasNextEpisode, hasPreviousEpisode, playEpisode } = useVideoCorePlaylist()

    // Global playlist
    const { nextPlaylistEpisode, prevPlaylistEpisode, currentPlaylist, playEpisode: playPlaylistEpisode } = usePlaylistManager()

    if (currentPlaylist) {
        return <>
            {!!prevPlaylistEpisode && <PlaylistEpisodeHoverCard episode={prevPlaylistEpisode?.episode}>
                <VideoCorePreviousButton
                    onClick={() => {
                        playPlaylistEpisode("previous", true)
                    }}
                />
            </PlaylistEpisodeHoverCard>}
            {!!nextPlaylistEpisode && <PlaylistEpisodeHoverCard episode={nextPlaylistEpisode?.episode}>
                <VideoCoreNextButton
                    onClick={() => {
                        playPlaylistEpisode("next", true)
                    }}
                />
            </PlaylistEpisodeHoverCard>}
        </>
    }

    return (
        <>
            {hasPreviousEpisode && <VideoCorePreviousButton
                onClick={() => {
                    playEpisode("previous")
                }}
            />}
            {hasNextEpisode && <VideoCoreNextButton
                onClick={() => {
                    playEpisode("next")
                }}
            />}
        </>
    )
}
