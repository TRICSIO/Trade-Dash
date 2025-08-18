'use server';

/**
 * @fileOverview An AI agent for processing CSV trade data.
 *
 * - processCsvData - A function that handles parsing and structuring trade data from a CSV string.
 * - ProcessCsvDataInput - The input type for the processCsvData function.
 * - ProcessCsvDataOutput - The return type for the processCsvData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProcessCsvDataInputSchema = z.object({
  csvData: z.string().describe('A string containing the full CSV data of trade history.'),
});
export type ProcessCsvDataInput = z.infer<typeof ProcessCsvDataInputSchema>;

const TradeSchema = z.object({
    instrument: z.string().describe("The ticker symbol or currency pair of the asset traded."),
    entryDate: z.string().describe("The date of the trade entry in YYYY-MM-DD format."),
    exitDate: z.string().describe("The date of the trade exit in YYYY-MM-DD format. Can be null if the trade is still open.").optional(),
    entryPrice: z.number().describe("The price at which the asset was bought or sold short."),
    exitPrice: z.number().describe("The price at which the position was closed. Can be null if the trade is still open.").optional(),
    quantity: z.number().describe("The number of shares or units traded."),
    tradeStyle: z.enum(["Day Trade", "Swing Trade", "Position Trade", "Scalp", "Option"]).describe("The style of the trade."),
    notes: z.string().describe("Any notes or commentary about the trade.").optional(),
    commissions: z.number().describe("The total commissions paid for the trade.").optional(),
    fees: z.number().describe("Any additional fees associated with the trade.").optional(),
    tags: z.array(z.string()).describe("A list of tags associated with the trade.").optional(),
});

const ProcessCsvDataOutputSchema = z.object({
  trades: z.array(TradeSchema).describe('An array of structured trade objects parsed from the CSV.'),
});
export type ProcessCsvDataOutput = z.infer<typeof ProcessCsvDataOutputSchema>;

export async function processCsvData(
  input: ProcessCsvDataInput
): Promise<ProcessCsvDataOutput> {
  return processCsvDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'processCsvDataPrompt',
  input: {schema: ProcessCsvDataInputSchema},
  output: {schema: ProcessCsvDataOutputSchema},
  prompt: `You are an expert financial data analyst. Your task is to parse the provided CSV data, which contains a user's trade history, and convert it into a structured JSON format.

  **Instructions:**
  1.  Analyze the headers and data in the CSV to identify the key information for each trade. Common headers might include "Symbol", "Date", "Time", "Side" (Buy/Sell), "Quantity", "Price", "Fees", "Commissions", etc.
  2.  The CSV may represent trades as separate "buy" and "sell" rows. You must intelligently group these rows into single, logical trades. A trade consists of an entry (opening the position) and an exit (closing the position).
  3.  Determine the 'tradeStyle'. If buys and sells happen on the same day, it's a 'Day Trade'. If it involves options contracts (e.g., calls/puts), it's 'Option'. Otherwise, classify as 'Swing Trade'. Default to 'Swing Trade' if uncertain.
  4.  For each logical trade, extract the required fields: instrument, entryDate, exitDate, entryPrice, exitPrice, quantity, tradeStyle, notes, commissions, fees, and tags.
  5.  'entryPrice' is the price of the opening transaction. 'exitPrice' is the price of the closing transaction.
  6.  'quantity' should be the absolute number of shares/contracts for the opening transaction.
  7.  Combine all fees and commissions for the entry and exit into the 'commissions' and 'fees' fields for the final trade object.
  8.  If there's a "notes" or "description" column, use that for the 'notes' field.
  9.  Return an array of trade objects in the specified JSON format. If you cannot parse any valid trades, return an empty array.

  **CSV Data:**
  {{{csvData}}}
  `,
});

const processCsvDataFlow = ai.defineFlow(
  {
    name: 'processCsvDataFlow',
    inputSchema: ProcessCsvDataInputSchema,
    outputSchema: ProcessCsvDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
