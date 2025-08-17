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

// Types for WebAuthn
export interface Authenticator {
  credentialID: string; // Base64URL encoded
  credentialPublicKey: string; // Base64URL encoded
  counter: number;
  credentialDeviceType: 'singleDevice' | 'multiDevice';
  credentialBackedUp: boolean;
  transports?: AuthenticatorTransport[];
}

export interface UserData {
    id: string;
    email: string;
    authenticators: Authenticator[];
    currentChallenge?: string;
}
