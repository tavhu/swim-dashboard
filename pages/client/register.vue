<script setup lang="ts">
const task = ref(0)
const ClientRegister = useClientRegisterSaved()
const steps = [
      '(១) សំណុំឯកសារផ្ទាល់ខ្លួនរបស់អតិថិជន',
      'Migrating...',
      'Deploying...'
]
</script>

<template>
      <div>
            <UProgress :value="task" :max="steps">
                  <!-- <template #step-0="{ step }">
                        <span class="text-lime-500">
                              <UIcon name="i-heroicons-arrow-down-circle" /> 
                              {{ step }}
                        </span>
                  </template>
                  <template #step-1="{ step }">
                        <span class="text-amber-500">
                              <UIcon name="i-heroicons-circle-stack" />
                              {{ step }}
                        </span>
                  </template>
                  <template #step-2="{ step }">
                        <span class="text-blue-500">
                              <UIcon name="i-heroicons-hand-thumb-up" /> 
                              {{ step }}
                        </span>
                  </template> -->
            </UProgress>
            <!-- {{ ClientRegister }} -->
            <div class="flex justify-between mb-5 mt-5 sticky">
                  <UButton color="primary" icon="i-heroicons-arrow-left" type="button" @click="task > 0 ? task-- : task = 0"
                        :disabled="(task == 0)" size="lg" class="px-4"> ថយក្រោយ
                  </UButton>
                  <UButton color="primary" icon="i-heroicons-arrow-right"
                        @click=" task < steps.length - 1 ? task++ : task = steps.length - 1" type="button" size="lg"
                        class="px-4"> ទៅមុខ
                  </UButton>
            </div>
            <ClientPersonalForm :readOnly="false" v-if="task == 0" :id="'clsk3eczv00072humjjluwwn4'">
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


 