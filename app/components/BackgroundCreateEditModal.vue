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
    deleted: [id: string];
}>();

const toast = useToast();

const isEditing = computed(() => !!props.background);

const formName = ref('');
const formLocationId = ref<string>('');
const selectedFile = ref<File | null>(null);
const previewUrl = ref<string | null>(null);
const fileInputRef = ref<HTMLInputElement>();
const selectedAltFile = ref<File | null>(null);
const altPreviewUrl = ref<string | null>(null);
const altFileInputRef = ref<HTMLInputElement>();
const clearAlt = ref(false);
const saving = ref(false);
const saveError = ref<string | null>(null);
const showDeleteConfirm = ref(false);
const deleting = ref(false);

watch(
    () => props.open,
    (val) => {
        if (val) {
            formName.value = props.background?.name ?? '';
            formLocationId.value = props.background?.locationId ?? '';
            selectedFile.value = null;
            previewUrl.value = props.background?.url ?? null;
            selectedAltFile.value = null;
            altPreviewUrl.value = props.background?.altUrl ?? null;
            clearAlt.value = false;
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

function handleAltFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    selectedAltFile.value = file;
    altPreviewUrl.value = URL.createObjectURL(file);
    clearAlt.value = false;
}

function removeAltImage() {
    selectedAltFile.value = null;
    altPreviewUrl.value = null;
    clearAlt.value = true;
    if (altFileInputRef.value) altFileInputRef.value.value = '';
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
            if (selectedAltFile.value) fd.append('altFile', selectedAltFile.value);
            else if (clearAlt.value) fd.append('clearAlt', 'true');
            const { background } = await $fetch<{ background: BackgroundWithUrl }>(
                `/api/backgrounds/${props.background!.id}`,
                { method: 'PATCH', body: fd }
            );
            emit('updated', background);
        } else {
            fd.append('adventureId', props.adventureId);
            fd.append('systemId', props.systemId);
            fd.append('file', selectedFile.value!);
            if (selectedAltFile.value) fd.append('altFile', selectedAltFile.value);
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

async function confirmDelete() {
    if (!props.background) return;
    deleting.value = true;
    try {
        await $fetch(`/api/backgrounds/${props.background.id}`, {
            method: 'DELETE',
            body: { password: getPassword() },
        });
        emit('deleted', props.background.id);
        emit('update:open', false);
        toast.add({ title: 'Background deleted', color: 'success' });
    } catch (e: unknown) {
        saveError.value = e instanceof Error ? e.message : 'Delete failed';
    } finally {
        deleting.value = false;
        showDeleteConfirm.value = false;
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
                <!-- Images -->
                <div class="grid grid-cols-2 gap-3">
                    <!-- Default image -->
                    <div class="flex flex-col gap-1">
                        <p class="text-xs font-medium text-gray-400">Default <span class="text-red-400">*</span></p>
                        <div
                            class="relative h-36 w-full cursor-pointer overflow-hidden rounded-xl bg-gray-800"
                            @click="fileInputRef?.click()"
                        >
                            <img
                                v-if="previewUrl"
                                :src="previewUrl"
                                class="size-full object-cover"
                                alt="Default background preview"
                            />
                            <div
                                v-else
                                class="flex size-full flex-col items-center justify-center gap-2 text-gray-500"
                            >
                                <UIcon
                                    name="i-heroicons-photo"
                                    class="size-8"
                                />
                                <p class="text-xs">Click to choose</p>
                            </div>
                            <div
                                class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100"
                            >
                                <p class="text-xs font-medium text-white">
                                    {{ previewUrl ? 'Replace' : 'Choose' }}
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

                    <!-- Alternative image -->
                    <div class="flex flex-col gap-1">
                        <div class="flex items-center justify-between">
                            <p class="text-xs font-medium text-gray-400">Alternative</p>
                            <button
                                v-if="altPreviewUrl"
                                type="button"
                                class="text-xs text-gray-500 hover:text-red-400"
                                @click.stop="removeAltImage"
                            >
                                Remove
                            </button>
                        </div>
                        <div
                            class="relative h-36 w-full cursor-pointer overflow-hidden rounded-xl bg-gray-800"
                            @click="altFileInputRef?.click()"
                        >
                            <img
                                v-if="altPreviewUrl"
                                :src="altPreviewUrl"
                                class="size-full object-cover"
                                alt="Alternative background preview"
                            />
                            <div
                                v-else
                                class="flex size-full flex-col items-center justify-center gap-2 text-gray-500"
                            >
                                <UIcon
                                    name="i-heroicons-photo"
                                    class="size-8"
                                />
                                <p class="text-xs">Click to choose</p>
                            </div>
                            <div
                                class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100"
                            >
                                <p class="text-xs font-medium text-white">
                                    {{ altPreviewUrl ? 'Replace' : 'Choose' }}
                                </p>
                            </div>
                        </div>
                        <input
                            ref="altFileInputRef"
                            type="file"
                            accept="image/*"
                            class="hidden"
                            @change="handleAltFileSelect"
                        />
                    </div>
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
                    <div class="flex flex-wrap gap-2">
                        <button
                            type="button"
                            class="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
                            :class="formLocationId === '' ? 'border-violet-500 bg-violet-500/10 text-violet-300' : 'border-gray-700 text-gray-400 hover:border-gray-600'"
                            @click="void (formLocationId = '')"
                        >
                            None
                        </button>
                        <button
                            v-for="loc in props.locations"
                            :key="loc.id"
                            type="button"
                            class="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
                            :class="formLocationId === loc.id ? 'border-violet-500 bg-violet-500/10 text-violet-300' : 'border-gray-700 text-gray-400 hover:border-gray-600'"
                            @click="void (formLocationId = loc.id)"
                        >
                            {{ loc.name }}
                        </button>
                    </div>
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
            <div class="flex items-center justify-between gap-2">
                <UButton
                    v-if="isEditing"
                    color="error"
                    variant="ghost"
                    leading-icon="i-heroicons-trash"
                    @click="void (showDeleteConfirm = true)"
                >
                    Delete
                </UButton>
                <div
                    v-else
                    class="flex-1"
                />
                <div class="flex gap-2">
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
            </div>
        </template>
    </UModal>

    <UModal
        :open="showDeleteConfirm"
        title="Delete Background"
        :ui="{ content: 'sm:max-w-sm' }"
        :content="{ onOpenAutoFocus: (e: Event) => e.preventDefault() }"
        @update:open="(val) => void (showDeleteConfirm = val)"
    >
        <template #body>
            <p class="text-sm text-gray-300">
                Are you sure you want to delete <span class="font-medium text-gray-100">{{ props.background?.name }}</span>? This action cannot be undone.
            </p>
        </template>
        <template #footer>
            <div class="flex justify-end gap-2">
                <UButton
                    color="neutral"
                    variant="ghost"
                    :disabled="deleting"
                    @click="void (showDeleteConfirm = false)"
                >
                    Cancel
                </UButton>
                <UButton
                    color="error"
                    :loading="deleting"
                    @click="confirmDelete"
                >
                    Delete
                </UButton>
            </div>
        </template>
    </UModal>
</template>
