<script setup >


//  import {TwFile} from "vue3-tailwind";
const files = ref();

async function handleImageUpload() {
  try {
    const fd = new FormData();
    Array.from(files.value).map((file, index) => {
      fd.append(index, file);
    });
    const { data } = await useFetch('/api/user/upload', {
      method: 'POST',
      body: fd,
    });
    console.log('data from backend is ', data.value);
  } catch (error) {
    console.log(error);
  }
}

function handleFile(e ) {
  
  files.value = e.target.files;
}
</script>

<template>
  <form @submit.prevent="handleImageUpload">
    <input multiple type="file" @change="handleFile($event)" />
    <!-- <TwFile multiple /> -->
    <br>
    <br>
    <input type="submit" class="btn "/>
  </form>
</template>
