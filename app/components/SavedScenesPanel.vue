<script setup lang="ts">
import type { BackgroundWithUrl } from '~/types/background';
import type { CharacterWithUrl } from '~/types/character';
import type { SavedScene } from '~/types/scene';

const props = defineProps<{
    adventureId: string;
    activeCharacterIds: string[];
    selectedBackgroundId: string | null;
    useAltBackground: boolean;
    displayMode: 'scene' | 'table';
    tableShape: 'round' | 'square' | 'rectangle';
    tableSeats: number;
    tableSideSeats: number;
    allCharacters: CharacterWithUrl[];
    allBackgrounds: BackgroundWithUrl[];
}>();

const emit = defineEmits<{
    'apply-scene': [scene: SavedScene];
}>();

const toast = useToast();
const store = useAppStore();
const scenes = ref<SavedScene[]>([]);
const loading = ref(false);
const saving = ref(false);
const deletingAll = ref(false);
const showDeleteAllModal = ref(false);
const showDetailModal = ref(false);
const selectedScene = ref<SavedScene | null>(null);

function getPassword() {
    return localStorage.getItem('app_password') ?? '';
}

async function loadScenes() {
    loading.value = true;
    try {
        const { scenes: rows } = await $fetch<{ scenes: SavedScene[] }>('/api/saved-scenes', {
            query: { adventureId: props.adventureId },
        });
        scenes.value = rows;
    } catch {
        // non-fatal
    } finally {
        loading.value = false;
    }
}

watch(() => props.adventureId, loadScenes, { immediate: true });

watch(
    () => store.scenesVersion,
    () => {
        if (!saving.value) loadScenes();
    }
);

async function saveCurrentScene() {
    saving.value = true;
    try {
        const { scene } = await $fetch<{ scene: SavedScene }>('/api/saved-scenes', {
            method: 'POST',
            body: {
                adventureId: props.adventureId,
                name: `Scene ${scenes.value.length + 1}`,
                characterIds: [...props.activeCharacterIds],
                backgroundId: props.selectedBackgroundId,
                useAltBackground: props.useAltBackground,
                displayMode: props.displayMode,
                tableShape: props.tableShape,
                tableSeats: props.tableSeats,
                tableSideSeats: props.tableSideSeats,
                password: getPassword(),
            },
        });
        scenes.value.push(scene);
    } catch {
        toast.add({ title: 'Failed to save scene', color: 'error' });
    } finally {
        saving.value = false;
    }
}

function openScene(scene: SavedScene) {
    selectedScene.value = scene;
    showDetailModal.value = true;
}

async function onSceneSaved(updated: SavedScene) {
    try {
        const { scene } = await $fetch<{ scene: SavedScene }>(`/api/saved-scenes/${updated.id}`, {
            method: 'PATCH',
            body: { name: updated.name, password: getPassword() },
        });
        const idx = scenes.value.findIndex((s) => s.id === scene.id);
        if (idx !== -1) scenes.value[idx] = scene;
    } catch {
        toast.add({ title: 'Failed to save scene', color: 'error' });
    }
}

async function onSceneDeleted(id: string) {
    try {
        await $fetch(`/api/saved-scenes/${id}`, {
            method: 'DELETE',
            body: { password: getPassword() },
        });
        scenes.value = scenes.value.filter((s) => s.id !== id);
    } catch {
        toast.add({ title: 'Failed to delete scene', color: 'error' });
    }
}

async function onSceneApplied(scene: SavedScene) {
    await onSceneSaved(scene);
    emit('apply-scene', scene);
}

async function deleteAllScenes() {
    deletingAll.value = true;
    try {
        await $fetch('/api/saved-scenes', {
            method: 'DELETE',
            body: { adventureId: props.adventureId, password: getPassword() },
        });
        scenes.value = [];
        showDeleteAllModal.value = false;
    } catch {
        toast.add({ title: 'Failed to delete scenes', color: 'error' });
    } finally {
        deletingAll.value = false;
    }
}
</script>

<template>
    <div class="h-full">
        <SessionCard
            title="Scenes"
            class="h-full"
        >
            <div
                v-if="loading"
                class="space-y-1 p-2"
            >
                <USkeleton
                    v-for="n in 2"
                    :key="n"
                    class="h-8 w-full rounded-lg"
                />
            </div>

            <ul
                v-else
                class="flex flex-col"
            >
                <li
                    v-for="scene in scenes"
                    :key="scene.id"
                >
                    <button
                        class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-300 transition-colors hover:bg-gray-800"
                        @click="openScene(scene)"
                    >
                        <UIcon
                            name="i-heroicons-camera"
                            class="size-3.5 shrink-0 text-gray-500"
                        />
                        <span class="truncate">{{ scene.name }}</span>
                    </button>
                </li>
                <li :class="scenes.length ? 'border-t border-gray-800' : ''">
                    <button
                        class="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-800 hover:text-gray-400"
                        :disabled="saving"
                        @click="saveCurrentScene"
                    >
                        <UIcon
                            v-if="saving"
                            name="i-heroicons-arrow-path"
                            class="size-3.5 shrink-0 animate-spin"
                        />
                        <UIcon
                            v-else
                            name="i-heroicons-plus"
                            class="size-3.5 shrink-0"
                        />
                        <span>Save scene</span>
                    </button>
                </li>
                <li v-if="scenes.length">
                    <button
                        class="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-800 hover:text-red-400"
                        :disabled="deletingAll"
                        @click="void (showDeleteAllModal = true)"
                    >
                        <UIcon
                            v-if="deletingAll"
                            name="i-heroicons-arrow-path"
                            class="size-3.5 shrink-0 animate-spin"
                        />
                        <UIcon
                            v-else
                            name="i-heroicons-trash"
                            class="size-3.5 shrink-0"
                        />
                        <span>Delete all scenes</span>
                    </button>
                </li>
            </ul>
        </SessionCard>

        <SceneDetailModal
            v-if="selectedScene"
            v-model:open="showDetailModal"
            :scene="selectedScene"
            :all-characters="allCharacters"
            :all-backgrounds="allBackgrounds"
            @save="onSceneSaved"
            @delete="onSceneDeleted"
            @apply="onSceneApplied"
        />

        <UModal
            :open="showDeleteAllModal"
            title="Delete All Scenes"
            :ui="{ content: 'sm:max-w-sm' }"
            :content="{ onOpenAutoFocus: (e: Event) => e.preventDefault() }"
            @update:open="(val) => void (showDeleteAllModal = val)"
        >
            <template #body>
                <p class="text-sm text-gray-300">
                    Are you sure you want to delete all scenes? This action cannot be undone.
                </p>
            </template>
            <template #footer>
                <div class="flex justify-end gap-2">
                    <UButton
                        color="neutral"
                        variant="ghost"
                        :disabled="deletingAll"
                        @click="void (showDeleteAllModal = false)"
                    >
                        Cancel
                    </UButton>
                    <UButton
                        color="error"
                        :loading="deletingAll"
                        @click="deleteAllScenes"
                    >
                        Delete All
                    </UButton>
                </div>
            </template>
        </UModal>
    </div>
</template>

