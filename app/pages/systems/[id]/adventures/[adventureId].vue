<script setup lang="ts">
import type { Adventure } from '#shared/types/models';
import type { CharacterWithUrl } from '~/components/CharacterCreateModal.vue';

interface BackgroundWithUrl {
    id: string;
    adventureId: string;
    name: string;
    storagePath: string;
    createdAt: Date;
    url: string | null;
}

const route = useRoute();
const systemId = String(route.params.id);
const adventureId = String(route.params.adventureId);

const toast = useToast();

const adventure = ref<Adventure | null>(null);
const backgroundsList = ref<BackgroundWithUrl[]>([]);
const charactersList = ref<CharacterWithUrl[]>([]);
const loading = ref(false);
const fetchError = ref<string | null>(null);

const activeTab = ref<'backgrounds' | 'characters'>('backgrounds');
const showCharacterModal = ref(false);
const editingCharacter = ref<CharacterWithUrl | null>(null);

function openCreateModal() {
    editingCharacter.value = null;
    showCharacterModal.value = true;
}

function openEditModal(character: CharacterWithUrl) {
    editingCharacter.value = character;
    showCharacterModal.value = true;
}

const uploading = ref(false);
const fileInputRef = ref<HTMLInputElement>();

const editingId = ref<string | null>(null);
const editingName = ref('');

function getPassword() {
    return localStorage.getItem('app_password') ?? '';
}

async function fetchData() {
    loading.value = true;
    fetchError.value = null;
    try {
        const [adventureData, backgroundsData, charactersData] = await Promise.all([
            $fetch<{ adventure: Adventure }>(`/api/adventures/${adventureId}`),
            $fetch<{ backgrounds: BackgroundWithUrl[] }>('/api/backgrounds', {
                query: { adventureId },
            }),
            $fetch<{ characters: CharacterWithUrl[] }>('/api/characters', { query: { adventureId } }),
        ]);
        adventure.value = adventureData.adventure;
        backgroundsList.value = backgroundsData.backgrounds;
        charactersList.value = charactersData.characters;
    } catch (e: unknown) {
        fetchError.value = e instanceof Error ? e.message : 'Could not load data';
    } finally {
        loading.value = false;
    }
}

async function fetchBackgrounds() {
    const { backgrounds } = await $fetch<{ backgrounds: BackgroundWithUrl[] }>('/api/backgrounds', {
        query: { adventureId },
    });
    backgroundsList.value = backgrounds;
}

async function fetchCharacters() {
    const { characters } = await $fetch<{ characters: CharacterWithUrl[] }>('/api/characters', {
        query: { adventureId },
    });
    charactersList.value = characters;
}

async function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    uploading.value = true;
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('adventureId', adventureId);
        formData.append('systemId', systemId);
        formData.append('name', file.name.replace(/\.[^.]+$/, ''));
        formData.append('password', getPassword());

        await $fetch('/api/backgrounds', { method: 'POST', body: formData });
        await fetchBackgrounds();
        toast.add({ title: 'Background uploaded', color: 'success', icon: 'i-heroicons-check-circle' });
    } catch (e: unknown) {
        toast.add({
            title: 'Upload failed',
            color: 'error',
            description: e instanceof Error ? e.message : 'Unknown error',
        });
    } finally {
        uploading.value = false;
        input.value = '';
    }
}

function startEdit(bg: BackgroundWithUrl) {
    editingId.value = bg.id;
    editingName.value = bg.name;
}

function cancelEdit() {
    editingId.value = null;
    editingName.value = '';
}

async function saveEdit(bg: BackgroundWithUrl) {
    const name = editingName.value.trim();
    if (!name) return;
    try {
        await $fetch(`/api/backgrounds/${bg.id}`, {
            method: 'PATCH',
            body: { name, password: getPassword() },
        });
        bg.name = name;
        editingId.value = null;
    } catch (e: unknown) {
        toast.add({
            title: 'Rename failed',
            color: 'error',
            description: e instanceof Error ? e.message : 'Unknown error',
        });
    }
}

async function deleteBackground(bg: BackgroundWithUrl) {
    try {
        await $fetch(`/api/backgrounds/${bg.id}`, {
            method: 'DELETE',
            body: { password: getPassword() },
        });
        backgroundsList.value = backgroundsList.value.filter((b) => b.id !== bg.id);
        toast.add({ title: 'Background deleted', color: 'success' });
    } catch (e: unknown) {
        toast.add({
            title: 'Delete failed',
            color: 'error',
            description: e instanceof Error ? e.message : 'Unknown error',
        });
    }
}

const tabs = [
    { key: 'backgrounds' as const, label: 'Backgrounds', icon: 'i-heroicons-photo' },
    { key: 'characters' as const, label: 'Characters', icon: 'i-heroicons-user-group' },
];

onMounted(fetchData);
</script>

<template>
    <div class="flex h-full flex-col">
        <!-- Header -->
        <div class="shrink-0 border-b border-gray-800 bg-gray-900 px-4 py-3">
            <div class="flex items-center gap-2">
                <UButton
                    variant="ghost"
                    color="neutral"
                    size="sm"
                    icon="i-heroicons-chevron-left"
                    :padded="false"
                    :to="`/systems/${systemId}`"
                />
                <h1 class="min-w-0 flex-1 truncate text-base font-semibold text-gray-100">
                    <USkeleton
                        v-if="loading && !adventure"
                        class="h-5 w-40"
                    />
                    <span v-else>{{ adventure?.name }}</span>
                </h1>
            </div>
        </div>

        <!-- Tabs -->
        <div class="shrink-0 flex gap-1 border-b border-gray-800 bg-gray-900 px-3">
            <button
                v-for="tab in tabs"
                :key="tab.key"
                class="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors"
                :class="
                    activeTab === tab.key
                        ? 'border-b-2 border-violet-500 text-gray-100'
                        : 'text-gray-500 hover:text-gray-400'
                "
                @click="activeTab = tab.key"
            >
                <UIcon
                    :name="tab.icon"
                    class="size-4"
                />
                {{ tab.label }}
            </button>
        </div>

        <!-- Content -->
        <div class="min-h-0 flex-1 overflow-y-auto">
            <div
                v-if="loading"
                class="space-y-2 p-4"
            >
                <USkeleton
                    v-for="n in 3"
                    :key="n"
                    class="h-16 w-full rounded-xl"
                />
            </div>

            <div
                v-else-if="fetchError"
                class="p-4"
            >
                <UAlert
                    icon="i-heroicons-exclamation-triangle"
                    color="error"
                    variant="soft"
                    title="Could not load data"
                    :description="fetchError"
                    :actions="[{ label: 'Retry', leadingIcon: 'i-heroicons-arrow-path', onClick: fetchData }]"
                />
            </div>

            <template v-else>
                <!-- Backgrounds Tab -->
                <div v-if="activeTab === 'backgrounds'">
                    <div class="flex items-center justify-between p-4 pb-2">
                        <p class="text-xs text-gray-500">
                            {{ backgroundsList.length }} background{{ backgroundsList.length !== 1 ? 's' : '' }}
                        </p>
                        <UButton
                            size="sm"
                            leading-icon="i-heroicons-arrow-up-tray"
                            :loading="uploading"
                            @click="fileInputRef?.click()"
                        >
                            Upload
                        </UButton>
                        <input
                            ref="fileInputRef"
                            type="file"
                            accept="image/*"
                            class="hidden"
                            @change="handleFileSelect"
                        />
                    </div>

                    <div
                        v-if="!backgroundsList.length"
                        class="flex flex-col items-center justify-center gap-4 px-6 py-20"
                    >
                        <UIcon
                            name="i-heroicons-photo"
                            class="size-12 text-gray-700"
                        />
                        <div class="text-center">
                            <p class="text-sm font-medium text-gray-400">No backgrounds yet</p>
                            <p class="mt-1 text-xs text-gray-600">
                                Upload images to use as backgrounds
                            </p>
                        </div>
                    </div>

                    <ul
                        v-else
                        class="space-y-px p-2"
                    >
                        <li
                            v-for="bg in backgroundsList"
                            :key="bg.id"
                            class="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-gray-800"
                        >
                            <!-- Thumbnail -->
                            <div class="size-14 shrink-0 overflow-hidden rounded-lg bg-gray-800">
                                <img
                                    v-if="bg.url"
                                    :src="bg.url"
                                    :alt="bg.name"
                                    class="size-full object-cover"
                                />
                            </div>

                            <!-- Name / Edit -->
                            <div class="min-w-0 flex-1">
                                <input
                                    v-if="editingId === bg.id"
                                    v-model="editingName"
                                    class="w-full rounded-md bg-gray-700 px-2 py-1 text-sm text-gray-100 outline-none ring-1 ring-violet-500"
                                    @keyup.enter="saveEdit(bg)"
                                    @keyup.escape="cancelEdit"
                                    @blur="cancelEdit"
                                    autofocus
                                />
                                <p
                                    v-else
                                    class="truncate text-sm text-gray-200"
                                >
                                    {{ bg.name }}
                                </p>
                            </div>

                            <!-- Actions -->
                            <div class="flex shrink-0 items-center gap-1">
                                <template v-if="editingId === bg.id">
                                    <UButton
                                        size="xs"
                                        variant="ghost"
                                        color="neutral"
                                        icon="i-heroicons-check"
                                        @mousedown.prevent="saveEdit(bg)"
                                    />
                                    <UButton
                                        size="xs"
                                        variant="ghost"
                                        color="neutral"
                                        icon="i-heroicons-x-mark"
                                        @mousedown.prevent="cancelEdit"
                                    />
                                </template>
                                <template v-else>
                                    <UButton
                                        size="xs"
                                        variant="ghost"
                                        color="neutral"
                                        icon="i-heroicons-pencil"
                                        @click="startEdit(bg)"
                                    />
                                    <UButton
                                        size="xs"
                                        variant="ghost"
                                        color="error"
                                        icon="i-heroicons-trash"
                                        @click="deleteBackground(bg)"
                                    />
                                </template>
                            </div>
                        </li>
                    </ul>
                </div>

                <!-- Characters Tab -->
                <div v-else-if="activeTab === 'characters'">
                    <div class="flex items-center justify-between p-4 pb-2">
                        <p class="text-xs text-gray-500">
                            {{ charactersList.length }} character{{ charactersList.length !== 1 ? 's' : '' }}
                        </p>
                        <UButton
                            size="sm"
                            leading-icon="i-heroicons-plus"
                            @click="openCreateModal"
                        >
                            New Character
                        </UButton>
                    </div>

                    <div
                        v-if="!charactersList.length"
                        class="flex flex-col items-center justify-center gap-4 px-6 py-20"
                    >
                        <UIcon
                            name="i-heroicons-user-group"
                            class="size-12 text-gray-700"
                        />
                        <div class="text-center">
                            <p class="text-sm font-medium text-gray-400">No characters yet</p>
                            <p class="mt-1 text-xs text-gray-600">
                                Add characters to this adventure
                            </p>
                        </div>
                        <UButton
                            leading-icon="i-heroicons-plus"
                            @click="openCreateModal"
                        >
                            New Character
                        </UButton>
                    </div>

                    <ul
                        v-else
                        class="space-y-0.5 p-2"
                    >
                        <li
                            v-for="character in charactersList"
                            :key="character.id"
                        >
                            <button
                                class="flex w-full items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-gray-800 active:bg-gray-700"
                                @click="openEditModal(character)"
                            >
                                <div class="size-8 shrink-0 overflow-hidden rounded-full bg-gray-800">
                                    <img
                                        v-if="character.avatarUrl"
                                        :src="character.avatarUrl"
                                        :alt="character.name"
                                        class="size-full object-cover"
                                    />
                                    <div
                                        v-else
                                        class="flex size-full items-center justify-center"
                                    >
                                        <UIcon
                                            name="i-heroicons-user"
                                            class="size-4 text-gray-500"
                                        />
                                    </div>
                                </div>
                                <div class="min-w-0 flex-1 text-left">
                                    <p class="truncate text-sm font-medium text-gray-200">
                                        {{ character.name }}
                                    </p>
                                    <p class="text-xs text-gray-500">
                                        {{ character.type.toUpperCase() }}
                                        <span v-if="character.playbook"> · {{ character.playbook }}</span>
                                    </p>
                                </div>
                                <UIcon
                                    name="i-heroicons-pencil"
                                    class="size-4 shrink-0 text-gray-600"
                                />
                            </button>
                        </li>
                    </ul>
                </div>
            </template>
        </div>
    </div>

    <CharacterCreateModal
        v-model:open="showCharacterModal"
        :adventure-id="adventureId"
        :system-id="systemId"
        :character="editingCharacter"
        @created="fetchCharacters"
        @updated="fetchCharacters"
    />
</template>
