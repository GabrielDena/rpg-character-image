<script setup lang="ts">
import type { Location } from '#shared/types/models';
import type { BackgroundWithUrl } from '~/types/background';

const props = defineProps<{
    open: boolean;
    adventureId: string;
    systemId: string;
    locations: Location[];
    background?: BackgroundWithUrl | null;
}>();

const emit = defineEmits<{
    'update:open': [value: boolean];
    created: [background: BackgroundWithUrl];
    updated: [background: BackgroundWithUrl];
}>();

const toast = useToast();

const isEditing = computed(() => !!props.background);

const formName = ref('');
const formLocationId = ref<string>('');
const selectedFile = ref<File | null>(null);
const previewUrl = ref<string | null>(null);
const fileInputRef = ref<HTMLInputElement>();
const saving = ref(false);
const saveError = ref<string | null>(null);

watch(
    () => props.open,
    (val) => {
        if (val) {
            formName.value = props.background?.name ?? '';
            formLocationId.value = props.background?.locationId ?? '';
            selectedFile.value = null;
            previewUrl.value = props.background?.url ?? null;
            saveError.value = null;
        }
    }
);

function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    selectedFile.value = file;
    previewUrl.value = URL.createObjectURL(file);
}

function getPassword() {
    return localStorage.getItem('app_password') ?? '';
}

async function save() {
    const name = formName.value.trim();
    if (!name) return;
    if (!isEditing.value && !selectedFile.value) return;

    saving.value = true;
    saveError.value = null;

    try {
        const fd = new FormData();
        fd.append('name', name);
        fd.append('password', getPassword());
        if (formLocationId.value) fd.append('locationId', formLocationId.value);
        else fd.append('locationId', '');

        if (isEditing.value) {
            if (selectedFile.value) fd.append('file', selectedFile.value);
            const { background } = await $fetch<{ background: BackgroundWithUrl }>(
                `/api/backgrounds/${props.background!.id}`,
                { method: 'PATCH', body: fd }
            );
            emit('updated', background);
        } else {
            fd.append('adventureId', props.adventureId);
            fd.append('systemId', props.systemId);
            fd.append('file', selectedFile.value!);
            const { background } = await $fetch<{ background: BackgroundWithUrl }>(
                '/api/backgrounds',
                { method: 'POST', body: fd }
            );
            emit('created', background);
        }

        emit('update:open', false);
        toast.add({
            title: isEditing.value ? 'Background updated' : 'Background created',
            color: 'success',
            icon: 'i-heroicons-check-circle',
        });
    } catch (e: unknown) {
        saveError.value = e instanceof Error ? e.message : 'Something went wrong';
    } finally {
        saving.value = false;
    }
}

function close() {
    emit('update:open', false);
}
</script>

<template>
    <UModal
        :open="open"
        :title="isEditing ? 'Edit Background' : 'New Background'"
        :content="{ onOpenAutoFocus: (e: Event) => e.preventDefault() }"
        @update:open="emit('update:open', $event)"
    >
        <template #body>
            <div class="space-y-4">
                <!-- Image -->
                <div class="flex flex-col items-center gap-3">
                    <div
                        class="relative h-40 w-full overflow-hidden rounded-xl bg-gray-800"
                        :class="{ 'cursor-pointer': true }"
                        @click="fileInputRef?.click()"
                    >
                        <img
                            v-if="previewUrl"
                            :src="previewUrl"
                            class="size-full object-cover"
                            alt="Background preview"
                        />
                        <div
                            v-else
                            class="flex size-full flex-col items-center justify-center gap-2 text-gray-500"
                        >
                            <UIcon
                                name="i-heroicons-photo"
                                class="size-8"
                            />
                            <p class="text-sm">Click to choose image</p>
                        </div>
                        <div
                            class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100"
                        >
                            <p class="text-sm font-medium text-white">
                                {{ previewUrl ? 'Replace image' : 'Choose image' }}
                            </p>
                        </div>
                    </div>
                    <input
                        ref="fileInputRef"
                        type="file"
                        accept="image/*"
                        class="hidden"
                        @change="handleFileSelect"
                    />
                </div>

                <!-- Name -->
                <UFormField
                    label="Name"
                    required
                >
                    <UInput
                        v-model="formName"
                        placeholder="e.g. Tavern Interior"
                        autofocus
                        @keyup.enter="save"
                    />
                </UFormField>

                <!-- Location -->
                <UFormField label="Location">
                    <select
                        v-model="formLocationId"
                        class="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-100 outline-none focus:ring-1 focus:ring-primary-500"
                    >
                        <option value="">None</option>
                        <option
                            v-for="loc in props.locations"
                            :key="loc.id"
                            :value="loc.id"
                        >
                            {{ loc.name }}
                        </option>
                    </select>
                </UFormField>

                <p
                    v-if="saveError"
                    class="text-sm text-red-400"
                >
                    {{ saveError }}
                </p>
            </div>
        </template>

        <template #footer>
            <div class="flex justify-end gap-2">
                <UButton
                    color="neutral"
                    variant="ghost"
                    @click="close"
                >
                    Cancel
                </UButton>
                <UButton
                    :loading="saving"
                    :disabled="!formName.trim() || (!isEditing && !selectedFile)"
                    @click="save"
                >
                    {{ isEditing ? 'Save' : 'Create' }}
                </UButton>
            </div>
        </template>
    </UModal>
</template>
