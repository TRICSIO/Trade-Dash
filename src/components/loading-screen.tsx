
import { Skeleton } from '@/components/ui/skeleton';

export default function LoadingScreen() {
    return (
        <div className="flex flex-col min-h-screen bg-background p-4 sm:p-6 lg:p-8">
            <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm mb-8">
                <div className="container flex h-16 items-center px-4 sm:justify-between">
                     <Skeleton className="h-8 w-1/3" />
                     <div className="hidden sm:flex items-center space-x-2">
                        <Skeleton className="h-10 w-24" />
                        <Skeleton className="h-10 w-28" />
                        <Skeleton className="h-10 w-10 rounded-full" />
                     </div>
                </div>
            </header>
            <main className="flex-1 space-y-8">
                <Skeleton className="h-48 w-full rounded-lg" />
                <div className="grid gap-8 lg:grid-cols-5">
                    <Skeleton className="h-80 lg:col-span-3 rounded-lg" />
                    <Skeleton className="h-80 lg:col-span-2 rounded-lg" />
                </div>
                <Skeleton className="h-96 w-full rounded-lg" />
            </main>
        </div>
    )
}
