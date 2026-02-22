import { AL_MediaListStatus } from "@/api/generated/types"
import { useGetAnimeCollectionSchedule } from "@/api/hooks/anime_collection.hooks"
import { useAnilistListRecentAiringAnime } from "@/api/hooks/anilist.hooks"
import { EpisodeCard } from "@/app/(main)/_features/anime/_components/episode-card"
import { AppLayoutStack } from "@/components/ui/app-layout"
import { Carousel, CarouselContent, CarouselDotButtons, CarouselItem } from "@/components/ui/carousel"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useRouter } from "@/lib/navigation"
import { addDays, format, isSameDay, subDays } from "date-fns"
import { useAtomValue } from "jotai/react"
import React from "react"
import { HiCalendarDays, HiSparkles } from "react-icons/hi2"
import { __anilist_userAnimeListDataAtom } from "../../_atoms/anilist.atoms"
import { calendarParamsAtom } from "../_components/schedule-calendar"

export function DailyOverview() {
    const router = useRouter()
    const anilistListData = useAtomValue(__anilist_userAnimeListDataAtom)
    const calendarParams = useAtomValue(calendarParamsAtom)

    // User's personal schedule
    const { data: schedule, isLoading: isScheduleLoading } = useGetAnimeCollectionSchedule()

    // Global recent airing schedule (fallback)
    const { data: globalSchedule, isLoading: isGlobalLoading } = useAnilistListRecentAiringAnime({
        page: 1,
        perPage: 20,
        airingAt_lesser: Math.floor(addDays(new Date(), 2).getTime() / 1000),
        airingAt_greater: Math.floor(subDays(new Date(), 1).getTime() / 1000),
        sort: ["TIME"],
    })

    const today = new Date()
    const tomorrow = addDays(today, 1)

    const filteredSchedule = React.useMemo(() => {
        const isStatusIncluded = (mediaId: number) => {
            const entry = anilistListData[String(mediaId)]
            if (!entry || !entry.status) return false
            return calendarParams.listStatuses.includes(entry.status as AL_MediaListStatus)
        }

        // 1. Process personal schedule
        let personalToday = schedule?.filter(item => isStatusIncluded(item.mediaId) && isSameDay(new Date(item.dateTime!), today)) || []
        let personalTomorrow = schedule?.filter(item => isStatusIncluded(item.mediaId) && isSameDay(new Date(item.dateTime!), tomorrow)) || []

        // 2. Process global schedule if personal is empty
        let globalToday: any[] = []
        let globalTomorrow: any[] = []

        if (personalToday.length === 0 && globalSchedule?.Page?.airingSchedules) {
            globalToday = globalSchedule.Page.airingSchedules
                .filter(item => item?.airingAt && isSameDay(new Date(item.airingAt * 1000), today))
                .map(item => ({
                    mediaId: item?.media?.id!,
                    title: item?.media?.title?.userPreferred!,
                    image: item?.media?.coverImage?.large || item?.media?.bannerImage!,
                    episodeNumber: item?.episode!,
                    time: format(new Date(item?.airingAt! * 1000), "HH:mm:ss"),
                    isGlobal: true
                }))
        }

        if (personalTomorrow.length === 0 && globalSchedule?.Page?.airingSchedules) {
            globalTomorrow = globalSchedule.Page.airingSchedules
                .filter(item => item?.airingAt && isSameDay(new Date(item.airingAt * 1000), tomorrow))
                .map(item => ({
                    mediaId: item?.media?.id!,
                    title: item?.media?.title?.userPreferred!,
                    image: item?.media?.coverImage?.large || item?.media?.bannerImage!,
                    episodeNumber: item?.episode!,
                    time: format(new Date(item?.airingAt! * 1000), "HH:mm:ss"),
                    isGlobal: true
                }))
        }

        return {
            today: personalToday.length > 0 ? personalToday : globalToday,
            tomorrow: personalTomorrow.length > 0 ? personalTomorrow : globalTomorrow,
            isUsingGlobal: personalToday.length === 0 && personalTomorrow.length === 0 && (globalToday.length > 0 || globalTomorrow.length > 0)
        }
    }, [schedule, globalSchedule, anilistListData, calendarParams.listStatuses])

    if (isScheduleLoading) return <LoadingSpinner />

    if (!filteredSchedule.today.length && !filteredSchedule.tomorrow.length) {
        return (
            <div className="p-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center space-y-2 opacity-50">
                <HiCalendarDays className="text-4xl" />
                <p className="font-medium text-lg">No anime releases today or tomorrow</p>
                <p className="max-w-xs text-sm">Add anime to your "Watching" or "Planning" list to track their specific releases here.</p>
            </div>
        )
    }

    return (
        <AppLayoutStack spacing="lg" className="relative">
            {filteredSchedule.isUsingGlobal && (
                <div className="flex items-center gap-2 px-3 py-1 bg-[--brand-gradient] w-fit rounded-full text-xs font-bold text-white mb-[-10px] animate-pulse">
                    <HiSparkles /> Trending Global Releases
                </div>
            )}

            {filteredSchedule.today.length > 0 && (
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <HiCalendarDays className="text-2xl text-[--brand]" />
                        <h2 className="text-xl font-bold tracking-tight">Releasing Today</h2>
                    </div>
                    <Carousel className="w-full" gap="md" opts={{ align: "start" }}>
                        <CarouselDotButtons />
                        <CarouselContent>
                            {filteredSchedule.today.map((item: any) => (
                                <CarouselItem
                                    key={`${item.mediaId}-${item.episodeNumber}`}
                                    className="md:basis-1/2 lg:basis-1/3 2xl:basis-1/4"
                                >
                                    <EpisodeCard
                                        image={item.image}
                                        topTitle={item.title}
                                        title={`Episode ${item.episodeNumber}`}
                                        meta={item.time.replace(":00:00", ":00")}
                                        onClick={() => router.push(`/entry?id=${item.mediaId}`)}
                                        anime={{
                                            id: item.mediaId,
                                            image: item.image,
                                            title: item.title,
                                        }}
                                    />
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                    </Carousel>
                </section>
            )}

            {filteredSchedule.tomorrow.length > 0 && (
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <HiCalendarDays className="text-2xl text-[--muted]" />
                        <h2 className="text-xl font-bold tracking-tight opacity-80">Coming Tomorrow</h2>
                    </div>
                    <Carousel className="w-full" gap="md" opts={{ align: "start" }}>
                        <CarouselDotButtons />
                        <CarouselContent>
                            {filteredSchedule.tomorrow.map((item: any) => (
                                <CarouselItem
                                    key={`${item.mediaId}-${item.episodeNumber}`}
                                    className="md:basis-1/2 lg:basis-1/3 2xl:basis-1/4"
                                >
                                    <EpisodeCard
                                        image={item.image}
                                        topTitle={item.title}
                                        title={`Episode ${item.episodeNumber}`}
                                        meta={item.time.replace(":00:00", ":00")}
                                        onClick={() => router.push(`/entry?id=${item.mediaId}`)}
                                        anime={{
                                            id: item.mediaId,
                                            image: item.image,
                                            title: item.title,
                                        }}
                                        imageClass="opacity-60"
                                    />
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                    </Carousel>
                </section>
            )}
        </AppLayoutStack>
    )
}
