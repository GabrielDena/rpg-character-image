<script setup lang="ts">
import type { Adventure, System } from '#shared/types/models';
import type { BackgroundWithUrl } from '~/types/background';
import type { CharacterWithUrl } from '~/types/character';

function getPassword() {
    return localStorage.getItem('app_password') ?? '';
}

const toast = useToast();
const store = useAppStore();
const loadingState = ref(false);

// ── Active campaign ────────────────────────────────────────────────────────────
const activeAdventureId = ref<string | null>(null);
const activeAdventure = ref<Adventure | null>(null);
const activeSystem = ref<System | null>(null);
const settingAdventure = ref(false);

async function onAdventureSelected(adventure: Adventure, system: System) {
    settingAdventure.value = true;
    try {
        await $fetch('/api/display-state', {
            method: 'PATCH',
            body: { activeAdventureId: adventure.id, password: getPassword() },
        });
        activeAdventureId.value = adventure.id;
        activeAdventure.value = adventure;
        activeSystem.value = system;
        await fetchCharacters(adventure.id);
    } catch (e: unknown) {
        toast.add({
            title: 'Failed to set campaign',
            color: 'error',
            description: e instanceof Error ? e.message : 'Unknown error',
        });
    } finally {
        settingAdventure.value = false;
    }
}

async function onAdventureCleared() {
    settingAdventure.value = true;
    try {
        await $fetch('/api/display-state', {
            method: 'PATCH',
            body: { activeAdventureId: null, password: getPassword() },
        });
        activeAdventureId.value = null;
        activeAdventure.value = null;
        activeSystem.value = null;
        allCharacters.value = [];
        activeCharacterIds.value = [];
        activeCharacters.value = [];
    } catch {
        // non-fatal
    } finally {
        settingAdventure.value = false;
    }
}

// ── Characters ─────────────────────────────────────────────────────────────────
const allCharacters = ref<CharacterWithUrl[]>([]);
const loadingCharacters = ref(false);
const activeCharacterIds = ref<string[]>([]);
const activeCharacters = ref<CharacterWithUrl[]>([]);
const savingScene = ref(false);

const pcCharacters = computed(() =>
    allCharacters.value.filter((c) => c.type === 'pc').sort((a, b) => a.name.localeCompare(b.name))
);

async function fetchCharacters(adventureId: string) {
    loadingCharacters.value = true;
    try {
        const { characters } = await $fetch<{ characters: CharacterWithUrl[] }>('/api/characters', {
            query: { adventureId },
        });
        allCharacters.value = characters;
    } catch (e: unknown) {
        toast.add({
            title: 'Failed to load characters',
            color: 'error',
            description: e instanceof Error ? e.message : 'Unknown error',
        });
    } finally {
        loadingCharacters.value = false;
    }
}

function onPcToggled(id: string) {
    const next = activeCharacterIds.value.includes(id)
        ? activeCharacterIds.value.filter((i) => i !== id)
        : [...activeCharacterIds.value, id];
    onSceneUpdated(next);
}

async function onSceneUpdated(ids: string[]) {
    savingScene.value = true;
    try {
        await $fetch('/api/display-state', {
            method: 'PATCH',
            body: { activeCharacterIds: ids, password: getPassword() },
        });
        activeCharacterIds.value = ids;
        activeCharacters.value = allCharacters.value.filter((c) => ids.includes(c.id));
    } catch (e: unknown) {
        toast.add({
            title: 'Failed to update scene',
            color: 'error',
            description: e instanceof Error ? e.message : 'Unknown error',
        });
    } finally {
        savingScene.value = false;
    }
}

// ── Fit mode ───────────────────────────────────────────────────────────────────────────
const galleryFitMode = ref<'cover' | 'contain'>('cover');
const savingFitMode = ref(false);

// ── Show/hide characters ─────────────────────────────────────────────────────────────
const showCharacters = ref(true);
const savingShowCharacters = ref(false);

async function toggleShowCharacters() {
    const next = !showCharacters.value;
    savingShowCharacters.value = true;
    try {
        await $fetch('/api/display-state', {
            method: 'PATCH',
            body: { showCharacters: next, password: getPassword() },
        });
        showCharacters.value = next;
    } catch {
        // non-fatal
    } finally {
        savingShowCharacters.value = false;
    }
}

// ── Table / display mode ───────────────────────────────────────────────────────────────
const displayMode = ref<'scene' | 'table'>('scene');
const tableShape = ref<'round' | 'square' | 'rectangle'>('round');
const tableSeats = ref(4);
const savingTableConfig = ref(false);

async function onSetScene() {
    savingTableConfig.value = true;
    try {
        await $fetch('/api/display-state', {
            method: 'PATCH',
            body: { displayMode: 'scene', password: getPassword() },
        });
        displayMode.value = 'scene';
    } catch {
    } finally {
        savingTableConfig.value = false;
    }
}

async function onSetTable(config: { shape: 'round' | 'square' | 'rectangle'; seats: number }) {
    savingTableConfig.value = true;
    try {
        await $fetch('/api/display-state', {
            method: 'PATCH',
            body: {
                displayMode: 'table',
                tableShape: config.shape,
                tableSeats: config.seats,
                password: getPassword(),
            },
        });
        displayMode.value = 'table';
        tableShape.value = config.shape;
        tableSeats.value = config.seats;
    } catch {
    } finally {
        savingTableConfig.value = false;
    }
}

async function toggleFitMode() {
    const next = galleryFitMode.value === 'cover' ? 'contain' : 'cover';
    savingFitMode.value = true;
    try {
        await $fetch('/api/display-state', {
            method: 'PATCH',
            body: { galleryFitMode: next, password: getPassword() },
        });
        galleryFitMode.value = next;
    } catch {
        // non-fatal
    } finally {
        savingFitMode.value = false;
    }
}

// ── Backgrounds ───────────────────────────────────────────────────────────────────────
const allBackgrounds = ref<BackgroundWithUrl[]>([]);
const loadingBackgrounds = ref(false);
const selectedBackground = ref<BackgroundWithUrl | null>(null);
const savingBackground = ref(false);

async function fetchBackgrounds(adventureId: string) {
    loadingBackgrounds.value = true;
    try {
        const { backgrounds } = await $fetch<{ backgrounds: BackgroundWithUrl[] }>(
            '/api/backgrounds',
            {
                query: { adventureId },
            }
        );
        allBackgrounds.value = backgrounds;
    } catch (e: unknown) {
        toast.add({
            title: 'Failed to load backgrounds',
            color: 'error',
            description: e instanceof Error ? e.message : 'Unknown error',
        });
    } finally {
        loadingBackgrounds.value = false;
    }
}

async function onBackgroundSelected(backgroundId: string | null) {
    savingBackground.value = true;
    try {
        await $fetch('/api/display-state', {
            method: 'PATCH',
            body: { selectedBackgroundId: backgroundId, password: getPassword() },
        });
        selectedBackground.value = allBackgrounds.value.find((c) => c.id === backgroundId) ?? null;
    } catch (e: unknown) {
        toast.add({
            title: 'Failed to update scene',
            color: 'error',
            description: e instanceof Error ? e.message : 'Unknown error',
        });
    } finally {
        savingBackground.value = false;
    }
}

// ── WS sync ────────────────────────────────────────────────────────────────────
const isSaving = computed(
    () =>
        savingScene.value ||
        savingBackground.value ||
        savingFitMode.value ||
        settingAdventure.value ||
        savingTableConfig.value ||
        savingShowCharacters.value
);

watch(
    () => store.displayStateVersion,
    async () => {
        if (isSaving.value || !activeAdventureId.value) return;
        try {
            const state = await $fetch<{
                activeAdventureId: string | null;
                activeCharacterIds: string[];
                activeCharacters: CharacterWithUrl[];
                selectedBackground: BackgroundWithUrl | null;
                galleryFitMode: 'cover' | 'contain';
                displayMode: 'scene' | 'table';
                tableShape: 'round' | 'square' | 'rectangle';
                tableSeats: number;
                showCharacters: boolean;
            }>('/api/display-state');
            activeCharacterIds.value = state.activeCharacterIds;
            activeCharacters.value = state.activeCharacters;
            selectedBackground.value = state.selectedBackground;
            galleryFitMode.value = state.galleryFitMode ?? 'cover';
            displayMode.value = state.displayMode ?? 'scene';
            tableShape.value = state.tableShape ?? 'round';
            tableSeats.value = state.tableSeats ?? 4;
            showCharacters.value = state.showCharacters ?? true;
        } catch {
            // non-fatal
        }
    }
);

// ── Init ───────────────────────────────────────────────────────────────────────
onMounted(async () => {
    loadingState.value = true;
    const state = await $fetch<{
        activeAdventureId: string | null;
        adventure: Adventure | null;
        system: System | null;
        activeCharacterIds: string[];
        activeCharacters: CharacterWithUrl[];
        selectedBackgroundId: string | null;
        selectedBackground: BackgroundWithUrl | null;
        galleryFitMode: 'cover' | 'contain';
        displayMode: 'scene' | 'table';
        tableShape: 'round' | 'square' | 'rectangle';
        tableSeats: number;
        showCharacters: boolean;
    }>('/api/display-state');

    try {
        if (state.activeAdventureId && state.adventure && state.system) {
            activeAdventureId.value = state.activeAdventureId;
            activeAdventure.value = state.adventure;
            activeSystem.value = state.system;
            activeCharacterIds.value = state.activeCharacterIds;
            await fetchCharacters(state.activeAdventureId);
            activeCharacters.value = allCharacters.value
                .filter((c) => state.activeCharacterIds.includes(c.id))
                .sort((a, b) => a.name.localeCompare(b.name));
            await fetchBackgrounds(state.activeAdventureId);
            selectedBackground.value = state.selectedBackground;
        }
        galleryFitMode.value = state.galleryFitMode ?? 'cover';
        displayMode.value = state.displayMode ?? 'scene';
        tableShape.value = state.tableShape ?? 'round';
        tableSeats.value = state.tableSeats ?? 4;
        showCharacters.value = state.showCharacters ?? true;
    } catch {
    } finally {
        loadingState.value = false;
    }
});
</script>

<template>
    <div class="flex h-full flex-col">
        <USkeleton v-if="loadingState" />
        <template v-else>
            <!-- Header -->
            <div class="shrink-0 border-b border-gray-800 bg-gray-900 px-4 py-3">
                <h1 class="text-base font-semibold text-gray-100">Session</h1>
            </div>

            <div class="shrink-0 px-4 pt-4">
                <SessionCampaignSelector
                    :active-adventure-id="activeAdventureId"
                    :active-adventure="activeAdventure"
                    :active-system="activeSystem"
                    :loading="settingAdventure"
                    @select="onAdventureSelected"
                    @clear="onAdventureCleared"
                />
            </div>

            <div class="flex shrink-0 gap-3 px-4 pt-4">
                <SessionBackgroundSelector
                    class="min-w-0 flex-1"
                    :backgrounds="allBackgrounds"
                    :selected-background="selectedBackground"
                    :loading="loadingBackgrounds"
                    :saving-background="savingBackground"
                    @select="onBackgroundSelected"
                />
                <SessionDisplayPanel
                    :gallery-fit-mode="galleryFitMode"
                    :saving-fit-mode="savingFitMode"
                    :display-mode="displayMode"
                    :table-shape="tableShape"
                    :table-seats="tableSeats"
                    :saving-table-config="savingTableConfig"
                    :show-characters="showCharacters"
                    :saving-show-characters="savingShowCharacters"
                    @toggle-fit-mode="toggleFitMode"
                    @set-scene="onSetScene"
                    @set-table="onSetTable"
                    @toggle-show-characters="toggleShowCharacters"
                />
            </div>

            <div
                v-if="activeAdventure"
                class="flex min-h-0 flex-1 gap-3 p-4"
            >
                <SessionPlayerList
                    :characters="pcCharacters"
                    :active-ids="activeCharacterIds"
                    :loading="loadingCharacters"
                    class="w-40 shrink-0"
                    @toggle="onPcToggled"
                />
                <SessionScenePanel
                    :adventure-id="activeAdventure.id"
                    :system-id="activeSystem!.id"
                    :active-characters="activeCharacters"
                    :active-ids="activeCharacterIds"
                    :loading="loadingCharacters"
                    :saving="savingScene"
                    class="min-w-0 flex-1"
                    @update="onSceneUpdated"
                />
            </div>
        </template>
    </div>
</template>

