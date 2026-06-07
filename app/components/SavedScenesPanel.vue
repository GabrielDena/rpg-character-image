<script setup lang="ts">
import type { BackgroundWithUrl } from '~/types/background';
import type { CharacterWithUrl } from '~/types/character';
import type { SavedScene } from '~/types/scene';

const props = defineProps<{
    adventureId: string;
    activeCharacterIds: string[];
    selectedBackgroundId: string | null;
    displayMode: 'scene' | 'table';
    tableShape: 'round' | 'square' | 'rectangle';
    tableSeats: number;
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
                displayMode: props.displayMode,
                tableShape: props.tableShape,
                tableSeats: props.tableSeats,
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
    </div>
</template>

