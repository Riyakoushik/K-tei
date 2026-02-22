import { HibikeTorrent_AnimeTorrent } from "@/api/generated/types"
import { atom } from "jotai"

export type DebridSearchType = "debridstream-select" | "debridstream-select-file"

export const __debridSearch_selectionAtom = atom<DebridSearchType | undefined>(undefined)
export const __debridSearch_selectionEpisodeAtom = atom<number | undefined>(undefined)
export const __debridSearch_fileSelectionStreamAtom = atom<HibikeTorrent_AnimeTorrent | undefined>(undefined)
