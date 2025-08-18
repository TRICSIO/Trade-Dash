
import AppHeader from "@/components/header";
import ProtectedRoute from "@/components/protected-route";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getStockNews, type NewsArticle } from "@/ai/flows/get-stock-news";
import { Newspaper } from "lucide-react";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

async function StockNewsList() {
    const news = await getStockNews();

    return (
        <div className="grid gap-6">
            {news.articles.map((article, index) => (
                <NewsCard key={index} article={article} />
            ))}
        </div>
    )
}

function NewsCard({ article }: { article: NewsArticle }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{article.title}</CardTitle>
                <CardDescription>{article.summary}</CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-between">
                <Badge variant="outline">{article.source}</Badge>
                <span className="text-sm text-muted-foreground">{article.publishedDate}</span>
            </CardFooter>
        </Card>
    )
}

function LoadingSkeleton() {
    return (
        <div className="grid gap-6">
            {[...Array(5)].map((_, i) => (
                 <Card key={i}>
                    <CardHeader>
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-full" />
                         <Skeleton className="h-4 w-5/6" />
                    </CardHeader>
                    <CardFooter className="flex justify-between">
                       <Skeleton className="h-6 w-24" />
                       <Skeleton className="h-6 w-32" />
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}

function StockNewsPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <AppHeader onAddTradeClick={() => {}} onImportClick={() => {}} />
            <main className="flex-1 p-4 sm:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="flex items-center gap-2">
                         <Newspaper className="h-8 w-8" />
                         <div>
                            <h1 className="text-3xl font-bold">Market News & Announcements</h1>
                            <p className="text-muted-foreground">The latest news moving the stock market.</p>
                         </div>
                    </div>

                    <Suspense fallback={<LoadingSkeleton />}>
                        <StockNewsList />
                    </Suspense>
                </div>
            </main>
        </div>
    );
}

export default function StockNews() {
    return (
        <ProtectedRoute>
            <StockNewsPage />
        </ProtectedRoute>
    );
}

