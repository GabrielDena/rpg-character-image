<script setup lang="ts">
import type { System } from '#shared/types/models';

const isAuthenticated = ref(false);
const showModal = ref(false);

const systemsList = ref<System[]>([]);
const loading = ref(false);
const fetchError = ref<string | null>(null);

async function fetchSystems() {
    loading.value = true;
    fetchError.value = null;
    try {
        const data = await $fetch<{ systems: System[] }>('/api/systems');
        systemsList.value = data.systems;
    } catch (e: unknown) {
        fetchError.value = e instanceof Error ? e.message : 'Could not load systems';
    } finally {
        loading.value = false;
    }
}

function onAuthenticated() {
    isAuthenticated.value = true;
    fetchSystems();
}

onMounted(() => {
    isAuthenticated.value = !!localStorage.getItem('app_password');
    if (isAuthenticated.value) fetchSystems();
});
</script>

<template>
    <PasswordGate
        v-if="!isAuthenticated"
        @authenticated="onAuthenticated"
    />

    <div
        v-else
        class="flex h-full flex-col"
    >
        <!-- Header -->
        <div class="shrink-0 border-b border-gray-800 bg-gray-900 px-4 py-3">
            <div class="flex items-center justify-between">
                <h1 class="text-base font-semibold text-gray-100">Systems</h1>
                <UButton
                    size="sm"
                    leading-icon="i-heroicons-plus"
                    @click="void (showModal = true)"
                >
                    New System
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
                    v-for="n in 4"
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
                    title="Could not load systems"
                    :description="fetchError"
                    :actions="[
                        {
                            label: 'Retry',
                            leadingIcon: 'i-heroicons-arrow-path',
                            onClick: fetchSystems,
                        },
                    ]"
                />
            </div>

            <div
                v-else-if="!systemsList.length"
                class="flex h-full flex-col items-center justify-center gap-4 px-6 py-20"
            >
                <UIcon
                    name="i-heroicons-book-open"
                    class="size-12 text-gray-700"
                />
                <div class="text-center">
                    <p class="text-sm font-medium text-gray-400">No systems yet</p>
                    <p class="mt-1 text-xs text-gray-600">
                        Create your first RPG system to get started
                    </p>
                </div>
                <UButton
                    leading-icon="i-heroicons-plus"
                    @click="void (showModal = true)"
                >
                    New System
                </UButton>
            </div>

            <ul
                v-else
                class="space-y-0.5 p-2"
            >
                <li
                    v-for="system in systemsList"
                    :key="system.id"
                >
                    <NuxtLink
                        :to="`/systems/${system.id}`"
                        class="flex w-full items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-gray-800 active:bg-gray-700"
                    >
                        <UIcon
                            name="i-heroicons-book-open"
                            class="size-5 shrink-0 text-gray-500"
                        />
                        <div class="min-w-0 flex-1">
                            <p class="truncate text-sm font-medium text-gray-200">
                                {{ system.name }}
                            </p>
                            <p
                                v-if="system.description"
                                class="truncate text-xs text-gray-500"
                            >
                                {{ system.description }}
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

    <SystemCreateModal
        v-model:open="showModal"
        @created="fetchSystems"
    />
</template>

