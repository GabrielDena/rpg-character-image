<script setup lang="ts">
export interface CharacterWithUrl {
    id: string;
    adventureId: string;
    name: string;
    type: string;
    playbook: string | null;
    description: string | null;
    avatarPath: string | null;
    avatarUrl: string | null;
    createdAt: Date;
}

interface ImagePreview {
    uid: string;
    file: File;
    previewUrl: string;
    isDefault: boolean;
}

interface ExistingImage {
    id: string;
    characterId: string;
    storagePath: string;
    url: string | null;
    isProfile: boolean;
    createdAt: Date;
}

const props = defineProps<{
    open: boolean;
    adventureId: string;
    systemId: string;
    character?: CharacterWithUrl | null;
}>();

const emit = defineEmits<{
    'update:open': [value: boolean];
    created: [];
    updated: [];
}>();

const isEditing = computed(() => !!props.character);

const toast = useToast();

const formName = ref('');
const formType = ref<'pc' | 'npc'>('npc');
const formPlaybook = ref('');
const formDescription = ref('');
const creating = ref(false);
const createError = ref<string | null>(null);

const avatarBlob = ref<Blob | null>(null);
const avatarPreviewUrl = ref<string | null>(null);
const avatarInputRef = ref<HTMLInputElement>();
const imagesInputRef = ref<HTMLInputElement>();
const removeBgInputRef = ref<HTMLInputElement>();

const imagesPreviews = ref<ImagePreview[]>([]);
const existingImages = ref<ExistingImage[]>([]);
const loadingImages = ref(false);
const removingBg = ref(false);

function getPassword() {
    return localStorage.getItem('app_password') ?? '';
}

function reset() {
    formName.value = '';
    formType.value = 'npc';
    formPlaybook.value = '';
    formDescription.value = '';
    avatarBlob.value = null;
    if (avatarPreviewUrl.value?.startsWith('blob:')) URL.revokeObjectURL(avatarPreviewUrl.value);
    avatarPreviewUrl.value = null;
    imagesPreviews.value.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    imagesPreviews.value = [];
    existingImages.value = [];
    loadingImages.value = false;
    removingBg.value = false;
    createError.value = null;
}

async function fetchExistingImages(characterId: string) {
    loadingImages.value = true;
    try {
        const { images } = await $fetch<{ images: ExistingImage[] }>('/api/character-images', {
            query: { characterId },
        });
        existingImages.value = images;
    } catch {
        // non-fatal
    } finally {
        loadingImages.value = false;
    }
}

async function populateFromCharacter(c: CharacterWithUrl) {
    formName.value = c.name;
    formType.value = (c.type as 'pc' | 'npc') ?? 'npc';
    formPlaybook.value = c.playbook ?? '';
    formDescription.value = c.description ?? '';
    avatarBlob.value = null;
    if (avatarPreviewUrl.value?.startsWith('blob:')) URL.revokeObjectURL(avatarPreviewUrl.value);
    avatarPreviewUrl.value = c.avatarUrl ?? null;
    imagesPreviews.value = [];
    existingImages.value = [];
    createError.value = null;
    await fetchExistingImages(c.id);
}

watch(
    () => props.open,
    async (val) => {
        if (val) {
            if (props.character) await populateFromCharacter(props.character);
            else reset();
        }
    }
);

function handleAvatarSelect(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (avatarPreviewUrl.value) URL.revokeObjectURL(avatarPreviewUrl.value);
    avatarBlob.value = file;
    avatarPreviewUrl.value = URL.createObjectURL(file);
    (e.target as HTMLInputElement).value = '';
}

function addToPending(file: File) {
    const noDefault =
        !existingImages.value.some((i) => i.isProfile) &&
        !imagesPreviews.value.some((i) => i.isDefault);
    imagesPreviews.value.push({
        uid: Math.random().toString(36).slice(2),
        file,
        previewUrl: URL.createObjectURL(file),
        isDefault: noDefault,
    });
}

function handleImagesSelect(e: Event) {
    Array.from((e.target as HTMLInputElement).files ?? []).forEach(addToPending);
    (e.target as HTMLInputElement).value = '';
}

async function handleRemoveBgSelect(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    (e.target as HTMLInputElement).value = '';
    removingBg.value = true;
    try {
        const { removeBackground } = await import('@imgly/background-removal');
        const blob = await removeBackground(file);
        const name = file.name.replace(/\.[^.]+$/, '') + '_nobg.png';
        addToPending(new File([blob], name, { type: 'image/png' }));
    } catch {
        toast.add({ title: 'Background removal failed', color: 'error' });
    } finally {
        removingBg.value = false;
    }
}

function setPendingDefault(uid: string) {
    imagesPreviews.value.forEach((img) => {
        img.isDefault = img.uid === uid;
    });
    existingImages.value.forEach((img) => {
        img.isProfile = false;
    });
}

function removePending(uid: string) {
    const idx = imagesPreviews.value.findIndex((img) => img.uid === uid);
    if (idx === -1) return;
    const [removed] = imagesPreviews.value.splice(idx, 1);
    URL.revokeObjectURL(removed.previewUrl);
    if (removed.isDefault && imagesPreviews.value.length > 0) {
        imagesPreviews.value[0].isDefault = true;
    }
}

async function setExistingDefault(img: ExistingImage) {
    if (!props.character) return;
    try {
        await $fetch(`/api/character-images/${img.id}/set-default`, {
            method: 'PATCH',
            body: { characterId: props.character.id, password: getPassword() },
        });
        existingImages.value.forEach((i) => {
            i.isProfile = i.id === img.id;
        });
        imagesPreviews.value.forEach((i) => {
            i.isDefault = false;
        });
    } catch {
        toast.add({ title: 'Failed to set default', color: 'error' });
    }
}

async function deleteExistingImage(img: ExistingImage) {
    try {
        await $fetch(`/api/character-images/${img.id}`, {
            method: 'DELETE',
            body: { password: getPassword() },
        });
        const idx = existingImages.value.findIndex((i) => i.id === img.id);
        if (idx !== -1) existingImages.value.splice(idx, 1);
        if (img.isProfile && existingImages.value.length > 0) {
            existingImages.value[0].isProfile = true;
        }
    } catch {
        toast.add({ title: 'Failed to delete image', color: 'error' });
    }
}

async function uploadAvatarAndImages(characterId: string) {
    if (avatarBlob.value) {
        const fd = new FormData();
        fd.append('file', avatarBlob.value, 'avatar.jpg');
        fd.append('characterId', characterId);
        fd.append('adventureId', props.adventureId);
        fd.append('systemId', props.systemId);
        fd.append('password', getPassword());
        await $fetch(`/api/characters/${characterId}/avatar`, { method: 'POST', body: fd }).catch(() => {});
    }
    for (const img of imagesPreviews.value) {
        const fd = new FormData();
        fd.append('file', img.file);
        fd.append('characterId', characterId);
        fd.append('adventureId', props.adventureId);
        fd.append('systemId', props.systemId);
        fd.append('isProfile', String(img.isDefault));
        fd.append('password', getPassword());
        await $fetch('/api/character-images', { method: 'POST', body: fd }).catch(() => {});
    }
}

async function createCharacter() {
    const name = formName.value.trim();
    if (!name) return;
    creating.value = true;
    createError.value = null;
    try {
        const { character } = await $fetch<{ character: { id: string } }>('/api/characters', {
            method: 'POST',
            body: {
                adventureId: props.adventureId,
                name,
                type: formType.value,
                playbook: formPlaybook.value.trim() || undefined,
                description: formDescription.value.trim() || undefined,
                password: getPassword(),
            },
        });
        await uploadAvatarAndImages(character.id);
        emit('update:open', false);
        emit('created');
        toast.add({ title: 'Character created', color: 'success', icon: 'i-heroicons-check-circle' });
    } catch (e: unknown) {
        createError.value = e instanceof Error ? e.message : 'Could not create character';
    } finally {
        creating.value = false;
    }
}

async function editCharacter() {
    const name = formName.value.trim();
    if (!name || !props.character) return;
    creating.value = true;
    createError.value = null;
    try {
        await $fetch(`/api/characters/${props.character.id}`, {
            method: 'PATCH',
            body: {
                name,
                type: formType.value,
                playbook: formPlaybook.value.trim() || null,
                description: formDescription.value.trim() || null,
                password: getPassword(),
            },
        });
        await uploadAvatarAndImages(props.character.id);
        emit('update:open', false);
        emit('updated');
        toast.add({ title: 'Character updated', color: 'success', icon: 'i-heroicons-check-circle' });
    } catch (e: unknown) {
        createError.value = e instanceof Error ? e.message : 'Could not update character';
    } finally {
        creating.value = false;
    }
}
</script>

<template>
    <UModal
        :open="open"
        :title="isEditing ? 'Edit Character' : 'New Character'"
        :ui="{ content: 'sm:max-w-lg' }"
        @update:open="emit('update:open', $event)"
    >
        <template #body>
            <div class="space-y-5">
                <!-- Name -->
                <UFormField
                    label="Name"
                    required
                >
                    <UInput
                        v-model="formName"
                        placeholder="e.g. Evara Dawnseeker"
                        autofocus
                    />
                </UFormField>

                <!-- Type -->
                <UFormField label="Type">
                    <div class="flex gap-2">
                        <button
                            class="flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
                            :class="
                                formType === 'pc'
                                    ? 'border-violet-500 bg-violet-500/10 text-violet-300'
                                    : 'border-gray-700 text-gray-400 hover:border-gray-600'
                            "
                            @click="formType = 'pc'"
                        >
                            PC
                        </button>
                        <button
                            class="flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
                            :class="
                                formType === 'npc'
                                    ? 'border-violet-500 bg-violet-500/10 text-violet-300'
                                    : 'border-gray-700 text-gray-400 hover:border-gray-600'
                            "
                            @click="formType = 'npc'"
                        >
                            NPC
                        </button>
                    </div>
                </UFormField>

                <!-- Playbook -->
                <UFormField label="Playbook">
                    <UInput
                        v-model="formPlaybook"
                        placeholder="e.g. The Witch"
                    />
                </UFormField>

                <!-- Description -->
                <UFormField label="Description">
                    <UTextarea
                        v-model="formDescription"
                        placeholder="Optional description or notes"
                        :rows="3"
                    />
                </UFormField>

                <!-- Avatar -->
                <UFormField label="Avatar">
                    <div class="flex items-center gap-4">
                        <div
                            class="flex size-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-gray-700 transition-colors hover:border-violet-500"
                            @click="avatarInputRef?.click()"
                        >
                            <img
                                v-if="avatarPreviewUrl"
                                :src="avatarPreviewUrl"
                                alt="Avatar preview"
                                class="size-full object-cover"
                            />
                            <UIcon
                                v-else
                                name="i-heroicons-camera"
                                class="size-7 text-gray-600"
                            />
                        </div>
                        <div class="space-y-1">
                            <UButton
                                size="sm"
                                color="neutral"
                                variant="outline"
                                leading-icon="i-heroicons-arrow-up-tray"
                                @click="avatarInputRef?.click()"
                            >
                                {{ avatarPreviewUrl ? 'Change avatar' : 'Upload avatar' }}
                            </UButton>
                            <p class="text-xs text-gray-500">
                                Will be cropped to a square
                            </p>
                        </div>
                        <input
                            ref="avatarInputRef"
                            type="file"
                            accept="image/*"
                            class="hidden"
                            @change="handleAvatarSelect"
                        />
                    </div>
                </UFormField>

                <!-- Images -->
                <UFormField label="Images">
                    <div class="space-y-3">
                        <div class="flex flex-wrap gap-2">
                            <!-- Loading skeletons -->
                            <template v-if="loadingImages">
                                <USkeleton
                                    v-for="n in 3"
                                    :key="n"
                                    class="size-18 rounded-lg"
                                />
                            </template>

                            <!-- Existing images (edit mode) -->
                            <div
                                v-for="img in existingImages"
                                :key="img.id"
                                class="group relative"
                            >
                                <div
                                    class="size-18 overflow-hidden rounded-lg"
                                    :class="img.isProfile ? 'ring-2 ring-violet-500' : 'ring-1 ring-gray-700'"
                                >
                                    <img
                                        v-if="img.url"
                                        :src="img.url"
                                        alt="Character image"
                                        class="size-full object-cover"
                                    />
                                </div>
                                <div
                                    class="absolute -top-1.5 -left-1.5 flex size-5 cursor-pointer items-center justify-center rounded-full"
                                    :class="img.isProfile ? 'bg-violet-500' : 'bg-gray-700 opacity-0 group-hover:opacity-100'"
                                    :title="img.isProfile ? 'Default image' : 'Set as default'"
                                    @click="setExistingDefault(img)"
                                >
                                    <UIcon
                                        name="i-heroicons-star-solid"
                                        class="size-3 text-white"
                                    />
                                </div>
                                <button
                                    class="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-red-500 opacity-0 transition-opacity group-hover:opacity-100"
                                    @click="deleteExistingImage(img)"
                                >
                                    <UIcon
                                        name="i-heroicons-x-mark"
                                        class="size-3 text-white"
                                    />
                                </button>
                            </div>

                            <!-- Pending (new) images -->
                            <div
                                v-for="img in imagesPreviews"
                                :key="img.uid"
                                class="group relative"
                            >
                                <div
                                    class="size-18 overflow-hidden rounded-lg"
                                    :class="img.isDefault ? 'ring-2 ring-violet-500' : 'ring-1 ring-gray-700'"
                                >
                                    <img
                                        :src="img.previewUrl"
                                        :alt="img.file.name"
                                        class="size-full object-cover"
                                    />
                                </div>
                                <div
                                    class="absolute -top-1.5 -left-1.5 flex size-5 cursor-pointer items-center justify-center rounded-full"
                                    :class="img.isDefault ? 'bg-violet-500' : 'bg-gray-700 opacity-0 group-hover:opacity-100'"
                                    :title="img.isDefault ? 'Default image' : 'Set as default'"
                                    @click="setPendingDefault(img.uid)"
                                >
                                    <UIcon
                                        name="i-heroicons-star-solid"
                                        class="size-3 text-white"
                                    />
                                </div>
                                <button
                                    class="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-red-500 opacity-0 transition-opacity group-hover:opacity-100"
                                    @click="removePending(img.uid)"
                                >
                                    <UIcon
                                        name="i-heroicons-x-mark"
                                        class="size-3 text-white"
                                    />
                                </button>
                            </div>

                            <!-- Add more -->
                            <button
                                class="flex size-18 items-center justify-center rounded-lg border-2 border-dashed border-gray-700 text-gray-600 transition-colors hover:border-violet-500 hover:text-violet-500"
                                @click="imagesInputRef?.click()"
                            >
                                <UIcon
                                    name="i-heroicons-plus"
                                    class="size-6"
                                />
                            </button>
                        </div>

                        <!-- Action buttons -->
                        <div class="flex items-center gap-2">
                            <UButton
                                size="xs"
                                color="neutral"
                                variant="outline"
                                leading-icon="i-heroicons-sparkles"
                                :loading="removingBg"
                                @click="removeBgInputRef?.click()"
                            >
                                Remove BG
                            </UButton>
                            <p
                                v-if="existingImages.length + imagesPreviews.length > 0"
                                class="text-xs text-gray-500"
                            >
                                Click ★ to set default
                            </p>
                        </div>

                        <input
                            ref="imagesInputRef"
                            type="file"
                            accept="image/*"
                            multiple
                            class="hidden"
                            @change="handleImagesSelect"
                        />
                        <input
                            ref="removeBgInputRef"
                            type="file"
                            accept="image/*"
                            class="hidden"
                            @change="handleRemoveBgSelect"
                        />
                    </div>
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
                    @click="isEditing ? editCharacter() : createCharacter()"
                >
                    {{ isEditing ? 'Save' : 'Create' }}
                </UButton>
            </div>
        </template>
    </UModal>

</template>
