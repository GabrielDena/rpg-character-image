<script setup lang="ts">
interface ImagePreview {
    uid: string;
    file: File;
    previewUrl: string;
    isDefault: boolean;
}

const props = defineProps<{
    open: boolean;
    adventureId: string;
    systemId: string;
}>();

const emit = defineEmits<{
    'update:open': [value: boolean];
    created: [];
}>();

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

const imagesPreviews = ref<ImagePreview[]>([]);

function getPassword() {
    return localStorage.getItem('app_password') ?? '';
}

function reset() {
    formName.value = '';
    formType.value = 'npc';
    formPlaybook.value = '';
    formDescription.value = '';
    avatarBlob.value = null;
    if (avatarPreviewUrl.value) URL.revokeObjectURL(avatarPreviewUrl.value);
    avatarPreviewUrl.value = null;
    imagesPreviews.value.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    imagesPreviews.value = [];
    createError.value = null;
}

watch(
    () => props.open,
    (val) => { if (val) reset(); }
);

function handleAvatarSelect(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (avatarPreviewUrl.value) URL.revokeObjectURL(avatarPreviewUrl.value);
    avatarBlob.value = file;
    avatarPreviewUrl.value = URL.createObjectURL(file);
    (e.target as HTMLInputElement).value = '';
}

function handleImagesSelect(e: Event) {
    const files = Array.from((e.target as HTMLInputElement).files ?? []);
    files.forEach((file, i) => {
        const isFirst = imagesPreviews.value.length === 0 && i === 0;
        imagesPreviews.value.push({
            uid: Math.random().toString(36).slice(2),
            file,
            previewUrl: URL.createObjectURL(file),
            isDefault: isFirst,
        });
    });
    (e.target as HTMLInputElement).value = '';
}

function setDefault(uid: string) {
    imagesPreviews.value.forEach((img) => {
        img.isDefault = img.uid === uid;
    });
}

function removeImage(uid: string) {
    const idx = imagesPreviews.value.findIndex((img) => img.uid === uid);
    if (idx === -1) return;
    const [removed] = imagesPreviews.value.splice(idx, 1);
    URL.revokeObjectURL(removed.previewUrl);
    if (removed.isDefault && imagesPreviews.value.length > 0) {
        imagesPreviews.value[0].isDefault = true;
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

        if (avatarBlob.value) {
            const fd = new FormData();
            fd.append('file', avatarBlob.value, 'avatar.jpg');
            fd.append('characterId', character.id);
            fd.append('adventureId', props.adventureId);
            fd.append('systemId', props.systemId);
            fd.append('password', getPassword());
            await $fetch(`/api/characters/${character.id}/avatar`, { method: 'POST', body: fd }).catch(() => {});
        }

        for (const img of imagesPreviews.value) {
            const fd = new FormData();
            fd.append('file', img.file);
            fd.append('characterId', character.id);
            fd.append('adventureId', props.adventureId);
            fd.append('systemId', props.systemId);
            fd.append('isProfile', String(img.isDefault));
            fd.append('password', getPassword());
            await $fetch('/api/character-images', { method: 'POST', body: fd }).catch(() => {});
        }

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
                                <!-- Default badge -->
                                <div
                                    class="absolute -top-1.5 -left-1.5 flex size-5 items-center justify-center rounded-full"
                                    :class="img.isDefault ? 'bg-violet-500' : 'bg-gray-700 opacity-0 group-hover:opacity-100'"
                                    :title="img.isDefault ? 'Default image' : 'Set as default'"
                                    @click="setDefault(img.uid)"
                                >
                                    <UIcon
                                        name="i-heroicons-star-solid"
                                        class="size-3 text-white"
                                    />
                                </div>
                                <!-- Remove -->
                                <button
                                    class="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-red-500 opacity-0 transition-opacity group-hover:opacity-100"
                                    @click="removeImage(img.uid)"
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
                        <p
                            v-if="imagesPreviews.length > 0"
                            class="text-xs text-gray-500"
                        >
                            Click ★ on an image to set it as default
                        </p>
                        <input
                            ref="imagesInputRef"
                            type="file"
                            accept="image/*"
                            multiple
                            class="hidden"
                            @change="handleImagesSelect"
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
                    @click="createCharacter"
                >
                    Create
                </UButton>
            </div>
        </template>
    </UModal>

</template>
