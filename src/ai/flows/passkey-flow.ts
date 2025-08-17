'use server';

/**
 * @fileOverview Passkey (WebAuthn) registration and authentication flows.
 *
 * - getRegistrationOptions - Generates options for registering a new passkey.
 * - verifyRegistration - Verifies the registration response from the client.
 * - getAuthenticationOptions - Generates options for authenticating with a passkey.
 * - verifyAuthentication - Verifies the authentication response from the client.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  GenerateRegistrationOptionsOpts,
  GenerateAuthenticationOptionsOpts,
  VerifiedRegistrationResponse,
  VerifiedAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/types';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserData, Authenticator } from '@/lib/types';
import { fromByteArray, toByteArray } from 'base64-js';

// Zod schemas for validation
const RegistrationOptionsRequestSchema = z.object({
  userId: z.string(),
  userEmail: z.string(),
});
export type RegistrationOptionsRequest = z.infer<
  typeof RegistrationOptionsRequestSchema
>;

const VerifyRegistrationRequestSchema = z.object({
  response: z.any(), // Can't easily type RegistrationResponseJSON with Zod
  expectedChallenge: z.string(),
  userId: z.string(),
});
export type VerifyRegistrationRequest = z.infer<
  typeof VerifyRegistrationRequestSchema
>;

const VerifyAuthenticationRequestSchema = z.object({
  response: z.any(), // Can't easily type AuthenticationResponseJSON with Zod
  expectedChallenge: z.string(),
});
export type VerifyAuthenticationRequest = z.infer<
  typeof VerifyAuthenticationRequestSchema
>;

const RelyingPartyName = 'Trade-Dash';
const RelyingPartyID = process.env.NEXT_PUBLIC_RELYING_PARTY_ID || 'localhost';
const Origin = process.env.NEXT_PUBLIC_ORIGIN || 'http://localhost:9002';


function base64UrlToBuffer(base64Url: string): ArrayBuffer {
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}


// ###################################################################################
// #                            REGISTRATION FLOWS                                   #
// ###################################################################################

export const getRegistrationOptions = ai.defineFlow(
  {
    name: 'getRegistrationOptions',
    inputSchema: RegistrationOptionsRequestSchema,
    outputSchema: z.any(), // PublickeyCredentialCreationOptionsJSON
  },
  async ({ userId, userEmail }) => {
    if (!RelyingPartyID || !Origin) {
        throw new Error('Missing NEXT_PUBLIC_RELYING_PARTY_ID or NEXT_PUBLIC_ORIGIN environment variables');
    }
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    const userData = userDoc.data() as UserData;

    const options: GenerateRegistrationOptionsOpts = {
      rpName: RelyingPartyName,
      rpID: RelyingPartyID,
      userID: userId,
      userName: userEmail,
      attestationType: 'none',
      excludeCredentials: (userData.authenticators || []).map(auth => ({
        id: auth.credentialID,
        type: 'public-key',
        transports: auth.transports,
      })),
       authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'preferred',
      },
    };

    const registrationOptions = await generateRegistrationOptions(options);
    
    await updateDoc(userDocRef, {
        currentChallenge: registrationOptions.challenge,
    });

    return registrationOptions;
  }
);


export const verifyRegistration = ai.defineFlow(
  {
    name: 'verifyRegistration',
    inputSchema: VerifyRegistrationRequestSchema,
    outputSchema: z.object({ verified: z.boolean() }),
  },
  async ({ response, expectedChallenge, userId }) => {
     if (!RelyingPartyID || !Origin) {
        throw new Error('Missing NEXT_PUBLIC_RELYING_PARTY_ID or NEXT_PUBLIC_ORIGIN environment variables');
    }
     const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    const userData = userDoc.data() as UserData;

    let verification: VerifiedRegistrationResponse;
    try {
        verification = await verifyRegistrationResponse({
            response,
            expectedChallenge,
            expectedOrigin: Origin,
            expectedRPID: RelyingPartyID,
            requireUserVerification: true,
        });
    } catch (error) {
        console.error('Registration verification failed:', error);
        return { verified: false };
    }

    const { verified, registrationInfo } = verification;

    if (verified && registrationInfo) {
      const {
        credentialPublicKey,
        credentialID,
        counter,
        credentialDeviceType,
        credentialBackedUp,
      } = registrationInfo;
      
      const newAuthenticator: Authenticator = {
          credentialID: credentialID,
          credentialPublicKey: bufferToBase64Url(credentialPublicKey),
          counter,
          credentialDeviceType,
          credentialBackedUp,
          transports: response.response.transports as AuthenticatorTransport[],
      };

      const existingAuthenticators = userData.authenticators || [];
      
      await updateDoc(userDocRef, {
        authenticators: [...existingAuthenticators, newAuthenticator],
        currentChallenge: null, // Clear challenge
      });
    }

    return { verified };
  }
);

// ###################################################################################
// #                          AUTHENTICATION FLOWS                                   #
// ###################################################################################

export const getAuthenticationOptions = ai.defineFlow(
  {
    name: 'getAuthenticationOptions',
    inputSchema: z.void(),
    outputSchema: z.any(), // PublicKeyCredentialRequestOptionsJSON
  },
  async () => {
    if (!RelyingPartyID) {
        throw new Error('Missing NEXT_PUBLIC_RELYING_PARTY_ID environment variable');
    }
    const options: GenerateAuthenticationOptionsOpts = {
      timeout: 60000,
      userVerification: 'preferred',
      rpID: RelyingPartyID,
    };
    
    const authOptions = await generateAuthenticationOptions(options);

    // This is a bit tricky. Since we don't know the user yet, we can't store the challenge
    // against a user record. We'll have to pass it back to the client and include it
    // in the verification step.
    return authOptions;
  }
);


export const verifyAuthentication = ai.defineFlow(
  {
    name: 'verifyAuthentication',
    inputSchema: VerifyAuthenticationRequestSchema,
    outputSchema: z.object({ 
        verified: z.boolean(), 
        user: z.object({ id: z.string(), email: z.string(), passkey: z.string() }).optional() 
    }),
  },
  async ({ response, expectedChallenge }) => {
    if (!RelyingPartyID || !Origin) {
        throw new Error('Missing NEXT_PUBLIC_RELYING_PARTY_ID or NEXT_PUBLIC_ORIGIN environment variables');
    }
    const userId = response.id;
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
        throw new Error(`User with ID ${userId} not found.`);
    }

    const userData = userDoc.data() as UserData;
    const authenticator = userData.authenticators?.find(
      auth => auth.credentialID === response.id
    );

    if (!authenticator) {
      throw new Error(`Could not find authenticator with ID ${response.id} for user ${userId}`);
    }
    
    let verification: VerifiedAuthenticationResponse;
    try {
        verification = await verifyAuthenticationResponse({
            response,
            expectedChallenge,
            expectedOrigin: Origin,
            expectedRPID: RelyingPartyID,
            authenticator: {
                ...authenticator,
                credentialID: authenticator.credentialID,
                credentialPublicKey: base64UrlToBuffer(authenticator.credentialPublicKey),
            },
            requireUserVerification: true,
        });

    } catch (error) {
        console.error(error);
        return { verified: false };
    }

    const { verified, authenticationInfo } = verification;

    if (verified) {
      // Update the authenticator's counter in the DB
      const newCounter = authenticationInfo.newCounter;
      const updatedAuthenticators = userData.authenticators.map(auth =>
        auth.credentialID === response.id
          ? { ...auth, counter: newCounter }
          : auth
      );

      await updateDoc(userDocRef, {
        authenticators: updatedAuthenticators,
      });

      return { 
          verified: true,
          user: {
              id: userId,
              email: userData.email,
              passkey: `passkey_for_${userId}`
          }
      };
    }

    return { verified: false };
  }
);
