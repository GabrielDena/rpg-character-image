<script setup lang="ts">
import type { Adventure, Location } from '#shared/types/models';

const route = useRoute();
const systemId = String(route.params.id);
const adventureId = String(route.params.adventureId);

const adventure = ref<Adventure | null>(null);
const loading = ref(false);
const fetchError = ref<string | null>(null);
const activeTab = ref<'characters' | 'locations' | 'backgrounds' | 'items'>('characters');

const locations = ref<Location[]>([]);
const locationsLoading = ref(false);

const tabs = [
    { key: 'characters' as const, label: 'Characters', icon: 'i-heroicons-user-group' },
    { key: 'locations' as const, label: 'Locations', icon: 'i-heroicons-map-pin' },
    { key: 'backgrounds' as const, label: 'Backgrounds', icon: 'i-heroicons-photo' },
    { key: 'items' as const, label: 'Items', icon: 'i-heroicons-archive-box' },
];

async function fetchAdventure() {
    loading.value = true;
    fetchError.value = null;
    try {
        const { adventure: data } = await $fetch<{ adventure: Adventure }>(`/api/adventures/${adventureId}`);
        adventure.value = data;
    } catch (e: unknown) {
        fetchError.value = e instanceof Error ? e.message : 'Could not load adventure';
    } finally {
        loading.value = false;
    }
}

async function fetchLocations() {
    locationsLoading.value = true;
    try {
        const { locations: rows } = await $fetch<{ locations: Location[] }>('/api/locations', {
            query: { adventureId },
        });
        locations.value = rows;
    } finally {
        locationsLoading.value = false;
    }
}

function onLocationAdded(location: Location) {
    locations.value.push(location);
}

function onLocationUpdated(location: Location) {
    const idx = locations.value.findIndex((l) => l.id === location.id);
    if (idx !== -1) locations.value[idx] = location;
}

function onLocationDeleted(id: string) {
    locations.value = locations.value.filter((l) => l.id !== id);
}

onMounted(() => {
    fetchAdventure();
    fetchLocations();
});
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
                        v-if="loading"
                        class="h-5 w-40"
                    />
                    <span v-else>{{ adventure?.name }}</span>
                </h1>
            </div>
        </div>

        <!-- Tabs -->
        <div class="flex shrink-0 gap-1 border-b border-gray-800 bg-gray-900 px-3">
            <button
                v-for="tab in tabs"
                :key="tab.key"
                class="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors"
                :class="
                    activeTab === tab.key
                        ? 'border-b-2 border-violet-500 text-gray-100'
                        : 'text-gray-500 hover:text-gray-400'
                "
                @click="void (activeTab = tab.key)"
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
                v-if="fetchError"
                class="p-4"
            >
                <UAlert
                    icon="i-heroicons-exclamation-triangle"
                    color="error"
                    variant="soft"
                    title="Could not load adventure"
                    :description="fetchError"
                    :actions="[{ label: 'Retry', leadingIcon: 'i-heroicons-arrow-path', onClick: fetchAdventure }]"
                />
            </div>

            <template v-else>
                <AdventureCharactersTab
                    v-show="activeTab === 'characters'"
                    :adventure-id="adventureId"
                    :system-id="systemId"
                />
                <AdventureLocationsTab
                    v-show="activeTab === 'locations'"
                    :adventure-id="adventureId"
                    :system-id="systemId"
                    :locations="locations"
                    :loading="locationsLoading"
                    @location-added="onLocationAdded"
                    @location-updated="onLocationUpdated"
                    @location-deleted="onLocationDeleted"
                />
                <AdventureBackgroundsTab
                    v-show="activeTab === 'backgrounds'"
                    :adventure-id="adventureId"
                    :system-id="systemId"
                    :locations="locations"
                />
                <AdventureItemsTab
                    v-show="activeTab === 'items'"
                    :adventure-id="adventureId"
                    :system-id="systemId"
                />
            </template>
        </div>
    </div>
</template>

