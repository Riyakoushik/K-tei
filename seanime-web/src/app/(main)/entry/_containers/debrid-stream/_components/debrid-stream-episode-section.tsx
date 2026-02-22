import { Anime_Entry, Anime_Episode, Anime_EpisodeCollection } from "@/api/generated/types"
import { EpisodeGridItem } from "@/app/(main)/_features/anime/_components/episode-grid-item"
import { EpisodeListPaginatedGrid } from "@/app/(main)/entry/_components/episode-list-grid"
import { ForcePlaybackMethod } from "@/app/(main)/entry/_lib/handle-play-media"
import { Button } from "@/components/ui/button"
import { cn } from "@/components/ui/core/styling"
import React from "react"
import { FiDownload } from "react-icons/fi"

type DebridStreamEpisodeSectionProps = {
    episodeCollection: Anime_EpisodeCollection | undefined
    entry: Anime_Entry
    onEpisodeClick: (episode: Anime_Episode, forcePlaybackMethod?: ForcePlaybackMethod) => void
    onPlayExternallyEpisodeClick?: (episode: Anime_Episode) => void
    onPlayNextEpisodeOnMount?: (episode: Anime_Episode) => void
    bottomSection?: React.ReactNode
}

export function DebridStreamEpisodeSection(props: DebridStreamEpisodeSectionProps) {

    const {
        episodeCollection,
        entry,
        onEpisodeClick,
        onPlayExternallyEpisodeClick,
        onPlayNextEpisodeOnMount,
        bottomSection,
    } = props

    const episodes = React.useMemo(() => episodeCollection?.episodes ?? [], [episodeCollection])

    const nextEpisodeToWatch = React.useMemo(() => {
        return episodes.find(ep => ep.progressNumber < ep.episodeNumber) || episodes[0]
    }, [episodes])

    React.useEffect(() => {
        if (nextEpisodeToWatch) {
            onPlayNextEpisodeOnMount?.(nextEpisodeToWatch)
        }
    }, [])

    if (episodes.length === 0) return null

    return (
        <div className="space-y-4">
            <EpisodeListPaginatedGrid
                itemsPerPage={28}
                length={episodes.length}
                shouldDefaultToPageWithEpisode={nextEpisodeToWatch?.episodeNumber}
                renderItem={(idx) => {
                    const ep = episodes[idx]
                    return (
                        <EpisodeGridItem
                            key={ep.episodeNumber}
                            media={entry.media as any}
                            image={ep.episodeMetadata?.image}
                            episodeNumber={ep.episodeNumber}
                            progressNumber={ep.progressNumber}
                            title={ep.displayTitle}
                            description={ep.episodeMetadata?.summary || ep.episodeMetadata?.overview}
                            isWatched={ep.progressNumber >= ep.episodeNumber}
                            isInvalid={ep.isInvalid}
                            isFiller={ep.episodeMetadata?.isFiller}
                            episodeTitle={ep.episodeTitle}
                            onClick={() => onEpisodeClick(ep)}
                            action={onPlayExternallyEpisodeClick ? (
                                <Button
                                    intent="gray-link"
                                    size="sm"
                                    className="px-0"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onPlayExternallyEpisodeClick(ep)
                                    }}
                                >
                                    <FiDownload />
                                </Button>
                            ) : null}
                        />
                    )
                }}
            />
            {bottomSection}
        </div>
    )
}
