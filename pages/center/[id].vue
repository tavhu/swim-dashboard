<template>
    <div>
        <h1>Service Center Details</h1>
        <div v-if="serviceCenter">
            <pre>{{ serviceCenter }}</pre>
        </div>
        <button @click="generatePdf">Save as PDF</button>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import jsPDF from 'jspdf';

const route = useRoute();
const serviceCenter = ref(null);

onMounted(async () => {
    const id = route.params.id;
    const response = await fetch(`/api/center/get.post.ts`, {
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

const generatePdf = () => {
    if (serviceCenter.value) {
        const doc = new jsPDF();
        doc.text(JSON.stringify(serviceCenter.value, null, 2), 10, 10);
        doc.save('service-center.pdf');
    }
};
</script>
