<template>
    <div>
        <h1>Service Center Details</h1>
        <div v-if="serviceCenter">
            <h2>{{ serviceCenter.nameEN }}</h2>
            <p><strong>Director:</strong> {{ serviceCenter.directorName }}</p>
            <p><strong>Email:</strong> {{ serviceCenter.email }}</p>
            <p><strong>Phone:</strong> {{ serviceCenter.phoneNumber }}</p>

            <h3>Staff</h3>
            <ul>
                <li v-for="s in serviceCenter.staff" :key="s.id">{{ s.firstName }} {{ s.lastName }} - {{ s.position }}</li>
            </ul>

            <h3>Government Staff</h3>
            <ul>
                <li v-for="s in serviceCenter.governStaff" :key="s.id">{{ s.firstNameKH }} {{ s.lastNameKH }} - {{ s.CurrentRank }}</li>
            </ul>

        </div>
        <button @click="generatePdf">Save as PDF</button>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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

const generatePdf = () => {
    if (serviceCenter.value) {
        const doc = new jsPDF();
        doc.text("Service Center Details", 14, 15);

        const serviceCenterDetails = [];
        for (const [key, value] of Object.entries(serviceCenter.value)) {
            if (typeof value !== 'object' && value !== null && value !== '') {
                serviceCenterDetails.push([key, value]);
            }
        }

        (doc as any).autoTable({
            head: [['Field', 'Value']],
            body: serviceCenterDetails,
            startY: 20,
        });

        if (serviceCenter.value.staff && serviceCenter.value.staff.length > 0) {
            doc.text("Staff", 14, (doc as any).lastAutoTable.finalY + 10);
            const staffDetails = serviceCenter.value.staff.map(s => [s.firstName, s.lastName, s.position]);
            (doc as any).autoTable({
                head: [['First Name', 'Last Name', 'Position']],
                body: staffDetails,
                startY: (doc as any).lastAutoTable.finalY + 15,
            });
        }

        if (serviceCenter.value.governStaff && serviceCenter.value.governStaff.length > 0) {
            doc.text("Government Staff", 14, (doc as any).lastAutoTable.finalY + 10);
            const governStaffDetails = serviceCenter.value.governStaff.map(s => [s.firstNameKH, s.lastNameKH, s.CurrentRank]);
            (doc as any).autoTable({
                head: [['First Name (KH)', 'Last Name (KH)', 'Rank']],
                body: governStaffDetails,
                startY: (doc as any).lastAutoTable.finalY + 15,
            });
        }

        doc.save(`service-center-${serviceCenter.value.id}.pdf`);
    }
};
</script>
