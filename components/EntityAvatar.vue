<script setup lang="ts">
import { TwFeather } from "vue3-tailwind";

/**
 * The picture beside a row — a client's photograph, a centre's logo, an account's
 * profile image — with an icon standing in whenever there isn't one.
 *
 * Every list did this with a bare <img> whose src fell back to
 * `/placeholder.png`, a file that does not exist in public/. So a record without
 * a picture got the browser's broken-image glyph and a 404 in the console, and
 * so did a record whose stored path pointed at a file that had since been
 * removed — which is most of them, because deleting a client unlinks its
 * photograph.
 *
 * Two cases, one component: nothing stored, and stored-but-unloadable. The
 * second is only knowable at runtime, so the `error` flag comes from the img's
 * own onerror rather than from checking the path.
 */
const props = withDefaults(
  defineProps<{
    src?: string | null;
    alt?: string;
    /** Which stand-in suits the row: a person, a centre, an organisation. */
    kind?: "person" | "centre" | "organisation";
    /** Tailwind size classes — the caller controls the scale. */
    size?: string;
    square?: boolean;
    /** The stand-in icon does not scale with `size` on its own. */
    iconSize?: number;
  }>(),
  { alt: "", kind: "person", size: "h-10 w-10", square: false, iconSize: 18 }
);

const config = useRuntimeConfig();

/** Stored paths are relative to public/; absolute ones are left alone. */
const resolved = computed(() => {
  const s = (props.src ?? "").trim();
  if (!s) return null;
  if (/^(https?:)?\/\//.test(s) || s.startsWith("data:")) return s;
  return `${config.public.origin}/${s.replace(/^\/+/, "")}`;
});

const failed = ref(false);
// A new row can reuse this component instance, so a previous failure must not
// stick to a different picture.
watch(resolved, () => (failed.value = false));

const showImage = computed(() => !!resolved.value && !failed.value);

const ICON: Record<string, string> = {
  person: "user",
  centre: "home",
  organisation: "briefcase",
};
</script>

<template>
  <img
    v-if="showImage"
    :src="resolved!"
    :alt="alt"
    loading="lazy"
    class="shrink-0 border border-gray-200 object-cover dark:border-gray-600"
    :class="[size, square ? 'rounded-lg' : 'rounded-full']"
    @error="failed = true"
  />
  <span
    v-else
    class="flex shrink-0 items-center justify-center bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
    :class="[size, square ? 'rounded-lg' : 'rounded-full']"
    :aria-label="alt || undefined"
    role="img"
  >
    <TwFeather :type="ICON[kind]" :size="iconSize" />
  </span>
</template>
