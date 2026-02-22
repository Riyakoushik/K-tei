import { AL_BaseAnime, Anime_EntryDownloadInfo } from "@/api/generated/types"
import { EpisodeGridItem } from "@/app/(main)/_features/anime/_components/episode-grid-item"
import { PluginEpisodeGridItemMenuItems } from "@/app/(main)/_features/plugin/actions/plugin-actions"
import { EpisodeListGrid } from "@/app/(main)/entry/_components/episode-list-grid"
import React from "react"
import { BiCalendarAlt } from "react-icons/bi"
import { EpisodeItemInfoModalButton } from "./episode-item"

export function UndownloadedEpisodeList({ downloadInfo, media, maxCol }: {
    downloadInfo: Anime_EntryDownloadInfo | undefined,
    media: AL_BaseAnime
    maxCol?: number
}) {

    const episodes = downloadInfo?.episodesToDownload

    const text = "The following episodes are not in your library:"

    if (!episodes?.length) return null

    return (
        <div className="space-y-4" data-undownloaded-episode-list>
            <p className={""}>
                {text}
            </p>
            <EpisodeListGrid maxCol={maxCol}>
                {episodes?.sort((a, b) => a.episodeNumber - b.episodeNumber).slice(0, 28).map((ep, idx) => {
                    if (!ep.episode) return null
                    const episode = ep.episode
                    return (
                        <EpisodeGridItem
                            key={ep.episode.localFile?.path || idx}
                            media={media}
                            image={episode.episodeMetadata?.image}
                            isInvalid={episode.isInvalid}
                            title={episode.displayTitle}
                            episodeTitle={episode.episodeTitle}
                            episodeNumber={episode.episodeNumber}
                            progressNumber={episode.progressNumber}
                            description={episode.episodeMetadata?.summary || episode.episodeMetadata?.overview}
                            action={<>
                                <EpisodeItemInfoModalButton episode={episode} />

                                <PluginEpisodeGridItemMenuItems isDropdownMenu={true} type="undownloaded" episode={episode} />
                            </>}
                        >
                            <div data-undownloaded-episode-list-episode-metadata-container className="mt-1">
                                <p data-undownloaded-episode-list-episode-metadata-text className="flex gap-1 items-center text-sm text-[--muted]">
                                    <BiCalendarAlt /> {episode.episodeMetadata?.airDate
                                        ? `Aired on ${new Date(episode.episodeMetadata?.airDate).toLocaleDateString()}`
                                        : "Aired"}
                                </p>
                            </div>
                        </EpisodeGridItem>
                    )
                })}
            </EpisodeListGrid>
            {episodes.length > 28 && <h3>And more...</h3>}
        </div>
    )

}
