'use server';

/**
 * @fileOverview A flow to get the top moving stocks.
 *
 * - getTopMovers - A function that returns top gaining and losing stocks.
 * - StockMover - The type for an individual stock mover.
 * - TopMoversOutput - The return type for the getTopMovers function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { StockMover } from '@/lib/types';


const StockMoverSchema = z.object({
    ticker: z.string().describe('The stock ticker symbol.'),
    name: z.string().describe('The name of the company.'),
    price: z.string().describe('The current price of the stock.'),
    change: z.string().describe('The dollar change in the stock price.'),
    changePercent: z.string().describe('The percentage change in the stock price.'),
});

const TopMoversOutputSchema = z.object({
  gainers: z.array(StockMoverSchema).describe('A list of the top gaining stocks.'),
  losers: z.array(StockMoverSchema).describe('A list of the top losing stocks.'),
});
export type TopMoversOutput = z.infer<typeof TopMoversOutputSchema>;

// This is a mock implementation. In a real application, you would fetch this data from a financial API.
async function getMockTopMovers(): Promise<TopMoversOutput> {
    return {
        gainers: [
            { ticker: 'NVDA', name: 'NVIDIA Corp', price: '1,199.34', change: '+62.21', changePercent: '+5.47%' },
            { ticker: 'TSLA', name: 'Tesla, Inc.', price: '184.88', change: '+7.12', changePercent: '+4.01%' },
            { ticker: 'AAPL', name: 'Apple Inc.', price: '212.49', change: '+5.78', changePercent: '+2.80%' },
            { ticker: 'GOOGL', name: 'Alphabet Inc.', price: '179.22', change: '+3.45', changePercent: '+1.97%' },
            { ticker: 'AMD', name: 'Advanced Micro Devices', price: '166.17', change: '+2.99', changePercent: '+1.83%' },
        ],
        losers: [
            { ticker: 'PFE', name: 'Pfizer Inc.', price: '27.50', change: '-1.23', changePercent: '-4.28%' },
            { ticker: 'INTC', name: 'Intel Corporation', price: '30.63', change: '-0.99', changePercent: '-3.13%' },
            { ticker: 'BA', name: 'The Boeing Company', price: '174.52', change: '-4.56', changePercent: '-2.55%' },
            { ticker: 'XOM', name: 'Exxon Mobil Corp', price: '110.45', change: '-2.11', changePercent: '-1.87%' },
            { ticker: 'V', name: 'Visa Inc.', price: '270.11', change: '-3.45', changePercent: '-1.26%' },
        ]
    }
}


export const getTopMovers = ai.defineFlow(
  {
    name: 'getTopMovers',
    inputSchema: z.void(),
    outputSchema: TopMoversOutputSchema,
  },
  async () => {
    // In a real-world scenario, you would call a financial data API here.
    // For this example, we'll use a mock function.
    const movers = await getMockTopMovers();
    
    // You could also use an AI prompt to generate this data, but an API is more reliable for financial data.
    /*
    const prompt = ai.definePrompt({
        name: 'topMoversPrompt',
        output: { schema: TopMoversOutputSchema },
        prompt: `Generate a list of 5 top stock market gainers and 5 top stock market losers for today.`,
    });
    const { output } = await prompt();
    return output!;
    */
    
    return movers;
  }
);
