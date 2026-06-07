<script setup lang="ts">
const props = defineProps<{
    open: boolean;
}>();

const emit = defineEmits<{
    'update:open': [value: boolean];
    created: [];
}>();

const toast = useToast();
const formName = ref('');
const formDescription = ref('');
const creating = ref(false);
const createError = ref<string | null>(null);

function getPassword() {
    return localStorage.getItem('app_password') ?? '';
}

watch(
    () => props.open,
    (val) => {
        if (val) {
            formName.value = '';
            formDescription.value = '';
            createError.value = null;
        }
    }
);

async function createSystem() {
    const name = formName.value.trim();
    if (!name) return;
    creating.value = true;
    createError.value = null;
    try {
        await $fetch('/api/systems', {
            method: 'POST',
            body: {
                name,
                description: formDescription.value.trim() || undefined,
                password: getPassword(),
            },
        });
        emit('update:open', false);
        emit('created');
        toast.add({ title: 'System created', color: 'success', icon: 'i-heroicons-check-circle' });
    } catch (e: unknown) {
        createError.value = e instanceof Error ? e.message : 'Could not create system';
    } finally {
        creating.value = false;
    }
}
</script>

<template>
    <UModal
        :open="open"
        title="New System"
        :content="{ onOpenAutoFocus: (e: Event) => e.preventDefault() }"
        @update:open="emit('update:open', $event)"
    >
        <template #body>
            <div class="space-y-4">
                <UFormField
                    label="Name"
                    required
                >
                    <UInput
                        v-model="formName"
                        placeholder="e.g. Dungeons & Dragons 5e"
                        autofocus
                        @keyup.enter="createSystem"
                    />
                </UFormField>
                <UFormField label="Description">
                    <UTextarea
                        v-model="formDescription"
                        placeholder="Optional description"
                        :rows="3"
                    />
                </UFormField>
                <p
                    v-if="createError"
                    class="text-sm text-red-400"
                >
                    {{ createError }}
                </p>
            </div>
        </template>
        <template #footer>
            <div class="flex justify-end gap-2">
                <UButton
                    color="neutral"
                    variant="ghost"
                    @click="emit('update:open', false)"
                >
                    Cancel
                </UButton>
                <UButton
                    :loading="creating"
                    :disabled="!formName.trim()"
                    @click="createSystem"
                >
                    Create
                </UButton>
            </div>
        </template>
    </UModal>
</template>
