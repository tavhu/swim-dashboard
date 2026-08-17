# SWIMS Autofill

A Chrome extension that fills a SWIMS form with plausible Khmer test data in one
click, so testing a seventy-field form does not mean typing seventy fields.

## Install

1. Chrome → `chrome://extensions`
2. Turn on **Developer mode** (top right)
3. **Load unpacked** → choose this folder (`tools/swims-autofill`)
4. Pin it, open a SWIMS form, click the icon → **Fill this page**

## What it fills

| Control | How |
|---|---|
| text, textarea, number, email | value + `input`/`change` events |
| native `<select>` | random option, skipping the placeholder |
| radio | one per group, chosen at random |
| checkbox | each ~45%, so multi-selects get a realistic spread |
| date picker | opens the calendar and clicks a day |
| custom dropdowns | clicks the trigger, then an option |
| file upload | **off by default** — tick the box to attach a small PNG |

## The data is chosen to fit the field

Field intent comes from the visible Khmer label first, attributes second, so:

- ឈ្មោះ → a Khmer name · លេខទូរស័ព្ទ → an 0xx Cambodian mobile
- អាសយដ្ឋាន → village, commune, district, province
- មុខរបរ → an occupation · បរិយាយ / សន្និដ្ឋាន → a case-note sentence
- អ៊ីមែល → an address · កាលបរិច្ឆេទ → a picked date

Plausible data beats `asdasd`: it makes truncation, wrapping and layout problems
visible while you enter it, which is most of why you are entering it.

Free-text and organisation/centre names are prefixed **`[TEST]`** so every row
this tool creates can be found and deleted afterwards.

## Options

- **Overwrite filled fields** — off by default, so prefilled values (the centre
  and interviewer carried from ទម្រង់ទី១, for instance) are left as they are.
- **Attach a test file** — off by default.

## Why the techniques differ per control

This is the part that makes a naive autofiller fill a form that then saves
empty. Each was arrived at by driving these exact widgets:

- Setting `.checked` on a radio or checkbox and dispatching `change` does **not**
  reliably update an array `v-model` — a multi-select ends up with one entry
  while several appear ticked. `.click()` does work.
- `@vuepic/vue-datepicker` ignores typed input completely. The menu has to be
  opened and a day cell clicked, and any menu already open has to be closed
  first or the click just toggles it shut.
- `vue3-tailwind`'s `TwSelect` is not a `<select>`; it needs the trigger clicked
  and then an option.
- Plain inputs need the value set through the prototype setter so Vue's listener
  sees a real change.

## Scope

`host_permissions` is localhost only, and the scripts are injected per click
rather than declared in the manifest, so the extension touches nothing until you
point it at a page. It writes test data — do not run it against production.

## Verified

Against ទម្រង់ទី៣: 4 textareas, 3 selects and 4 date pickers filled, with the
មូលហេតុ field getting a referral reason rather than generic text, and the three
prefilled provider fields correctly left alone.

Against ទម្រង់ទី៦: 7 textareas, 8 checkboxes visited with 4 ticked, and the
conditional ក/ខ sections handled — it settled on មិនជោគជ័យ with four failure
reasons. The form then saved, and the database held the right outcome, the four
reasons comma-separated, and `successReason` correctly null.
