<script setup lang="ts">
import type { CharacterGroup } from '#shared/types/models';
import type { CharacterWithUrl } from '~/types/character';

const props = defineProps<{
    adventureId: string;
}>();

const toast = useToast();

const groups = ref<CharacterGroup[]>([]);
const characters = ref<CharacterWithUrl[]>([]);
const loading = ref(false);

const newGroupName = ref('');
const creating = ref(false);

const editingGroupId = ref<string | null>(null);
const editingName = ref('');
const saving = ref(false);

const confirmDeleteId = ref<string | null>(null);
const deleting = ref(false);

function getPassword() {
    return localStorage.getItem('app_password') ?? '';
}

const characterMap = computed(() => {
    const map = new Map<string, CharacterWithUrl>();
    for (const c of characters.value) map.set(c.id, c);
    return map;
});

async function fetchData() {
    loading.value = true;
    try {
        const [{ groups: groupRows }, { characters: charRows }] = await Promise.all([
            $fetch<{ groups: CharacterGroup[] }>('/api/character-groups', {
                query: { adventureId: props.adventureId },
            }),
            $fetch<{ characters: CharacterWithUrl[] }>('/api/characters', {
                query: { adventureId: props.adventureId },
            }),
        ]);
        groups.value = groupRows;
        characters.value = charRows;
    } catch {
        toast.add({ title: 'Failed to load groups', color: 'error' });
    } finally {
        loading.value = false;
    }
}

async function createGroup() {
    const name = newGroupName.value.trim();
    if (!name) return;
    creating.value = true;
    try {
        const { group } = await $fetch<{ group: CharacterGroup }>('/api/character-groups', {
            method: 'POST',
            body: { adventureId: props.adventureId, name, password: getPassword() },
        });
        groups.value.push({ ...group, memberIds: [] });
        newGroupName.value = '';
    } catch {
        toast.add({ title: 'Failed to create group', color: 'error' });
    } finally {
        creating.value = false;
    }
}

function startEdit(group: CharacterGroup) {
    editingGroupId.value = group.id;
    editingName.value = group.name;
}

async function saveEdit(group: CharacterGroup) {
    const name = editingName.value.trim();
    if (!name || name === group.name) {
        editingGroupId.value = null;
        return;
    }
    saving.value = true;
    try {
        await $fetch(`/api/character-groups/${group.id}`, {
            method: 'PATCH',
            body: { name, password: getPassword() },
        });
        const idx = groups.value.findIndex((g) => g.id === group.id);
        if (idx !== -1) groups.value[idx]!.name = name;
        editingGroupId.value = null;
    } catch {
        toast.add({ title: 'Failed to rename group', color: 'error' });
    } finally {
        saving.value = false;
    }
}

async function deleteGroup() {
    if (!confirmDeleteId.value) return;
    deleting.value = true;
    try {
        await $fetch(`/api/character-groups/${confirmDeleteId.value}`, {
            method: 'DELETE',
            body: { password: getPassword() },
        });
        groups.value = groups.value.filter((g) => g.id !== confirmDeleteId.value);
        confirmDeleteId.value = null;
    } catch {
        toast.add({ title: 'Failed to delete group', color: 'error' });
    } finally {
        deleting.value = false;
    }
}

onMounted(fetchData);
</script>

<template>
    <div>
        <!-- Create new group -->
        <div class="sticky top-0 z-10 border-b border-gray-800 bg-gray-900 p-4">
            <div class="flex gap-2">
                <UInput
                    v-model="newGroupName"
                    placeholder="New group name…"
                    class="flex-1"
                    size="sm"
                    @keydown.enter="createGroup"
                />
                <UButton
                    size="sm"
                    leading-icon="i-heroicons-plus"
                    :loading="creating"
                    :disabled="!newGroupName.trim()"
                    @click="createGroup"
                >
                    Add Group
                </UButton>
            </div>
        </div>

        <!-- Loading -->
        <div
            v-if="loading"
            class="space-y-3 p-4"
        >
            <USkeleton
                v-for="n in 3"
                :key="n"
                class="h-24 w-full rounded-xl"
            />
        </div>

        <!-- Empty state -->
        <div
            v-else-if="!groups.length"
            class="flex flex-col items-center justify-center gap-4 px-6 py-20"
        >
            <UIcon
                name="i-heroicons-user-group"
                class="size-12 text-gray-700"
            />
            <div class="text-center">
                <p class="text-sm font-medium text-gray-400">No groups yet</p>
                <p class="mt-1 text-xs text-gray-600">
                    Create a group above, or assign characters to groups in the character form
                </p>
            </div>
        </div>

        <!-- Group list -->
        <ul
            v-else
            class="space-y-2 p-4"
        >
            <li
                v-for="group in groups"
                :key="group.id"
                class="rounded-xl border border-gray-800 bg-gray-850 p-3"
            >
                <!-- Group header -->
                <div class="flex items-center gap-2">
                    <template v-if="editingGroupId === group.id">
                        <UInput
                            v-model="editingName"
                            size="sm"
                            class="flex-1"
                            autofocus
                            @keydown.enter="saveEdit(group)"
                            @keydown.escape="editingGroupId = null"
                        />
                        <UButton
                            size="sm"
                            :loading="saving"
                            @click="saveEdit(group)"
                        >
                            Save
                        </UButton>
                        <UButton
                            size="sm"
                            color="neutral"
                            variant="ghost"
                            @click="editingGroupId = null"
                        >
                            Cancel
                        </UButton>
                    </template>
                    <template v-else>
                        <p class="flex-1 text-sm font-semibold text-gray-100">
                            {{ group.name }}
                        </p>
                        <span class="text-xs text-gray-600">
                            {{ (group.memberIds ?? []).length }}
                            member{{ (group.memberIds ?? []).length !== 1 ? 's' : '' }}
                        </span>
                        <UButton
                            size="xs"
                            color="neutral"
                            variant="ghost"
                            icon="i-heroicons-pencil"
                            @click="startEdit(group)"
                        />
                        <UButton
                            size="xs"
                            color="error"
                            variant="ghost"
                            icon="i-heroicons-trash"
                            @click="confirmDeleteId = group.id"
                        />
                    </template>
                </div>

                <!-- Members -->
                <div
                    v-if="(group.memberIds ?? []).length"
                    class="mt-2 flex flex-wrap gap-1.5"
                >
                    <div
                        v-for="memberId in group.memberIds"
                        :key="memberId"
                        class="flex items-center gap-1.5 rounded-full bg-gray-800 px-2.5 py-1"
                    >
                        <div class="size-5 overflow-hidden rounded-full bg-gray-700">
                            <img
                                v-if="characterMap.get(memberId)?.avatarUrl"
                                :src="characterMap.get(memberId)!.avatarUrl!"
                                :alt="characterMap.get(memberId)?.name"
                                class="size-full object-cover"
                            />
                            <UIcon
                                v-else
                                name="i-heroicons-user"
                                class="size-full p-0.5 text-gray-500"
                            />
                        </div>
                        <span class="text-xs text-gray-300">
                            {{ characterMap.get(memberId)?.name ?? 'Unknown' }}
                        </span>
                    </div>
                </div>
                <p
                    v-else
                    class="mt-2 text-xs text-gray-600"
                >
                    No members yet — assign characters in the character form
                </p>
            </li>
        </ul>

        <!-- Delete confirmation modal -->
        <UModal
            :open="!!confirmDeleteId"
            title="Delete Group"
            :ui="{ content: 'sm:max-w-sm' }"
            @update:open="(v) => !v && (confirmDeleteId = null)"
        >
            <template #body>
                <p class="text-sm text-gray-300">
                    Delete
                    <span class="font-medium text-gray-100">
                        {{ groups.find((g) => g.id === confirmDeleteId)?.name }}
                    </span>?
                    Characters will not be deleted.
                </p>
            </template>
            <template #footer>
                <div class="flex justify-end gap-2">
                    <UButton
                        color="neutral"
                        variant="ghost"
                        :disabled="deleting"
                        @click="confirmDeleteId = null"
                    >
                        Cancel
                    </UButton>
                    <UButton
                        color="error"
                        :loading="deleting"
                        @click="deleteGroup"
                    >
                        Delete
                    </UButton>
                </div>
            </template>
        </UModal>
    </div>
</template>
