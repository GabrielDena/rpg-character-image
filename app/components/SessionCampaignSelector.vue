<script setup lang="ts">
import type { Adventure, System } from '#shared/types/models';

const props = defineProps<{
    activeAdventureId: string | null;
    activeAdventure: Adventure | null;
    activeSystem: System | null;
    loading: boolean;
}>();

const emit = defineEmits<{
    select: [adventure: Adventure, system: System];
    clear: [];
}>();

const toast = useToast();

type SelectorStep = 'systems' | 'adventures';

const selectorStep = ref<SelectorStep>('systems');
const systemsList = ref<System[]>([]);
const adventuresList = ref<Adventure[]>([]);
const browsingSystem = ref<System | null>(null);
const loadingSystems = ref(false);
const loadingAdventures = ref(false);
const settingAdventure = ref(false);
const show = ref(true);

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
        emit('select', adventure, browsingSystem.value!);
    } finally {
        settingAdventure.value = false;
    }
}

onMounted(async () => {
    await fetchSystems();
    if (props.activeAdventure && props.activeSystem) {
        selectorStep.value = 'adventures';
        await selectSystem(props.activeSystem);
    }
});
</script>

<template>
    <SessionCard title="Campaign">
        <template #action>
            <UButton
                size="xs"
                color="neutral"
                variant="ghost"
                :icon="show ? 'i-heroicons-eye' : 'i-heroicons-eye-slash'"
                @click="void (show = !show)"
            />
            <UButton
                v-if="activeAdventureId"
                size="xs"
                color="neutral"
                variant="ghost"
                icon="i-heroicons-x-mark"
                :loading="loading"
                @click="emit('clear')"
            />
        </template>

        <div
            v-if="show"
            class="flex gap-2 p-2"
        >
            <!-- Selector panel -->
            <div class="w-full overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
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
                                <span class="truncate text-sm text-gray-200">{{
                                    system.name
                                }}</span>
                                <UIcon
                                    name="i-heroicons-chevron-right"
                                    class="size-4 shrink-0 text-gray-600"
                                />
                            </button>
                        </li>
                    </ul>
                </template>

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
                                :class="
                                    activeAdventureId === adventure.id ? 'bg-violet-500/10' : ''
                                "
                                :disabled="settingAdventure"
                                @click="setActiveAdventure(adventure)"
                            >
                                <span
                                    class="truncate text-sm"
                                    :class="
                                        activeAdventureId === adventure.id
                                            ? 'font-medium text-violet-300'
                                            : 'text-gray-200'
                                    "
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

            <!-- Active badge -->
            <div
                v-if="activeAdventure"
                class="flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-2.5"
            >
                <UIcon
                    name="i-heroicons-play-circle-solid"
                    class="size-4 shrink-0 text-violet-400"
                />
                <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium text-violet-300">
                        {{ activeAdventure.name }}
                    </p>
                    <p class="truncate text-xs text-violet-500">{{ activeSystem?.name }}</p>
                </div>
            </div>
        </div>
    </SessionCard>
</template>

