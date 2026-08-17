/**
 * Remembers the language the user picked, without ever guessing it.
 *
 * `detectBrowserLanguage` is off in nuxt.config, deliberately: with it on, a
 * laptop reporting `Accept-Language: en` opened the whole ministry system in
 * English on first visit. Khmer is the system's language and stays the default.
 *
 * Turning detection off also turns off i18n's own cookie, though, so a user who
 * chose English was back in Khmer on the next reload. This restores an explicit
 * choice and nothing else: the cookie is only ever written by the switcher, so
 * a first-time visitor still gets Khmer.
 *
 * `nuxtApp.$i18n`, not `useI18n()` — the composable may only be called from a
 * component's setup, and a plugin body is not one.
 */
const COOKIE = "swims_locale";

export default defineNuxtPlugin((nuxtApp) => {
  const i18n = nuxtApp.$i18n as any;
  if (!i18n) return;

  // A year: this is a preference, not a session. sameSite lax so it survives
  // ordinary navigation back into the app.
  const stored = useCookie<string | null>(COOKIE, {
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    path: "/",
  });

  const codes = () =>
    (unref(i18n.locales) as any[]).map((l) => (typeof l === "string" ? l : l.code));

  if (stored.value && codes().includes(stored.value) && stored.value !== unref(i18n.locale)) {
    i18n.setLocale(stored.value);
  }

  watch(
    () => unref(i18n.locale),
    (next) => {
      if (next && codes().includes(next)) stored.value = next as string;
    }
  );
});
