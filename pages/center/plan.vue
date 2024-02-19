<script setup lang="ts">
import {
    useToast,
    TwButton,
    TwErrorMessage,
    TwForm,
    TwInput,
    TwSelect
} from "vue3-tailwind";
import { array } from "zod";



const planing = ref('')//take serviceCenterID
</script>

<template>
    <div>

        <div>
            <h1 class="text-2xl font-[Moul] text-primary mb-3">
                ផែនការសកម្មភាពមជ្ឈមណ្ឌល
            </h1>
        </div>
        <!-- <table>
            <th>
            <td> លេខរៀង </td>
            <td> សកម្មភាពការងារ </td>
            <td> ពេលវេលាអនុវត្តសកម្មភាព </td>
            </th>
        </table> -->

        <TwForm
            class="grid grid-cols-12 gap-2 bg-white dark:bg-gray-900 dark:border dark:border-gray-700 rounded-lg p-2 shadow">
            <div class="col-span-6 ">
                <!-- flex justify-start  gap-3 mb-5 -->
                <TwFeather type="file-text" />
                <h1 class="text-lg"> សកម្មភាពការងារ </h1>
            </div>
            <div class="col-span-12 lg:col-span-6">
                <TwSelect label="ផែនការសកម្មភាព" name="typeDrugUsed" v-model="planing" required :items="[{
                    value: 'yearly', label: 'ផែនការប្រចាំឆ្នាំ'
                },
                { value: 'threeyear', label: 'ផែនការមធ្យម' },
                { value: 'longterm', label: 'ផែនការរយៈពេលវែង' },
                ]" placeholder="សូមជ្រើសរើស" />
                <CustomErrorMessage name="typeDrugUsed" />
            </div>
            <!-- <div class="col-span-12 lg:col-span-6">
                <TwInput label="លេខរៀង" name="ReadableCode" placeholder="លេខរៀង" type="text" />
                <CustomErrorMessage name="ReadableCode" />
            </div> -->
            <div class="col-span-12 flex justify-end gap-1 ">
                <UButton color="gray" type="button" square size="lg"
                    class="px-4 dark:text-gray-200 dark:!border-gray-800 dark:border" @click="">
                    កំណត់ឡើងវិញ
                </UButton>
                <UButton color="primary" type="submit" size="lg" class="px-4"> រក្សាទុក
                </UButton>
            </div>
        </TwForm>
    </div>
</template>