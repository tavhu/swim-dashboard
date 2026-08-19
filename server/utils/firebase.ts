import { initializeApp, cert, getApps, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * Firestore, initialised on first use rather than at import.
 *
 * This module used to call `initializeApp()` and `getFirestore()` at the top
 * level. In dev that was harmless — nothing imported it until a contact request
 * arrived — but the production bundle evaluates it at boot, so a missing or
 * placeholder Firebase key threw `Invalid PEM formatted message` and took the
 * whole server down before it could serve a single page. An optional
 * integration used by one public form must not be able to do that.
 *
 * The credential is the ministry's Firebase service account, and Firestore backs
 * only the "contact us" messages. So init is deferred to the first call, and a
 * server with no valid key answers 503 on the contact endpoints while every
 * other page runs normally.
 */
let cached: Firestore | null = null;

function firestoreClient(): Firestore {
  if (cached) return cached;

  const c = useRuntimeConfig();
  const privateKey = String(c.firebasePrivateKey ?? "").replace(/\\n/g, "\n");

  // A real service-account key is PEM. The placeholder in .env.example is not,
  // and neither is an unset value — refuse here, in the request, not at boot.
  if (!privateKey.includes("BEGIN PRIVATE KEY")) {
    throw createError({
      statusCode: 503,
      statusMessage: "Contact service is not configured (Firebase credentials missing).",
    });
  }

  const app: App =
    getApps()[0] ??
    initializeApp({
      credential: cert({
        type: `${c.firebaseType}`,
        projectId: `${c.firebaseProjectId}`,
        private_key_id: `${c.firebasePrivateKeyId}`,
        private_key: privateKey,
        client_email: `${c.firebaseClientEmail}`,
        client_id: `${c.firebaseClientId}`,
        auth_uri: `${c.firebaseAuthUri}`,
        token_uri: `${c.firebaseTokenUri}`,
        auth_provider_x509_cert_url: `${c.firebaseAuthProviderCertUrl}`,
        client_x509_cert_url: `${c.firebaseClientCertUrl}`,
      } as any),
    });

  cached = getFirestore(app);
  return cached;
}

/**
 * A stand-in for the Firestore client that keeps the existing call sites —
 * `firestore.collection(...)`, `firestore.doc(...)` — working unchanged. The
 * real client is built on the first property access, so importing this costs
 * nothing until a contact endpoint actually uses it.
 */
export const firestore: Firestore = new Proxy({} as Firestore, {
  get(_target, prop) {
    const client = firestoreClient();
    const value = (client as any)[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
