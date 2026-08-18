/**
 * Re-export of the shared page list.
 *
 * The list itself lives in shared/ because the route middleware and the sidebar
 * need it in the browser, and Nuxt does not bundle server/ into the client.
 * This file keeps the server-side auto-import working.
 */
export * from "../../shared/appResources";
