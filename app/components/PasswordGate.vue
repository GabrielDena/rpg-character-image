<script setup lang="ts">
const emit = defineEmits<{
    authenticated: [];
}>();

const passwordInput = ref('');
const verifying = ref(false);
const passwordError = ref<string | null>(null);
const showPassword = ref(false);

async function verifyPassword() {
    if (!passwordInput.value) return;
    verifying.value = true;
    passwordError.value = null;
    try {
        await $fetch('/api/auth/verify', {
            method: 'POST',
            body: { password: passwordInput.value },
        });
        localStorage.setItem('app_password', passwordInput.value);
        emit('authenticated');
    } catch {
        passwordError.value = 'Incorrect password';
    } finally {
        verifying.value = false;
    }
}
</script>

<template>
    <div class="flex h-full flex-col items-center justify-center bg-gray-950 px-6">
        <div class="w-full max-w-xs space-y-4">
            <p class="text-center text-sm font-medium text-gray-300">Enter password to continue</p>
            <UInput
                v-model="passwordInput"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Password"
                size="lg"
                :disabled="verifying"
                autofocus
                @keyup.enter="verifyPassword"
            >
                <template #trailing>
                    <UButton
                        variant="link"
                        color="neutral"
                        size="xs"
                        :icon="showPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                        :padded="false"
                        @click="showPassword = !showPassword"
                    />
                </template>
            </UInput>
            <p
                v-if="passwordError"
                class="text-center text-sm text-red-400"
            >
                {{ passwordError }}
            </p>
            <UButton
                block
                size="lg"
                :loading="verifying"
                :disabled="!passwordInput"
                @click="verifyPassword"
            >
                Continue
            </UButton>
        </div>
    </div>
</template>
