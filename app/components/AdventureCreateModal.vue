<script setup lang="ts">
const props = defineProps<{
    open: boolean;
    systemId: string;
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

async function createAdventure() {
    const name = formName.value.trim();
    if (!name) return;
    creating.value = true;
    createError.value = null;
    try {
        await $fetch('/api/adventures', {
            method: 'POST',
            body: {
                systemId: props.systemId,
                name,
                description: formDescription.value.trim() || undefined,
                password: getPassword(),
            },
        });
        emit('update:open', false);
        emit('created');
        toast.add({ title: 'Adventure created', color: 'success', icon: 'i-heroicons-check-circle' });
    } catch (e: unknown) {
        createError.value = e instanceof Error ? e.message : 'Could not create adventure';
    } finally {
        creating.value = false;
    }
}
</script>

<template>
    <UModal
        :open="open"
        title="New Adventure"
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
                        placeholder="e.g. The Lost Mines"
                        autofocus
                        @keyup.enter="createAdventure"
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
                    @click="createAdventure"
                >
                    Create
                </UButton>
            </div>
        </template>
    </UModal>
</template>
