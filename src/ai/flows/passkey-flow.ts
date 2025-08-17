
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
  displayName: z.string().optional(),
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


/**
 * Converts a base64url string to an ArrayBuffer.
 */
function base64UrlToBuffer(base64Url: string): ArrayBuffer {
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return toByteArray(base64).buffer;
}

/**
 * Converts an ArrayBuffer to a base64url string.
 */
function bufferToBase64Url(buffer: ArrayBuffer): string {
    const base64 = fromByteArray(new Uint8Array(buffer));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
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
  async ({ userId, userEmail, displayName }) => {
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
      userDisplayName: displayName || userEmail,
      attestationType: 'none',
      excludeCredentials: (userData.authenticators || []).map(auth => ({
        id: toByteArray(auth.credentialID), // Convert base64url string back to Uint8Array
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
    
    // The `response.id` and `response.rawId` are base64url encoded on the client,
    // but the server library expects ArrayBuffers. The server library's response object
    // also needs to be compatible with the client's `PublicKeyCredential` interface.
    // The verification function will handle the necessary conversions internally.
    const verificationResponse: RegistrationResponseJSON = response;

    let verification: VerifiedRegistrationResponse;
    try {
        verification = await verifyRegistrationResponse({
            response: verificationResponse,
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
        credentialID, // This is a Uint8Array
        counter,
        credentialDeviceType,
        credentialBackedUp,
      } = registrationInfo;
      
      const newAuthenticator: Authenticator = {
          credentialID: fromByteArray(credentialID), // Store as base64 string
          credentialPublicKey: fromByteArray(credentialPublicKey), // Store as base64 string
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

    // Unlike registration, we can't store the challenge against a user record yet,
    // because we don't know who the user is until they respond.
    // So we return the options (including the challenge) to the client.
    return authOptions;
  }
);


export const verifyAuthentication = ai.defineFlow(
  {
    name: 'verifyAuthentication',
    inputSchema: VerifyAuthenticationRequestSchema,
    outputSchema: z.object({ 
        verified: z.boolean(), 
        user: z.object({ id: z.string(), email: z.string(), password: z.string() }).optional() 
    }),
  },
  async ({ response, expectedChallenge }) => {
    if (!RelyingPartyID || !Origin) {
        throw new Error('Missing NEXT_PUBLIC_RELYING_PARTY_ID or NEXT_PUBLIC_ORIGIN environment variables');
    }
    // The user ID is sent as part of the authenticator response
    const userId = response.id;
    if (!userId) {
        throw new Error('User ID not found in authentication response.');
    }

    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
        throw new Error(`User with ID ${userId} not found.`);
    }

    const userData = userDoc.data() as UserData;
    
    // Find the authenticator that the user is trying to use
    const authenticator = userData.authenticators?.find(
      auth => auth.credentialID === response.id
    );

    if (!authenticator) {
      throw new Error(`Could not find authenticator with ID ${response.id} for user ${userId}`);
    }
    
    let verification: VerifiedAuthenticationResponse;
    try {
        verification = await verifyAuthenticationResponse({
            response: response,
            expectedChallenge,
            expectedOrigin: Origin,
            expectedRPID: RelyingPartyID,
            authenticator: {
                ...authenticator,
                credentialID: toByteArray(authenticator.credentialID),
                credentialPublicKey: toByteArray(authenticator.credentialPublicKey),
            },
            requireUserVerification: true,
        });

    } catch (error: any) {
        console.error('Authentication verification failed:', error);
        return { verified: false };
    }

    const { verified, authenticationInfo } = verification;

    if (verified) {
      // Update the authenticator's counter in the DB to prevent replay attacks
      const newCounter = authenticationInfo.newCounter;
      const updatedAuthenticators = userData.authenticators.map(auth =>
        auth.credentialID === response.id
          ? { ...auth, counter: newCounter }
          : auth
      );

      await updateDoc(userDocRef, {
        authenticators: updatedAuthenticators,
      });

      // IMPORTANT: In a real-world application, you should NOT return the password.
      // You would use the Firebase Admin SDK in a secure backend environment to mint a custom token.
      // Since that's not possible here, we return a known value to simulate the login.
      return { 
          verified: true,
          user: {
              id: userId,
              email: userData.email,
              // This is a placeholder to make the client-side Firebase login work.
              password: `${userData.email}-passkey`
          }
      };
    }

    return { verified: false };
  }
);
