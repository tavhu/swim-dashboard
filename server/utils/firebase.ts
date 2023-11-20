import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const conFig = useRuntimeConfig();
export const app = initializeApp({
  credential: cert(
    {
      //@ts-ignored
      type: `${conFig.firebaseType}`,
      projectId: `${conFig.firebaseProjectId}`,
      private_key_id: `${conFig.firebasePrivateKeyId}`,
      private_key: `${conFig.firebasePrivateKey}`,
      client_email: `${conFig.firebaseClientEmail}`,
      client_id: `${conFig.firebaseClientId}`,
      auth_uri: `${conFig.firebaseAuthUri}`,
      token_uri: `${conFig.firebaseTokenUri}`,
      auth_provider_x509_cert_url: `${conFig.firebaseAuthProviderCertUrl}`,
      client_x509_cert_url: `${conFig.firebaseClientCertUrl}`,
      universe_domain: `${conFig.firebaseUniverseDomain}`,
    }
    // './firebaseadmin.json'
  ),
});
export const firestore = getFirestore();
