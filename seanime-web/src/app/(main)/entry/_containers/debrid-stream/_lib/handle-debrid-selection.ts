import { Anime_Episode } from "@/api/generated/types"
import { atom, useAtom } from "jotai"

export const __debridSearch_selectedEpisodeAtom = atom<Anime_Episode | undefined>(undefined)

export function useDebridSearchSelectedStreamEpisode() {
    const [debridSearchStreamEpisode, setDebridSearchStreamEpisode] = useAtom(__debridSearch_selectedEpisodeAtom)
    return {
        debridSearchStreamEpisode,
        setDebridSearchStreamEpisode,
    }
}
