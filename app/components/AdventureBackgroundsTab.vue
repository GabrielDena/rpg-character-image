<script setup lang="ts">
import type { Location } from '#shared/types/models';
import type { BackgroundWithUrl } from '~/types/background';

const props = defineProps<{
    adventureId: string;
    systemId: string;
}>();

const toast = useToast();

const list = ref<BackgroundWithUrl[]>([]);
const locations = ref<Location[]>([]);
const loading = ref(false);
const showModal = ref(false);
const editingBackground = ref<BackgroundWithUrl | null>(null);
const search = ref('');
const locationFilter = ref<string>('all');

const locationFilterOptions = computed(() => [
    { value: 'all', label: 'All locations' },
    { value: 'none', label: 'No location' },
    ...locations.value.map((l) => ({ value: l.id, label: l.name })),
]);

const filtered = computed(() => {
    const q = search.value.trim().toLowerCase();
    let result = list.value;

    if (locationFilter.value === 'none') {
        result = result.filter((bg) => !bg.locationId);
    } else if (locationFilter.value !== 'all') {
        result = result.filter((bg) => bg.locationId === locationFilter.value);
    }

    if (q) result = result.filter((bg) => bg.name.toLowerCase().includes(q));

    return result;
});

function locationName(locationId: string | null) {
    if (!locationId) return null;
    return locations.value.find((l) => l.id === locationId)?.name ?? null;
}

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

async function fetchLocations() {
    const { locations: rows } = await $fetch<{ locations: Location[] }>('/api/locations', {
        query: { adventureId: props.adventureId },
    });
    locations.value = rows;
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

async function deleteBackground(bg: BackgroundWithUrl) {
    try {
        await $fetch(`/api/backgrounds/${bg.id}`, {
            method: 'DELETE',
            body: { password: localStorage.getItem('app_password') ?? '' },
        });
        list.value = list.value.filter((b) => b.id !== bg.id);
        toast.add({ title: 'Background deleted', color: 'success' });
    } catch (e: unknown) {
        toast.add({ title: 'Delete failed', color: 'error', description: e instanceof Error ? e.message : 'Unknown error' });
    }
}

onMounted(() => {
    fetchBackgrounds();
    fetchLocations();
});
</script>

<template>
    <div>
        <div class="sticky top-0 z-10 space-y-2 bg-gray-900 p-4 pb-2">
            <div class="flex items-center justify-between">
                <p class="text-xs text-gray-500">
                    {{ filtered.length }} background{{ filtered.length !== 1 ? 's' : '' }}
                </p>
                <UButton
                    size="sm"
                    leading-icon="i-heroicons-plus"
                    @click="openCreate"
                >
                    Add
                </UButton>
            </div>
            <div class="flex gap-2">
                <UInput
                    v-model="search"
                    placeholder="Search backgrounds…"
                    leading-icon="i-heroicons-magnifying-glass"
                    size="sm"
                    class="flex-1"
                />
                <USelect
                    v-model="locationFilter"
                    :items="locationFilterOptions"
                    size="sm"
                    class="w-40 shrink-0"
                />
            </div>
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
            v-else-if="!filtered.length"
            class="px-4 py-8 text-center text-sm text-gray-500"
        >
            No backgrounds match your filters
        </p>

        <ul
            v-else
            class="space-y-0.5 p-2"
        >
            <li
                v-for="bg in filtered"
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
                        <UBadge
                            v-if="locationName(bg.locationId)"
                            :label="locationName(bg.locationId)!"
                            size="xs"
                            variant="subtle"
                            color="violet"
                            class="mt-0.5"
                        />
                    </div>

                    <UButton
                        size="xs"
                        variant="ghost"
                        color="error"
                        icon="i-heroicons-trash"
                        class="shrink-0"
                        @click.stop="deleteBackground(bg)"
                    />
                </button>
            </li>
        </ul>

        <BackgroundCreateEditModal
            v-model:open="showModal"
            :adventure-id="adventureId"
            :system-id="systemId"
            :locations="locations"
            :background="editingBackground"
            @created="onCreated"
            @updated="onUpdated"
        />
    </div>
</template>
