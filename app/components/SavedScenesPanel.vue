<script setup lang="ts">
import type { CharacterWithUrl } from '~/types/character';
import type { BackgroundWithUrl } from '~/types/background';
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

const scenes = ref<SavedScene[]>([]);
const showDetailModal = ref(false);
const selectedScene = ref<SavedScene | null>(null);

function storageKey() {
    return `saved-scenes-${props.adventureId}`;
}

function loadScenes() {
    try {
        const raw = localStorage.getItem(storageKey());
        scenes.value = raw ? JSON.parse(raw) : [];
    } catch {
        scenes.value = [];
    }
}

function persistScenes() {
    localStorage.setItem(storageKey(), JSON.stringify(scenes.value));
}

watch(() => props.adventureId, loadScenes, { immediate: true });

function saveCurrentScene() {
    const scene: SavedScene = {
        id: crypto.randomUUID(),
        name: `Scene ${scenes.value.length + 1}`,
        characterIds: [...props.activeCharacterIds],
        backgroundId: props.selectedBackgroundId,
        displayMode: props.displayMode,
        tableShape: props.tableShape,
        tableSeats: props.tableSeats,
    };
    scenes.value.push(scene);
    persistScenes();
}

function openScene(scene: SavedScene) {
    selectedScene.value = scene;
    showDetailModal.value = true;
}

function onSceneSaved(updated: SavedScene) {
    const idx = scenes.value.findIndex((s) => s.id === updated.id);
    if (idx !== -1) {
        scenes.value[idx] = updated;
        persistScenes();
    }
}

function onSceneDeleted(id: string) {
    scenes.value = scenes.value.filter((s) => s.id !== id);
    persistScenes();
}

function onSceneApplied(scene: SavedScene) {
    onSceneSaved(scene);
    emit('apply-scene', scene);
}
</script>

<template>
    <div class="h-full">
    <SessionCard
        title="Scenes"
        class="h-full"
    >
        <ul class="flex flex-col">
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
                    @click="saveCurrentScene"
                >
                    <UIcon
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
