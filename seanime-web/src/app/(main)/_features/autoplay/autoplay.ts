import { Anime_Entry, Anime_Episode, HibikeTorrent_AnimeTorrent, HibikeTorrent_BatchEpisodeFiles } from "@/api/generated/types"
import { useGetAnimeEntry } from "@/api/hooks/anime_entries.hooks"
import { PlaybackManager_PlaybackState } from "@/app/(main)/_features/progress-tracking/_lib/playback-manager.types"
import { useServerStatus } from "@/app/(main)/_hooks/use-server-status"
import { useHandleStartDebridStream } from "@/app/(main)/entry/_containers/debrid-stream/_lib/handle-debrid-stream"
import { useHandlePlayMedia } from "@/app/(main)/entry/_lib/handle-play-media"
import { logger } from "@/lib/helpers/debug"
import { atom } from "jotai"
import { useAtom } from "jotai/react"
import { atomWithStorage } from "jotai/utils"
import React, { useState } from "react"
import { toast } from "sonner"

const __autoplay_countdownAtom = atom(5)
export const __autoplay_nextEpisodeAtom = atom<Anime_Episode | null>(null)
const __autoplay_streamingTypeAtom = atom<"local" | "debrid" | null>(null)

export interface AutoplayState {
    isActive: boolean
    countdown: number
    nextEpisode: Anime_Episode | null
    streamingType: "local" | "debrid" | null
}

type AutoplayInfo = {
    allEpisodes: Anime_Episode[]
    entry: Anime_Entry
    episodeNumber: number
    aniDBEpisode: string
    type: "debridstream"
}
// Stores info about the entry that's being streamed
const __autoPlay_stateAtom = atomWithStorage<AutoplayInfo | null>("sea-autoplay-info", null, undefined, { getOnInit: true })
// Stores the stream that was selected for the current stream
// Used by autoplay manager to determine the next stream
const __autoPlay_selectedStreamAtom = atomWithStorage<{
    entry: Anime_Entry,
    torrent: HibikeTorrent_AnimeTorrent,
    batchFiles?: HibikeTorrent_BatchEpisodeFiles // Used when user manually selects a file from a batch
} | null>("sea-autoplay-selected-stream", null, undefined, { getOnInit: true })

export function useAutoPlaySelectedStream() {
    const [selectedStream, setSelectedStream] = useAtom(__autoPlay_selectedStreamAtom)

    return {
        autoPlayStream: selectedStream,
        setAutoPlayStream: (torrent: HibikeTorrent_AnimeTorrent,
            entry: Anime_Entry,
            batchFiles?: HibikeTorrent_BatchEpisodeFiles,
        ) => setSelectedStream({
            entry,
            torrent,
            batchFiles,
        }),
    }
}

export function useDebridstreamAutoplay() {
    const [info, setInfo] = useAtom(__autoPlay_stateAtom)
    const [nextEpisode, setNextEpisode] = useAtom(__autoplay_nextEpisodeAtom)

    const { handleAutoSelectStream, handleStreamSelection } = useHandleStartDebridStream()
    const { autoPlayStream } = useAutoPlaySelectedStream()

    function handleAutoplayNextDebridstreamEpisode() {
        if (!info) return
        const { entry, episodeNumber, aniDBEpisode, allEpisodes } = info

        if (autoPlayStream?.torrent?.isBatch) {

            let fileIndex: number | undefined = undefined
            if (autoPlayStream?.batchFiles) {
                const file = autoPlayStream.batchFiles.files?.find(n => n.index === autoPlayStream.batchFiles!.current + 1)
                if (file) {
                    fileIndex = file.index
                }
            }

            // If the user provided a stream, use it
            handleStreamSelection({
                mediaId: entry.mediaId,
                episodeNumber: episodeNumber,
                aniDBEpisode: aniDBEpisode,
                torrent: autoPlayStream.torrent,
                chosenFileId: fileIndex !== undefined ? String(fileIndex) : "",
                batchEpisodeFiles: (autoPlayStream?.batchFiles && fileIndex !== undefined) ? {
                    ...autoPlayStream.batchFiles,
                    current: fileIndex,
                    currentEpisodeNumber: episodeNumber,
                    currentAniDBEpisode: aniDBEpisode,
                } : undefined,
            })
        } else {
            // Otherwise, use the auto-select function
            handleAutoSelectStream({ mediaId: entry.mediaId, episodeNumber: episodeNumber, aniDBEpisode })
        }

        const nextEpisode = allEpisodes?.find(e => e.episodeNumber === episodeNumber + 1)
        if (nextEpisode && !!nextEpisode.aniDBEpisode) {
            setInfo({
                allEpisodes,
                entry,
                episodeNumber: nextEpisode.episodeNumber,
                aniDBEpisode: nextEpisode.aniDBEpisode,
                type: "debridstream",
            })
            setNextEpisode(nextEpisode)
        } else {
            setInfo(null)
        }

        toast.info("Requesting next episode")
    }


    return {
        debridstreamAutoplayInfo: info?.type === "debridstream" ? info : null,
        hasNextDebridstreamEpisode: !!info && info.type === "debridstream",
        setDebridstreamAutoplayInfo: setInfo,
        autoplayNextDebridstreamEpisode: handleAutoplayNextDebridstreamEpisode,
        resetDebridstreamAutoplayInfo: () => setInfo(null),
    }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function useAutoplay() {
    const serverStatus = useServerStatus()

    // Autoplay state
    const [isActive, setIsActive] = useState(false)
    const [countdown, setCountdown] = useAtom(__autoplay_countdownAtom)
    const [nextEpisode, setNextEpisode] = useAtom(__autoplay_nextEpisodeAtom)
    const [streamingType, setStreamingType] = useAtom(__autoplay_streamingTypeAtom)

    const { hasNextDebridstreamEpisode, autoplayNextDebridstreamEpisode, resetDebridstreamAutoplayInfo } = useDebridstreamAutoplay()

    // Local playback
    const { playMediaFile } = useHandlePlayMedia()

    const isActiveRef = React.useRef(isActive)

    // refs for cleanup
    const timerRef = React.useRef<NodeJS.Timeout | null>(null)
    const countdownRef = React.useRef<NodeJS.Timeout | null>(null)

    // Clear all timers
    const clearTimers = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }
        if (countdownRef.current) {
            clearInterval(countdownRef.current)
            countdownRef.current = null
        }
    }

    const cancelAutoplay = () => {
        logger("Autoplay").info("Cancelling autoplay")

        clearTimers()
        setIsActive(_ => {
            isActiveRef.current = false
            return false
        })
        setNextEpisode(null)
        setStreamingType(null)
        setCountdown(5)

        // Reset streaming autoplay info
        resetDebridstreamAutoplayInfo()
    }

    const startAutoplay = (
        playbackState: PlaybackManager_PlaybackState,
        nextEp?: Anime_Episode,
        type: "local" | "debrid" = "local",
    ) => {
        if (!serverStatus?.settings?.library?.autoPlayNextEpisode) {
            logger("Autoplay").info("Autoplay disabled in settings")
            return
        }

        if (isActiveRef.current) {
            logger("Autoplay").info("Autoplay already active")
            return
        }

        // Determine next episode and streaming type
        let episodeToPlay: Anime_Episode | null = null
        let detectedType: "local" | "debrid" | null = null

        if (nextEp) {
            episodeToPlay = nextEp
            detectedType = type
        } else if (hasNextDebridstreamEpisode) {
            detectedType = "debrid"
        } else {
            // For local episodes, we'll pass the episode in the nextEp
            // The caller is responsible for getting the next episode
            detectedType = "local"
        }

        if (!episodeToPlay && !hasNextDebridstreamEpisode) {
            logger("Autoplay").info("No next episode found")
            return
        }

        logger("Autoplay").info("Starting autoplay countdown", {
            nextEpisode: episodeToPlay?.displayTitle,
            type: detectedType,
        })

        setNextEpisode(episodeToPlay)
        setStreamingType(detectedType)
        setIsActive(_ => {
            isActiveRef.current = true
            return true
        })

        setCountdown(5)

        // Start countdown timer
        countdownRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    if (countdownRef.current) {
                        clearInterval(countdownRef.current)
                        countdownRef.current = null
                    }
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        // Start main timer to trigger autoplay
        timerRef.current = setTimeout(() => {
            executeAutoplay(episodeToPlay, detectedType, playbackState)
        }, 5000)

    }

    // Execute the actual autoplay
    const executeAutoplay = (
        episode: Anime_Episode | null,
        type: "local" | "debrid" | null,
        playbackState: PlaybackManager_PlaybackState,
    ) => {
        logger("Autoplay").info("Executing autoplay", { type, episode: episode?.displayTitle, isActive: isActiveRef.current })

        try {
            switch (type) {
                case "local":
                    if (episode?.localFile?.path) {
                        playMediaFile({
                            path: episode.localFile.path,
                            mediaId: playbackState.mediaId,
                            episode: episode,
                        })
                        toast.info("Playing next episode")
                    }
                    break
                case "debrid":
                    autoplayNextDebridstreamEpisode()
                    break
                default:
                    logger("Autoplay").warning("Unknown streaming type", type)
            }
        }
        catch (error) {
            logger("Autoplay").error("Error executing autoplay", error)
            toast.error("Failed to play next episode")
        }
        finally {
            logger("Autoplay").info("Autoplay execution finished, resetting state")
            // Reset state
            setIsActive(_ => {
                isActiveRef.current = false
                return false
            })
            setNextEpisode(null)
            setStreamingType(null)
            setCountdown(5)
        }
    }


    return {
        state: {
            isActive,
            countdown,
            nextEpisode,
            streamingType,
        } as AutoplayState,

        startAutoplay,
        cancelAutoplay,

        hasNextEpisode: !!nextEpisode || hasNextDebridstreamEpisode,
        resetAutoplayInfo: cancelAutoplay,
    }
}

// get next episode from anime entry
export function useNextEpisodeResolver(mediaId: number, currentEpisodeNumber: number) {
    const { data: animeEntry } = useGetAnimeEntry(!!mediaId ? mediaId : null)

    return React.useMemo(() => {
        if (!animeEntry?.episodes) return null

        const mainEpisodes = animeEntry.episodes.filter(ep => ep.type === "main")
        return mainEpisodes.find(ep => ep.progressNumber === currentEpisodeNumber + 1) || null
    }, [animeEntry?.episodes, currentEpisodeNumber])
}
