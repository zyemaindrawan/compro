<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { PublicForm } from '#shared/types/models'
import { buildSubmissionSchema, emptySubmission } from '#shared/utils/form-validation'

const props = withDefaults(defineProps<{
  form: PublicForm
  prefill?: Record<string, unknown>
  context?: { service?: string, plan?: string }
}>(), {
  prefill: () => ({}),
  context: () => ({}),
})

const route = useRoute()
const schema = computed(() => buildSubmissionSchema(props.form.fields))
const state = reactive<Record<string, unknown>>({ ...emptySubmission(props.form.fields), ...props.prefill })
const formRef = useTemplateRef('formRef')
const turnstileRef = useTemplateRef('turnstileRef')

const turnstileToken = ref('')
const formToken = ref('')
const honeypot = ref('')
const sending = ref(false)
const attempted = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

onMounted(async () => {
  try {
    formToken.value = (await $fetch<{ token: string }>('/api/public/form-token')).token
  }
  catch {
    formToken.value = ''
  }
})

async function onSubmit(_event: FormSubmitEvent<Record<string, unknown>>) {
  errorMessage.value = ''
  if (!turnstileToken.value) {
    formRef.value?.setErrors([{ name: 'turnstile', message: 'Please wait for the spam check to finish.' }])
    return
  }
  sending.value = true
  try {
    const result = await $fetch<{ message: string }>(`/api/public/submissions/${props.form.key}`, {
      method: 'POST',
      body: {
        values: { ...state },
        turnstileToken: turnstileToken.value,
        formToken: formToken.value,
        website: honeypot.value,
        sourcePath: route.path,
        service: props.context.service ?? '',
        plan: props.context.plan ?? '',
      },
    })
    successMessage.value = result.message
  }
  catch (error) {
    errorMessage.value = apiErrorMessage(error)
    formRef.value?.setErrors(apiFieldErrors(error))
    turnstileRef.value?.reset()
  }
  finally {
    sending.value = false
  }
}

function startOver() {
  Object.assign(state, emptySubmission(props.form.fields), props.prefill)
  successMessage.value = ''
}
</script>

<template>
  <div
    v-if="successMessage"
    class="flex flex-col items-start gap-4 rounded-lg border border-default bg-elevated/50 p-6"
    role="status"
  >
    <UIcon
      name="i-lucide-circle-check"
      class="size-7 text-success"
    />
    <p class="text-lg text-highlighted">
      {{ successMessage }}
    </p>
    <UButton
      label="Send another message"
      color="neutral"
      variant="outline"
      @click="startOver"
    />
  </div>
  <UForm
    v-else
    ref="formRef"
    :schema="schema"
    :state="state"
    class="relative grid gap-5 sm:grid-cols-2"
    @submit="onSubmit"
    @error="attempted = true"
  >
    <DynamicField
      v-for="field in form.fields"
      :key="field.id"
      v-model="state[field.name]"
      :field="field"
      :eager="attempted"
    />

    <div
      class="absolute -left-[9999px] h-px w-px overflow-hidden"
      aria-hidden="true"
    >
      <label for="website-field">Website</label>
      <input
        id="website-field"
        v-model="honeypot"
        type="text"
        name="website"
        tabindex="-1"
        autocomplete="off"
      >
    </div>

    <UFormField
      name="turnstile"
      class="sm:col-span-2"
    >
      <TurnstileWidget
        ref="turnstileRef"
        v-model="turnstileToken"
      />
    </UFormField>

    <UAlert
      v-if="errorMessage"
      color="error"
      variant="subtle"
      icon="i-lucide-circle-alert"
      :title="errorMessage"
      class="sm:col-span-2"
      role="alert"
    />

    <div class="sm:col-span-2">
      <UButton
        type="submit"
        :label="form.submitLabel"
        :loading="sending"
        size="lg"
        trailing-icon="i-lucide-arrow-right"
      />
    </div>
  </UForm>
</template>
