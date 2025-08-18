'use server';

/**
 * @fileOverview A flow to get recent stock market news.
 *
 * - getStockNews - A function that returns a list of news articles.
 * - NewsArticle - The type for an individual news article.
 * - StockNewsOutput - The return type for the getStockNews function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const NewsArticleSchema = z.object({
    title: z.string().describe('The headline of the news article.'),
    summary: z.string().describe('A brief summary of the news article.'),
    source: z.string().describe('The source of the news (e.g., Bloomberg, Reuters).'),
    publishedDate: z.string().describe('The date the article was published (e.g., YYYY-MM-DD).'),
});

const StockNewsOutputSchema = z.object({
  articles: z.array(NewsArticleSchema).describe('A list of recent stock market news articles.'),
});

export type NewsArticle = z.infer<typeof NewsArticleSchema>;
export type StockNewsOutput = z.infer<typeof StockNewsOutputSchema>;


const prompt = ai.definePrompt({
    name: 'stockNewsPrompt',
    input: { schema: z.void() },
    output: { schema: StockNewsOutputSchema },
    prompt: `Generate a list of 5 recent and significant stock market news announcements or articles. Include major market-moving news, IPO announcements, mergers, and press releases (PR). Provide a title, a short summary, a source, and a publication date for each.`,
});


export const getStockNews = ai.defineFlow(
  {
    name: 'getStockNews',
    inputSchema: z.void(),
    outputSchema: StockNewsOutputSchema,
  },
  async () => {
    const { output } = await prompt();
    return output!;
  }
);
