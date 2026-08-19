<script setup lang="ts">
import type { Adventure, System } from '#shared/types/models';

const route = useRoute();
const systemId = String(route.params.id);

const system = ref<System | null>(null);
const adventuresList = ref<Adventure[]>([]);
const loading = ref(false);
const fetchError = ref<string | null>(null);
const showModal = ref(false);

// Rename state
const renameTarget = ref<Adventure | null>(null);
const renameName = ref('');
const renameDescription = ref('');
const renaming = ref(false);
const renameError = ref<string | null>(null);

// Delete state
const deleteTarget = ref<Adventure | null>(null);
const deleting = ref(false);
const deleteError = ref<string | null>(null);

const toast = useToast();

function getPassword() {
    return localStorage.getItem('app_password') ?? '';
}

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

function openRename(adventure: Adventure) {
    renameTarget.value = adventure;
    renameName.value = adventure.name;
    renameDescription.value = adventure.description ?? '';
    renameError.value = null;
}

function closeRename() {
    renameTarget.value = null;
}

async function submitRename() {
    if (!renameTarget.value || !renameName.value.trim()) return;
    renaming.value = true;
    renameError.value = null;
    try {
        await $fetch(`/api/adventures/${renameTarget.value.id}`, {
            method: 'PATCH',
            body: {
                name: renameName.value.trim(),
                description: renameDescription.value.trim() || null,
                password: getPassword(),
            },
        });
        await fetchData();
        closeRename();
        toast.add({ title: 'Adventure updated', color: 'success', icon: 'i-heroicons-check-circle' });
    } catch (e: unknown) {
        renameError.value = e instanceof Error ? e.message : 'Could not update adventure';
    } finally {
        renaming.value = false;
    }
}

function openDelete(adventure: Adventure) {
    deleteTarget.value = adventure;
    deleteError.value = null;
}

function closeDelete() {
    deleteTarget.value = null;
}

async function submitDelete() {
    if (!deleteTarget.value) return;
    deleting.value = true;
    deleteError.value = null;
    try {
        await $fetch(`/api/adventures/${deleteTarget.value.id}`, {
            method: 'DELETE',
            body: { password: getPassword(), systemId },
        });
        await fetchData();
        closeDelete();
        toast.add({ title: 'Adventure deleted', color: 'success', icon: 'i-heroicons-check-circle' });
    } catch (e: unknown) {
        deleteError.value = e instanceof Error ? e.message : 'Could not delete adventure';
    } finally {
        deleting.value = false;
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
                    @click="void (showModal = true)"
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
                    @click="void (showModal = true)"
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
                    class="group flex items-center gap-1 rounded-xl transition-colors hover:bg-gray-800"
                >
                    <NuxtLink
                        :to="`/systems/${systemId}/adventures/${adventure.id}`"
                        class="flex min-w-0 flex-1 items-center gap-3 px-3 py-3"
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
                    <div class="flex shrink-0 items-center gap-0.5 pr-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <UButton
                            variant="ghost"
                            color="neutral"
                            size="xs"
                            icon="i-heroicons-pencil"
                            :padded="false"
                            class="p-1.5"
                            @click.prevent="openRename(adventure)"
                        />
                        <UButton
                            variant="ghost"
                            color="error"
                            size="xs"
                            icon="i-heroicons-trash"
                            :padded="false"
                            class="p-1.5"
                            @click.prevent="openDelete(adventure)"
                        />
                    </div>
                </li>
            </ul>
        </div>
    </div>

    <AdventureCreateModal
        v-model:open="showModal"
        :system-id="systemId"
        @created="fetchData"
    />

    <!-- Rename Modal -->
    <UModal
        :open="!!renameTarget"
        title="Rename Adventure"
        :content="{ onOpenAutoFocus: (e: Event) => e.preventDefault() }"
        @update:open="(v) => { if (!v) closeRename(); }"
    >
        <template #body>
            <div class="space-y-4">
                <UFormField
                    label="Name"
                    required
                >
                    <UInput
                        v-model="renameName"
                        placeholder="Adventure name"
                        autofocus
                        @keyup.enter="submitRename"
                    />
                </UFormField>
                <UFormField label="Description">
                    <UTextarea
                        v-model="renameDescription"
                        placeholder="Optional description"
                        :rows="3"
                    />
                </UFormField>
                <p
                    v-if="renameError"
                    class="text-sm text-red-400"
                >
                    {{ renameError }}
                </p>
            </div>
        </template>
        <template #footer>
            <div class="flex justify-end gap-2">
                <UButton
                    color="neutral"
                    variant="ghost"
                    @click="closeRename"
                >
                    Cancel
                </UButton>
                <UButton
                    :loading="renaming"
                    :disabled="!renameName.trim()"
                    @click="submitRename"
                >
                    Save
                </UButton>
            </div>
        </template>
    </UModal>

    <!-- Delete Confirmation Modal -->
    <UModal
        :open="!!deleteTarget"
        title="Delete Adventure"
        @update:open="(v) => { if (!v) closeDelete(); }"
    >
        <template #body>
            <p class="text-sm text-gray-300">
                Are you sure you want to delete
                <span class="font-semibold text-gray-100">{{ deleteTarget?.name }}</span>?
                This will permanently remove the adventure and all its characters, backgrounds, and scenes.
            </p>
            <p
                v-if="deleteError"
                class="mt-3 text-sm text-red-400"
            >
                {{ deleteError }}
            </p>
        </template>
        <template #footer>
            <div class="flex justify-end gap-2">
                <UButton
                    color="neutral"
                    variant="ghost"
                    @click="closeDelete"
                >
                    Cancel
                </UButton>
                <UButton
                    color="error"
                    :loading="deleting"
                    @click="submitDelete"
                >
                    Delete
                </UButton>
            </div>
        </template>
    </UModal>
</template>
