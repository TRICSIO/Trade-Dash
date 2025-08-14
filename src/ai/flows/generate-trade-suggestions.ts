'use server';

/**
 * @fileOverview A trade suggestion generator AI agent.
 *
 * - generateTradeSuggestions - A function that handles the trade suggestion process.
 * - GenerateTradeSuggestionsInput - The input type for the generateTradeSuggestions function.
 * - GenerateTradeSuggestionsOutput - The return type for the generateTradeSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTradeSuggestionsInputSchema = z.object({
  tradeHistory: z
    .string()
    .describe(
      'A history of the trades that the user has made. This should include entry and exit prices, dates, instruments, and commentary for each trade.'
    ),
});
export type GenerateTradeSuggestionsInput = z.infer<typeof GenerateTradeSuggestionsInputSchema>;

const GenerateTradeSuggestionsOutputSchema = z.object({
  suggestions: z
    .string()
    .describe('Suggestions for improving the user trade strategy.'),
});
export type GenerateTradeSuggestionsOutput = z.infer<typeof GenerateTradeSuggestionsOutputSchema>;

export async function generateTradeSuggestions(
  input: GenerateTradeSuggestionsInput
): Promise<GenerateTradeSuggestionsOutput> {
  return generateTradeSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTradeSuggestionsPrompt',
  input: {schema: GenerateTradeSuggestionsInputSchema},
  output: {schema: GenerateTradeSuggestionsOutputSchema},
  prompt: `You are an expert financial advisor specializing in analyzing past trades and generating suggestions to improve trading strategies.

You will use the trade history to create suggestions on how to improve. 

Trade History: {{{tradeHistory}}}`,
});

const generateTradeSuggestionsFlow = ai.defineFlow(
  {
    name: 'generateTradeSuggestionsFlow',
    inputSchema: GenerateTradeSuggestionsInputSchema,
    outputSchema: GenerateTradeSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
