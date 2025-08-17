import { config } from 'dotenv';
config();

import '@/ai/flows/generate-trade-suggestions.ts';
import '@/ai/flows/passkey-flow.ts';
import '@/ai/flows/get-top-movers.ts';
