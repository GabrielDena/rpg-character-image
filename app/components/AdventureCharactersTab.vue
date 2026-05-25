<script setup lang="ts">
import type { CharacterWithUrl } from '~/types/character';

const props = defineProps<{
    adventureId: string;
    systemId: string;
}>();

const toast = useToast();

const list = ref<CharacterWithUrl[]>([]);
const loading = ref(false);
const showModal = ref(false);
const editingCharacter = ref<CharacterWithUrl | null>(null);
const search = ref('');
const sort = ref<'name-asc' | 'name-desc' | 'pc' | 'npc'>('name-asc');

const sortOptions = [
    { value: 'name-asc' as const, label: 'Name A→Z' },
    { value: 'name-desc' as const, label: 'Name Z→A' },
    { value: 'pc' as const, label: 'PC only' },
    { value: 'npc' as const, label: 'NPC only' },
];

const filtered = computed(() => {
    const q = search.value.trim().toLowerCase();
    let result = list.value;
    if (q)
        result = result.filter(
            (c) => c.name.toLowerCase().includes(q) || (c.playbook ?? '').toLowerCase().includes(q)
        );
    if (sort.value === 'pc') result = result.filter((c) => c.type === 'pc');
    else if (sort.value === 'npc') result = result.filter((c) => c.type === 'npc');
    const sorted = [...result].sort((a, b) => a.name.localeCompare(b.name));
    return sort.value === 'name-desc' ? sorted.reverse() : sorted;
});

const hasActiveFilter = computed(
    () => !!search.value || sort.value === 'pc' || sort.value === 'npc'
);

async function fetchCharacters() {
    loading.value = true;
    try {
        const { characters } = await $fetch<{ characters: CharacterWithUrl[] }>('/api/characters', {
            query: { adventureId: props.adventureId },
        });
        list.value = characters;
    } catch (e: unknown) {
        toast.add({
            title: 'Failed to load characters',
            color: 'error',
            description: e instanceof Error ? e.message : 'Unknown error',
        });
    } finally {
        loading.value = false;
    }
}

function openCreateModal() {
    editingCharacter.value = null;
    showModal.value = true;
}

function openEditModal(character: CharacterWithUrl) {
    editingCharacter.value = character;
    showModal.value = true;
}

onMounted(fetchCharacters);
</script>

<template>
    <div>
        <div class="sticky top-0 z-10 space-y-2 bg-gray-900 p-4 pb-2">
            <div class="flex items-center justify-between">
                <p class="text-xs text-gray-500">
                    {{ filtered.length }} character{{ filtered.length !== 1 ? 's' : '' }}
                </p>
                <UButton
                    size="sm"
                    leading-icon="i-heroicons-plus"
                    @click="openCreateModal"
                >
                    New Character
                </UButton>
            </div>
            <div class="flex gap-2">
                <UInput
                    v-model="search"
                    placeholder="Search…"
                    leading-icon="i-heroicons-magnifying-glass"
                    size="sm"
                    class="flex-1"
                />
                <USelect
                    v-model="sort"
                    :items="sortOptions"
                    size="sm"
                    class="w-34 shrink-0"
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
                class="h-14 w-full rounded-xl"
            />
        </div>

        <div
            v-else-if="!list.length"
            class="flex flex-col items-center justify-center gap-4 px-6 py-20"
        >
            <UIcon
                name="i-heroicons-user-group"
                class="size-12 text-gray-700"
            />
            <div class="text-center">
                <p class="text-sm font-medium text-gray-400">No characters yet</p>
                <p class="mt-1 text-xs text-gray-600">Add characters to this adventure</p>
            </div>
            <UButton
                leading-icon="i-heroicons-plus"
                @click="openCreateModal"
            >
                New Character
            </UButton>
        </div>

        <p
            v-else-if="hasActiveFilter && !filtered.length"
            class="px-4 py-8 text-center text-sm text-gray-500"
        >
            No characters match the current filter
        </p>

        <ul
            v-else
            class="space-y-0.5 p-2"
        >
            <li
                v-for="character in filtered"
                :key="character.id"
            >
                <button
                    class="flex w-full items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-gray-800 active:bg-gray-700"
                    @click="openEditModal(character)"
                >
                    <div class="size-8 shrink-0 overflow-hidden rounded-full bg-gray-800">
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
                                class="size-4 text-gray-500"
                            />
                        </div>
                    </div>
                    <div class="min-w-0 flex-1 text-left">
                        <p class="truncate text-sm font-medium text-gray-100">
                            {{ character.name }}
                        </p>
                        <div class="mt-0.5 flex items-center gap-1.5">
                            <span
                                class="rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase"
                                :class="
                                    character.type === 'pc'
                                        ? 'bg-violet-500/20 text-violet-300'
                                        : 'bg-gray-700 text-gray-400'
                                "
                            >
                                {{ character.type }}
                            </span>
                            <span
                                v-if="character.playbook"
                                class="truncate text-xs text-gray-500"
                            >
                                {{ character.playbook }}
                            </span>
                        </div>
                    </div>
                    <UIcon
                        name="i-heroicons-pencil"
                        class="size-4 shrink-0 text-gray-600"
                    />
                </button>
            </li>
        </ul>

        <CharacterCreateModal
            v-model:open="showModal"
            :adventure-id="adventureId"
            :system-id="systemId"
            :character="editingCharacter"
            @created="fetchCharacters"
            @updated="fetchCharacters"
        />
    </div>
</template>

