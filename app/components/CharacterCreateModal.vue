<script setup lang="ts">
const props = defineProps<{
    open: boolean;
    adventureId: string;
}>();

const emit = defineEmits<{
    'update:open': [value: boolean];
    created: [];
}>();

const toast = useToast();
const formName = ref('');
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
            createError.value = null;
        }
    }
);

async function createCharacter() {
    const name = formName.value.trim();
    if (!name) return;
    creating.value = true;
    createError.value = null;
    try {
        await $fetch('/api/characters', {
            method: 'POST',
            body: { adventureId: props.adventureId, name, password: getPassword() },
        });
        emit('update:open', false);
        emit('created');
        toast.add({ title: 'Character created', color: 'success', icon: 'i-heroicons-check-circle' });
    } catch (e: unknown) {
        createError.value = e instanceof Error ? e.message : 'Could not create character';
    } finally {
        creating.value = false;
    }
}
</script>

<template>
    <UModal
        :open="open"
        title="New Character"
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
                        placeholder="e.g. Evara Dawnseeker"
                        autofocus
                        @keyup.enter="createCharacter"
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
                    @click="createCharacter"
                >
                    Create
                </UButton>
            </div>
        </template>
    </UModal>
</template>
