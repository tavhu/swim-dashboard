<template>
    <div class="container mx-auto p-4">
        <div v-if="serviceCenter" class="bg-white shadow-md rounded-lg p-6">
            <div class="flex items-center justify-between mb-4">
                <h1 class="text-2xl font-bold text-gray-800">{{ serviceCenter.nameEN }}</h1>
                <img :src="serviceCenter.logo" alt="Logo" class="h-16 w-16 object-contain" />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                <div>
                    <h2 class="text-lg font-semibold text-gray-700">Details</h2>
                    <ul class="mt-2 text-gray-600">
                        <li><strong>Director:</strong> {{ serviceCenter.directorName }}</li>
                        <li><strong>Email:</strong> {{ serviceCenter.email }}</li>
                        <li><strong>Phone:</strong> {{ serviceCenter.phoneNumber }}</li>
                        <li><strong>Website:</strong> <a :href="serviceCenter.website" target="_blank" class="text-blue-500 hover:underline">{{ serviceCenter.website }}</a></li>
                        <li><strong>Address:</strong> {{ serviceCenter.Address }}</li>
                    </ul>
                </div>
                <div>
                    <h2 class="text-lg font-semibold text-gray-700">About</h2>
                    <p class="mt-2 text-gray-600">{{ serviceCenter.overview }}</p>
                </div>
            </div>

            <div class="mt-6">
                <h2 class="text-xl font-bold text-gray-800">Staff</h2>
                <div class="overflow-x-auto mt-4">
                    <table class="min-w-full bg-white">
                        <thead class="bg-gray-800 text-white">
                            <tr>
                                <th class="py-2 px-4">Name</th>
                                <th class="py-2 px-4">Position</th>
                                <th class="py-2 px-4">Email</th>
                                <th class="py-2 px-4">Phone</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="s in serviceCenter.staff" :key="s.id" class="border-b">
                                <td class="py-2 px-4">{{ s.firstName }} {{ s.lastName }}</td>
                                <td class="py-2 px-4">{{ s.position }}</td>
                                <td class="py-2 px-4">{{ s.familyEmail }}</td>
                                <td class="py-2 px-4">{{ s.telephone }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="mt-6">
                <h2 class="text-xl font-bold text-gray-800">Government Staff</h2>
                <div class="overflow-x-auto mt-4">
                    <table class="min-w-full bg-white">
                        <thead class="bg-gray-800 text-white">
                            <tr>
                                <th class="py-2 px-4">Name (KH)</th>
                                <th class="py-2 px-4">Name (EN)</th>
                                <th class="py-2 px-4">Rank</th>
                                <th class="py-2 px-4">Email</th>
                                <th class="py-2 px-4">Phone</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="s in serviceCenter.governStaff" :key="s.id" class="border-b">
                                <td class="py-2 px-4">{{ s.firstNameKH }} {{ s.lastNameKH }}</td>
                                <td class="py-2 px-4">{{ s.firstNameEN }} {{ s.lastNameEN }}</td>
                                <td class="py-2 px-4">{{ s.CurrentRank }}</td>
                                <td class="py-2 px-4">{{ s.email }}</td>
                                <td class="py-2 px-4">{{ s.telephone }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
        <div v-else class="text-center text-gray-500">
            <p>Loading service center details...</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const serviceCenter = ref(null);

onMounted(async () => {
    const id = route.params.id;
    const response = await fetch(`/api/center/getSingle.post.ts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
    });
    if (response.ok) {
        const data = await response.json();
        serviceCenter.value = data;
    } else {
        console.error('Failed to fetch service center data');
    }
});
</script>
