export type Trade = {
  id: string;
  instrument: string;
  entryDate: Date;
  exitDate: Date;
  entryPrice: number;
  exitPrice: number;
  tradeStyle: string;
  notes?: string;
};
