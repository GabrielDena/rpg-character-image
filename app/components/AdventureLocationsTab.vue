<script setup lang="ts">
import type { Location } from '#shared/types/models';

const props = defineProps<{
    adventureId: string;
    systemId: string;
    locations: Location[];
    loading: boolean;
}>();

const emit = defineEmits<{
    'location-added': [location: Location];
    'location-updated': [location: Location];
    'location-deleted': [id: string];
}>();

const toast = useToast();

const editingId = ref<string | null>(null);
const editingName = ref('');
const search = ref('');
const adding = ref(false);
const newName = ref('');

const filtered = computed(() => {
    const q = search.value.trim().toLowerCase();
    if (!q) return props.locations;
    return props.locations.filter((l) => l.name.toLowerCase().includes(q));
});

function getPassword() {
    return localStorage.getItem('app_password') ?? '';
}

async function addLocation() {
    const name = newName.value.trim();
    if (!name) return;
    try {
        const { location } = await $fetch<{ location: Location }>('/api/locations', {
            method: 'POST',
            body: { name, adventureId: props.adventureId, password: getPassword() },
        });
        emit('location-added', location);
        newName.value = '';
        adding.value = false;
    } catch (e: unknown) {
        toast.add({ title: 'Failed to add location', color: 'error', description: e instanceof Error ? e.message : 'Unknown error' });
    }
}

function cancelAdd() {
    adding.value = false;
    newName.value = '';
}

function startEdit(loc: Location) {
    editingId.value = loc.id;
    editingName.value = loc.name;
}

function cancelEdit() {
    editingId.value = null;
    editingName.value = '';
}

async function saveEdit(loc: Location) {
    const name = editingName.value.trim();
    if (!name) return;
    try {
        const { location } = await $fetch<{ location: Location }>(`/api/locations/${loc.id}`, {
            method: 'PATCH',
            body: { name, password: getPassword() },
        });
        emit('location-updated', location);
        editingId.value = null;
    } catch (e: unknown) {
        toast.add({ title: 'Rename failed', color: 'error', description: e instanceof Error ? e.message : 'Unknown error' });
    }
}

async function deleteLocation(loc: Location) {
    try {
        await $fetch(`/api/locations/${loc.id}`, {
            method: 'DELETE',
            body: { password: getPassword() },
        });
        emit('location-deleted', loc.id);
        toast.add({ title: 'Location deleted', color: 'success' });
    } catch (e: unknown) {
        toast.add({ title: 'Delete failed', color: 'error', description: e instanceof Error ? e.message : 'Unknown error' });
    }
}
</script>

<template>
    <div>
        <div class="sticky top-0 z-10 space-y-2 bg-gray-900 p-4 pb-2">
            <div class="flex items-center justify-between">
                <p class="text-xs text-gray-500">
                    {{ filtered.length }} location{{ filtered.length !== 1 ? 's' : '' }}
                </p>
                <UButton
                    size="sm"
                    leading-icon="i-heroicons-plus"
                    @click="adding = true"
                >
                    Add
                </UButton>
            </div>
            <UInput
                v-model="search"
                placeholder="Search locations…"
                leading-icon="i-heroicons-magnifying-glass"
                size="sm"
                :ui="{ root: 'w-full' }"
            />
        </div>

        <div
            v-if="adding"
            class="flex items-center gap-2 px-4 py-2"
        >
            <input
                v-model="newName"
                autofocus
                placeholder="Location name"
                class="min-w-0 flex-1 rounded-md bg-gray-700 px-2 py-1 text-sm text-gray-100 ring-1 ring-violet-500 outline-none"
                @keyup.enter="addLocation"
                @keyup.escape="cancelAdd"
            />
            <UButton
                size="xs"
                variant="ghost"
                color="neutral"
                icon="i-heroicons-check"
                @click="addLocation"
            />
            <UButton
                size="xs"
                variant="ghost"
                color="neutral"
                icon="i-heroicons-x-mark"
                @click="cancelAdd"
            />
        </div>

        <div
            v-if="loading"
            class="space-y-2 p-4"
        >
            <USkeleton
                v-for="n in 3"
                :key="n"
                class="h-10 w-full rounded-xl"
            />
        </div>

        <div
            v-else-if="!locations.length && !adding"
            class="flex flex-col items-center justify-center gap-4 px-6 py-20"
        >
            <UIcon
                name="i-heroicons-map-pin"
                class="size-12 text-gray-700"
            />
            <div class="text-center">
                <p class="text-sm font-medium text-gray-400">No locations yet</p>
                <p class="mt-1 text-xs text-gray-600">Add locations to organize your adventure</p>
            </div>
        </div>

        <p
            v-else-if="search && !filtered.length"
            class="px-4 py-8 text-center text-sm text-gray-500"
        >
            No locations match "{{ search }}"
        </p>

        <ul
            v-else
            class="space-y-px p-2"
        >
            <li
                v-for="loc in filtered"
                :key="loc.id"
                class="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-gray-800"
            >
                <UIcon
                    name="i-heroicons-map-pin"
                    class="size-4 shrink-0 text-gray-500"
                />

                <div class="min-w-0 flex-1">
                    <input
                        v-if="editingId === loc.id"
                        v-model="editingName"
                        autofocus
                        class="w-full rounded-md bg-gray-700 px-2 py-1 text-sm text-gray-100 ring-1 ring-violet-500 outline-none"
                        @keyup.enter="saveEdit(loc)"
                        @keyup.escape="cancelEdit"
                        @blur="cancelEdit"
                    />
                    <p
                        v-else
                        class="truncate text-sm text-gray-200"
                    >
                        {{ loc.name }}
                    </p>
                </div>

                <div class="flex shrink-0 items-center gap-1">
                    <template v-if="editingId === loc.id">
                        <UButton
                            size="xs"
                            variant="ghost"
                            color="neutral"
                            icon="i-heroicons-check"
                            @mousedown.prevent="saveEdit(loc)"
                        />
                        <UButton
                            size="xs"
                            variant="ghost"
                            color="neutral"
                            icon="i-heroicons-x-mark"
                            @mousedown.prevent="cancelEdit"
                        />
                    </template>
                    <template v-else>
                        <UButton
                            size="xs"
                            variant="ghost"
                            color="neutral"
                            icon="i-heroicons-pencil"
                            @click="startEdit(loc)"
                        />
                        <UButton
                            size="xs"
                            variant="ghost"
                            color="error"
                            icon="i-heroicons-trash"
                            @click="deleteLocation(loc)"
                        />
                    </template>
                </div>
            </li>
        </ul>
    </div>
</template>
