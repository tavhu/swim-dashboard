<script setup lang="ts">
import { TwErrorMessage } from "vue3-tailwind";

/**
 * The message under a field that failed validation.
 *
 * vue3-tailwind writes its own text — "The fullNameKH is required!" — which has
 * two problems now that these messages are actually being shown. It is English
 * in a Khmer form, and it names the database column rather than the field: an
 * officer reading "fullNameKH" has to work out that it means នាមត្រកូលនិងនាមខ្លួន,
 * which is printed directly above it.
 *
 * So the rule is recognised and re-stated in the user's language, and the field
 * is not named at all — the label is right there. Anything unrecognised is shown
 * as it came, rather than swallowed: a message we did not anticipate is still
 * better than no message.
 */
defineProps<{
  name: string;
}>();

/** Map the library's English sentence back to which rule failed. */
function localise(raw: string): string {
  const s = String(raw);
  if (/is required/i.test(s)) return tr("ត្រូវការបំពេញ");
  if (/must be a number|numeric/i.test(s)) return tr("ត្រូវតែជាលេខ");
  if (/valid email/i.test(s)) return tr("អាសយដ្ឋានអ៊ីមែលមិនត្រឹមត្រូវ");
  if (/at least|minimum|min:/i.test(s)) return tr("ខ្លីជាងកំណត់");
  if (/at most|maximum|max:/i.test(s)) return tr("វែងជាងកំណត់");
  return s;
}
</script>

<template>
  <TwErrorMessage :name="name">
    <template v-slot="{ errors }">
      <ul v-if="errors" class="list-disc pl-6 text-sm font-[battambang] text-red-600">
        <li v-for="(error, index) in errors" :key="`${name}-${index}`">
          {{ localise(error) }}
        </li>
      </ul>
    </template>
  </TwErrorMessage>
</template>
