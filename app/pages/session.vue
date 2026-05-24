<script setup lang="ts">
import type { CharacterWithUrl } from '~/components/CharacterCreateModal.vue';
import type { System, Adventure } from '#shared/types/models';

function getPassword() {
    return localStorage.getItem('app_password') ?? '';
}

const toast = useToast();

// ── Campaign selector ──────────────────────────────────────────────────────────
type SelectorStep = 'systems' | 'adventures';

const selectorStep = ref<SelectorStep>('systems');
const systemsList = ref<System[]>([]);
const adventuresList = ref<Adventure[]>([]);
const browsingSystem = ref<System | null>(null);

// The active campaign — independent of browse cursor
const activeAdventureId = ref<string | null>(null);
const activeAdventure = ref<Adventure | null>(null);
const activeSystem = ref<System | null>(null);

const settingAdventure = ref(false);
const loadingSystems = ref(false);
const loadingAdventures = ref(false);
const loadingState = ref(true);

async function fetchSystems() {
    loadingSystems.value = true;
    try {
        const { systems: data } = await $fetch<{ systems: System[] }>('/api/systems');
        systemsList.value = data;
    } catch (e: unknown) {
        toast.add({
            title: 'Failed to load systems',
            color: 'error',
            description: e instanceof Error ? e.message : 'Unknown error',
        });
    } finally {
        loadingSystems.value = false;
    }
}

async function selectSystem(system: System) {
    browsingSystem.value = system;
    selectorStep.value = 'adventures';
    adventuresList.value = [];
    loadingAdventures.value = true;
    try {
        const { adventures: data } = await $fetch<{ adventures: Adventure[] }>('/api/adventures', {
            query: { systemId: system.id },
        });
        adventuresList.value = data;
    } catch (e: unknown) {
        toast.add({
            title: 'Failed to load campaigns',
            color: 'error',
            description: e instanceof Error ? e.message : 'Unknown error',
        });
    } finally {
        loadingAdventures.value = false;
    }
}

function backToSystems() {
    selectorStep.value = 'systems';
    browsingSystem.value = null;
    adventuresList.value = [];
}

async function setActiveAdventure(adventure: Adventure) {
    settingAdventure.value = true;
    try {
        await $fetch('/api/display-state', {
            method: 'PATCH',
            body: { activeAdventureId: adventure.id, password: getPassword() },
        });
        activeAdventureId.value = adventure.id;
        activeAdventure.value = adventure;
        activeSystem.value = browsingSystem.value;
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

async function clearActiveAdventure() {
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
    } catch {
        // non-fatal
    } finally {
        settingAdventure.value = false;
    }
}

// ── Characters ─────────────────────────────────────────────────────────────────
const allCharacters = ref<CharacterWithUrl[]>([]);
const loadingCharacters = ref(false);
const showNpcModal = ref(false);

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

// ── Init ───────────────────────────────────────────────────────────────────────
onMounted(async () => {
    loadingState.value = true;
    try {
        const [, state] = await Promise.all([
            fetchSystems(),
            $fetch<{ activeAdventureId: string | null; adventure: Adventure | null; system: System | null }>('/api/display-state'),
        ]);
        if (state.activeAdventureId && state.adventure && state.system) {
            activeAdventureId.value = state.activeAdventureId;
            activeAdventure.value = state.adventure;
            activeSystem.value = state.system;
            await fetchCharacters(state.activeAdventureId);
        }
    } finally {
        loadingState.value = false;
    }
});
</script>

<template>
    <div class="flex h-full flex-col">
        <!-- Header -->
        <div class="shrink-0 border-b border-gray-800 bg-gray-900 px-4 py-3">
            <h1 class="text-base font-semibold text-gray-100">Session</h1>
        </div>

        <div class="min-h-0 flex-1 space-y-6 overflow-y-auto p-4">
            <!-- ── Active Campaign ──────────────────────────────── -->
            <section>
                <div class="mb-3 flex items-center justify-between">
                    <h2 class="text-xs font-semibold tracking-widest text-gray-500 uppercase">Campaign</h2>
                    <UButton
                        v-if="activeAdventureId"
                        size="xs"
                        color="neutral"
                        variant="ghost"
                        icon="i-heroicons-x-mark"
                        :loading="settingAdventure"
                        @click="clearActiveAdventure"
                    />
                </div>

                <!-- Active badge -->
                <div
                    v-if="activeAdventure"
                    class="mb-3 flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-2.5"
                >
                    <UIcon
                        name="i-heroicons-play-circle-solid"
                        class="size-4 shrink-0 text-violet-400"
                    />
                    <div class="min-w-0 flex-1">
                        <p class="truncate text-sm font-medium text-violet-300">{{ activeAdventure.name }}</p>
                        <p class="truncate text-xs text-violet-500">{{ activeSystem?.name }}</p>
                    </div>
                </div>

                <!-- Selector panel -->
                <div class="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
                    <!-- Systems list -->
                    <template v-if="selectorStep === 'systems'">
                        <div class="border-b border-gray-800 px-3 py-2">
                            <p class="text-xs text-gray-500">Select a system</p>
                        </div>
                        <div
                            v-if="loadingSystems"
                            class="space-y-px p-2"
                        >
                            <USkeleton
                                v-for="n in 3"
                                :key="n"
                                class="h-10 w-full rounded-lg"
                            />
                        </div>
                        <div
                            v-else-if="!systemsList.length"
                            class="px-3 py-6 text-center text-sm text-gray-500"
                        >
                            No systems found
                        </div>
                        <ul
                            v-else
                            class="divide-y divide-gray-800"
                        >
                            <li
                                v-for="system in systemsList"
                                :key="system.id"
                            >
                                <button
                                    class="flex w-full items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-gray-800 active:bg-gray-700"
                                    @click="selectSystem(system)"
                                >
                                    <span class="truncate text-sm text-gray-200">{{ system.name }}</span>
                                    <UIcon
                                        name="i-heroicons-chevron-right"
                                        class="size-4 shrink-0 text-gray-600"
                                    />
                                </button>
                            </li>
                        </ul>
                    </template>

                    <!-- Adventures list -->
                    <template v-else>
                        <button
                            class="flex w-full items-center gap-2 border-b border-gray-800 px-3 py-2 transition-colors hover:bg-gray-800"
                            @click="backToSystems"
                        >
                            <UIcon
                                name="i-heroicons-chevron-left"
                                class="size-4 text-gray-400"
                            />
                            <span class="text-xs text-gray-400">{{ browsingSystem?.name }}</span>
                        </button>
                        <div
                            v-if="loadingAdventures"
                            class="space-y-px p-2"
                        >
                            <USkeleton
                                v-for="n in 3"
                                :key="n"
                                class="h-10 w-full rounded-lg"
                            />
                        </div>
                        <div
                            v-else-if="!adventuresList.length"
                            class="px-3 py-6 text-center text-sm text-gray-500"
                        >
                            No campaigns in this system
                        </div>
                        <ul
                            v-else
                            class="divide-y divide-gray-800"
                        >
                            <li
                                v-for="adventure in adventuresList"
                                :key="adventure.id"
                            >
                                <button
                                    class="flex w-full items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-gray-800 active:bg-gray-700"
                                    :class="activeAdventureId === adventure.id ? 'bg-violet-500/10' : ''"
                                    :disabled="settingAdventure"
                                    @click="setActiveAdventure(adventure)"
                                >
                                    <span
                                        class="truncate text-sm"
                                        :class="activeAdventureId === adventure.id ? 'font-medium text-violet-300' : 'text-gray-200'"
                                    >
                                        {{ adventure.name }}
                                    </span>
                                    <UIcon
                                        v-if="activeAdventureId === adventure.id"
                                        name="i-heroicons-check-circle-solid"
                                        class="size-4 shrink-0 text-violet-400"
                                    />
                                    <UIcon
                                        v-else
                                        name="i-heroicons-chevron-right"
                                        class="size-4 shrink-0 text-gray-600"
                                    />
                                </button>
                            </li>
                        </ul>
                    </template>
                </div>
            </section>

            <!-- ── Player Characters ───────────────────────────── -->
            <section v-if="activeAdventure">
                <div class="mb-3 flex items-center justify-between">
                    <h2 class="text-xs font-semibold tracking-widest text-gray-500 uppercase">Player Characters</h2>
                    <UButton
                        size="xs"
                        color="neutral"
                        variant="outline"
                        leading-icon="i-heroicons-plus"
                        @click="showNpcModal = true"
                    >
                        Add NPC
                    </UButton>
                </div>

                <div
                    v-if="loadingCharacters"
                    class="grid grid-cols-3 gap-3"
                >
                    <USkeleton
                        v-for="n in 4"
                        :key="n"
                        class="h-24 w-full rounded-xl"
                    />
                </div>

                <div
                    v-else-if="!pcCharacters.length"
                    class="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-800 px-4 py-10"
                >
                    <UIcon
                        name="i-heroicons-user-group"
                        class="size-8 text-gray-700"
                    />
                    <p class="text-sm text-gray-500">No player characters yet</p>
                    <p class="text-xs text-gray-600">Add PCs in the adventure's Characters tab</p>
                </div>

                <div
                    v-else
                    class="grid grid-cols-3 gap-3"
                >
                    <div
                        v-for="character in pcCharacters"
                        :key="character.id"
                        class="flex flex-col items-center gap-2 rounded-xl bg-gray-900 p-3"
                    >
                        <div class="size-14 overflow-hidden rounded-full bg-gray-800 ring-2 ring-violet-500/30">
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
                                    class="size-6 text-gray-500"
                                />
                            </div>
                        </div>
                        <p class="w-full truncate text-center text-xs font-medium text-gray-200">
                            {{ character.name }}
                        </p>
                        <span
                            v-if="character.playbook"
                            class="truncate text-[10px] text-gray-500"
                        >
                            {{ character.playbook }}
                        </span>
                    </div>
                </div>

                <CharacterCreateModal
                    v-model:open="showNpcModal"
                    :adventure-id="activeAdventure.id"
                    :system-id="activeAdventure.systemId"
                    @created="fetchCharacters(activeAdventure!.id)"
                />
            </section>
        </div>
    </div>
</template>
