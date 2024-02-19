<script setup lang="ts">
const task = ref(0)
// const ClientRegister = useClientRegisterSaved()
// const steps = [
//       '(១)សំណុំឯកសារផ្ទាល់ខ្លួនរបស់អតិថិជន',
//       '(២)ការប៉ាន់ប្រមាណាណតម្រូការសម្រាប់អតិថិជនក្នុងមជ្ឈមណ្ឌលព្យាបាល និងស្តារនីតិសម្បទា',
//       '(៣)ទម្រង់ស្វែងរកគ្រួសារ',
//       '(៤)ទម្រង់ប៉ាន់ប្រមាណគ្រួសារ',
//       '(៥)ទម្រង់ផែនការករណី និងសេវាគាំទ្រសង្គម',
//       '(៦)ទម្រង់សម្រាប់បញ្ជូនទៅកាន់សេវាផ្សេងៗ',
//       '(៧)ទម្រង់សមាហរកម្ម',
//       '(៨)ទម្រង់លទ្ធផលនៃការចុះសួរសុខទុក្ខ និងតាមដានដោយមន្ត្រីឬភ្នាក់ងារសង្គមកិច្ច',
// ]
// const router = useRouter().currentRoute.value.params
const route = useRoute().params

</script>
<template>
      <div>
            <ClientPersonalForm :readOnly="false" v-if="task == 0" :id="
                  //@ts-ignored
                  route?.id ? route?.id : ''">
            </ClientPersonalForm>

      </div>
</template>

<style>
.loader {
      display: block;
      position: fixed;
      z-index: 1031;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 18px;
      height: 18px;
      box-sizing: border-box;
      border: solid 2px transparent;
      border-top-color: #000;
      border-left-color: #000;
      border-bottom-color: #efefef;
      border-right-color: #efefef;
      border-radius: 50%;
      -webkit-animation: loader 400ms linear infinite;
      animation: loader 400ms linear infinite;
}

@-webkit-keyframes loader {
      0% {
            -webkit-transform: translate(-50%, -50%) rotate(0deg);
      }

      100% {
            -webkit-transform: translate(-50%, -50%) rotate(360deg);
      }
}

@keyframes loader {
      0% {
            transform: translate(-50%, -50%) rotate(0deg);
      }

      100% {
            transform: translate(-50%, -50%) rotate(360deg);
      }
}
</style>


 