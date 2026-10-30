<script setup lang="ts">
import type { Location } from '#shared/types/models';
import type { BackgroundWithUrl } from '~/types/background';

const props = defineProps<{
    adventureId: string;
    systemId: string;
    locations: Location[];
}>();

const list = ref<BackgroundWithUrl[]>([]);
const loading = ref(false);
const showModal = ref(false);
const editingBackground = ref<BackgroundWithUrl | null>(null);
const search = ref('');
const collapsedGroups = ref<Set<string>>(new Set());

function toggleGroup(key: string) {
    if (collapsedGroups.value.has(key)) {
        collapsedGroups.value.delete(key);
    } else {
        collapsedGroups.value.add(key);
    }
    collapsedGroups.value = new Set(collapsedGroups.value);
}

const allCollapsed = computed(() => groups.value.length > 0 && groups.value.every((g) => collapsedGroups.value.has(g.key)));

function toggleAll() {
    if (allCollapsed.value) {
        collapsedGroups.value = new Set();
    } else {
        collapsedGroups.value = new Set(groups.value.map((g) => g.key));
    }
}

const filteredList = computed(() => {
    const q = search.value.trim().toLowerCase();
    if (!q) return list.value;
    return list.value.filter((bg) => bg.name.toLowerCase().includes(q));
});

interface BackgroundGroup {
    key: string;
    label: string;
    items: BackgroundWithUrl[];
}

const groups = computed<BackgroundGroup[]>(() => {
    const locationMap = new Map(props.locations.map((l) => [l.id, l.name]));
    const byLocation = new Map<string | null, BackgroundWithUrl[]>();

    for (const bg of filteredList.value) {
        const key = bg.locationId ?? null;
        if (!byLocation.has(key)) byLocation.set(key, []);
        byLocation.get(key)!.push(bg);
    }

    const result: BackgroundGroup[] = [];

    // Named location groups in location order
    for (const loc of props.locations) {
        const items = byLocation.get(loc.id);
        if (items?.length) {
            result.push({ key: loc.id, label: locationMap.get(loc.id) ?? loc.id, items });
        }
    }

    // No-location group last
    const unlocated = byLocation.get(null);
    if (unlocated?.length) {
        result.push({ key: '__none__', label: 'No location', items: unlocated });
    }

    return result;
});

async function fetchBackgrounds() {
    loading.value = true;
    try {
        const { backgrounds } = await $fetch<{ backgrounds: BackgroundWithUrl[] }>(
            '/api/backgrounds',
            { query: { adventureId: props.adventureId } }
        );
        list.value = backgrounds;
    } finally {
        loading.value = false;
    }
}

function openCreate() {
    editingBackground.value = null;
    showModal.value = true;
}

function openEdit(bg: BackgroundWithUrl) {
    editingBackground.value = bg;
    showModal.value = true;
}

function onCreated(background: BackgroundWithUrl) {
    list.value.push(background);
    list.value.sort((a, b) => a.name.localeCompare(b.name));
}

function onUpdated(background: BackgroundWithUrl) {
    const idx = list.value.findIndex((b) => b.id === background.id);
    if (idx !== -1) list.value[idx] = background;
    list.value.sort((a, b) => a.name.localeCompare(b.name));
}

function onDeleted(id: string) {
    list.value = list.value.filter((b) => b.id !== id);
}

onMounted(fetchBackgrounds);
</script>

<template>
    <div>
        <div class="sticky top-0 z-10 space-y-2 bg-gray-900 p-4 pb-2">
            <div class="flex gap-2">
                <UInput
                    v-model="search"
                    placeholder="Search backgrounds…"
                    leading-icon="i-heroicons-magnifying-glass"
                    size="sm"
                    class="flex-1"
                />
                <UButton
                    size="sm"
                    leading-icon="i-heroicons-plus"
                    @click="openCreate"
                >
                    Add
                </UButton>
                <UButton
                    v-if="groups.length > 0"
                    size="sm"
                    variant="ghost"
                    color="neutral"
                    :icon="allCollapsed ? 'i-heroicons-arrows-pointing-out' : 'i-heroicons-arrows-pointing-in'"
                    :title="allCollapsed ? 'Expand all' : 'Collapse all'"
                    @click="toggleAll"
                />
            </div>
            <p class="text-xs text-gray-500">
                {{ filteredList.length }} background{{ filteredList.length !== 1 ? 's' : '' }}
            </p>
        </div>

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
            v-else-if="!list.length"
            class="flex flex-col items-center justify-center gap-4 px-6 py-20"
        >
            <UIcon
                name="i-heroicons-photo"
                class="size-12 text-gray-700"
            />
            <div class="text-center">
                <p class="text-sm font-medium text-gray-400">No backgrounds yet</p>
                <p class="mt-1 text-xs text-gray-600">Add images to use as backgrounds</p>
            </div>
        </div>

        <p
            v-else-if="!filteredList.length"
            class="px-4 py-8 text-center text-sm text-gray-500"
        >
            No backgrounds match your search
        </p>

        <div
            v-else
            class="p-2"
        >
            <div
                v-for="group in groups"
                :key="group.key"
                class="mb-1"
            >
                <!-- Group header -->
                <button
                    class="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-gray-800"
                    @click="toggleGroup(group.key)"
                >
                    <UIcon
                        :name="collapsedGroups.has(group.key) ? 'i-heroicons-chevron-right' : 'i-heroicons-chevron-down'"
                        class="size-3.5 shrink-0 text-gray-500"
                    />
                    <span class="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        {{ group.label }}
                    </span>
                    <span class="text-xs text-gray-600">{{ group.items.length }}</span>
                </button>

                <!-- Group items -->
                <ul
                    v-if="!collapsedGroups.has(group.key)"
                    class="space-y-0.5"
                >
                    <li
                        v-for="bg in group.items"
                        :key="bg.id"
                    >
                        <button
                            class="flex w-full items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-gray-800 active:bg-gray-700"
                            @click="openEdit(bg)"
                        >
                            <div class="size-14 shrink-0 overflow-hidden rounded-lg bg-gray-800">
                                <img
                                    v-if="bg.url"
                                    :src="bg.url"
                                    :alt="bg.name"
                                    class="size-full object-cover"
                                />
                            </div>

                            <div class="min-w-0 flex-1 text-left">
                                <p class="truncate text-sm text-gray-200">{{ bg.name }}</p>
                            </div>

                            <UIcon
                                name="i-heroicons-pencil"
                                class="size-4 shrink-0 text-gray-600"
                            />
                        </button>
                    </li>
                </ul>
            </div>
        </div>

        <BackgroundCreateEditModal
            v-model:open="showModal"
            :adventure-id="adventureId"
            :system-id="systemId"
            :locations="locations"
            :background="editingBackground"
            @created="onCreated"
            @updated="onUpdated"
            @deleted="onDeleted"
        />
    </div>
</template>
