<script setup lang="ts">
import type { Adventure, System } from '#shared/types/models';
import type { BackgroundWithUrl } from '~/components/AdventureBackgroundsTab.vue';
import type { CharacterWithUrl } from '~/components/CharacterCreateModal.vue';

function getPassword() {
    return localStorage.getItem('app_password') ?? '';
}

const toast = useToast();
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

const pcCharacters = computed(() => allCharacters.value.filter((c) => c.type === 'pc'));

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
    }>('/api/display-state');

    try {
        if (state.activeAdventureId && state.adventure && state.system) {
            activeAdventureId.value = state.activeAdventureId;
            activeAdventure.value = state.adventure;
            activeSystem.value = state.system;
            activeCharacterIds.value = state.activeCharacterIds;
            await fetchCharacters(state.activeAdventureId);
            activeCharacters.value = allCharacters.value.filter((c) =>
                state.activeCharacterIds.includes(c.id)
            );
            await fetchBackgrounds(state.activeAdventureId);
            selectedBackground.value = state.selectedBackground;
        }
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

            <div class="shrink-0 px-4 pt-4">
                <SessionBackgroundSelector
                    :backgrounds="allBackgrounds"
                    :selected-background="selectedBackground"
                    :loading="loadingBackgrounds"
                    :saving-background="savingBackground"
                    @select="onBackgroundSelected"
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

