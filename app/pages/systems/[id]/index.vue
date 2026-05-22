<script setup lang="ts">
import type { Adventure, System } from '#shared/types/models';

const route = useRoute();
const systemId = String(route.params.id);

const system = ref<System | null>(null);
const adventuresList = ref<Adventure[]>([]);
const loading = ref(false);
const fetchError = ref<string | null>(null);
const showModal = ref(false);

async function fetchData() {
    loading.value = true;
    fetchError.value = null;
    try {
        const [systemData, adventuresData] = await Promise.all([
            $fetch<{ system: System }>(`/api/systems/${systemId}`),
            $fetch<{ adventures: Adventure[] }>('/api/adventures', { query: { systemId } }),
        ]);
        system.value = systemData.system;
        adventuresList.value = adventuresData.adventures;
    } catch (e: unknown) {
        fetchError.value = e instanceof Error ? e.message : 'Could not load data';
    } finally {
        loading.value = false;
    }
}

onMounted(fetchData);
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
                    to="/"
                />
                <h1 class="min-w-0 flex-1 truncate text-base font-semibold text-gray-100">
                    <USkeleton
                        v-if="loading && !system"
                        class="h-5 w-32"
                    />
                    <span v-else>{{ system?.name }}</span>
                </h1>
                <UButton
                    size="sm"
                    leading-icon="i-heroicons-plus"
                    :disabled="!system"
                    @click="showModal = true"
                >
                    New Adventure
                </UButton>
            </div>
        </div>

        <!-- Content -->
        <div class="min-h-0 flex-1 overflow-y-auto">
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
                v-else-if="fetchError"
                class="p-4"
            >
                <UAlert
                    icon="i-heroicons-exclamation-triangle"
                    color="error"
                    variant="soft"
                    title="Could not load adventures"
                    :description="fetchError"
                    :actions="[
                        {
                            label: 'Retry',
                            leadingIcon: 'i-heroicons-arrow-path',
                            onClick: fetchData,
                        },
                    ]"
                />
            </div>

            <div
                v-else-if="!adventuresList.length"
                class="flex h-full flex-col items-center justify-center gap-4 px-6 py-20"
            >
                <UIcon
                    name="i-heroicons-map"
                    class="size-12 text-gray-700"
                />
                <div class="text-center">
                    <p class="text-sm font-medium text-gray-400">No adventures yet</p>
                    <p class="mt-1 text-xs text-gray-600">
                        Add the first adventure for this system
                    </p>
                </div>
                <UButton
                    leading-icon="i-heroicons-plus"
                    @click="showModal = true"
                >
                    New Adventure
                </UButton>
            </div>

            <ul
                v-else
                class="space-y-0.5 p-2"
            >
                <li
                    v-for="adventure in adventuresList"
                    :key="adventure.id"
                >
                    <NuxtLink
                        :to="`/systems/${systemId}/adventures/${adventure.id}`"
                        class="flex w-full items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-gray-800 active:bg-gray-700"
                    >
                        <UIcon
                            name="i-heroicons-map"
                            class="size-5 shrink-0 text-gray-500"
                        />
                        <div class="min-w-0 flex-1">
                            <p class="truncate text-sm font-medium text-gray-200">
                                {{ adventure.name }}
                            </p>
                            <p
                                v-if="adventure.description"
                                class="truncate text-xs text-gray-500"
                            >
                                {{ adventure.description }}
                            </p>
                        </div>
                        <UIcon
                            name="i-heroicons-chevron-right"
                            class="size-4 shrink-0 text-gray-600"
                        />
                    </NuxtLink>
                </li>
            </ul>
        </div>
    </div>

    <AdventureCreateModal
        v-model:open="showModal"
        :system-id="systemId"
        @created="fetchData"
    />
</template>

