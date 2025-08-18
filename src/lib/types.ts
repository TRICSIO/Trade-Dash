
export type Trade = {
  id: string;
  instrument: string;
  entryDate: Date;
  exitDate?: Date;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  tradeStyle: string;
  notes?: string;
  account: string;
};

export type AccountSettings = {
  [accountName: string]: {
    color: string;
    accountNumber?: string;
    accountNickname?: string;
    accountProvider?: string;
  };
};

export interface UserData {
    trades: Trade[];
    startingBalances: Record<string, number>;
    accountSettings: AccountSettings;
    email: string;
    displayName?: string;
}

export type StockMover = {
    ticker: string;
    name: string;
    price: string;
    change: string;
    changePercent: string;
};
