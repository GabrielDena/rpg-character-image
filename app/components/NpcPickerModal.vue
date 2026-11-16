<script setup lang="ts">
import type { CharacterGroup } from '#shared/types/models';
import type { CharacterWithUrl } from '~/types/character';

const props = defineProps<{
    open: boolean;
    adventureId: string;
    activeIds: string[];
}>();

const emit = defineEmits<{
    'update:open': [value: boolean];
    confirm: [ids: string[]];
}>();

const search = ref('');
const allCharacters = ref<CharacterWithUrl[]>([]);
const groups = ref<CharacterGroup[]>([]);
const loading = ref(false);
const selected = ref<Set<string>>(new Set());

const npcIds = computed(() => new Set(allCharacters.value.map((c) => c.id)));

const npcGroups = computed(() =>
    groups.value.filter((g) => (g.memberIds ?? []).some((id) => npcIds.value.has(id)))
);

const filtered = computed(() => {
    const q = search.value.trim().toLowerCase();
    if (!q) return allCharacters.value;
    return allCharacters.value.filter(
        (c) => c.name.toLowerCase().includes(q) || (c.playbook ?? '').toLowerCase().includes(q)
    );
});

async function fetchCharacters() {
    loading.value = true;
    try {
        const [{ characters }, { groups: groupRows }] = await Promise.all([
            $fetch<{ characters: CharacterWithUrl[] }>('/api/characters', {
                query: { adventureId: props.adventureId },
            }),
            $fetch<{ groups: CharacterGroup[] }>('/api/character-groups', {
                query: { adventureId: props.adventureId },
            }),
        ]);
        allCharacters.value = characters
            .filter((c) => c.type === 'npc')
            .sort((a, b) => a.name.localeCompare(b.name));
        groups.value = groupRows;
    } catch {
        // non-fatal
    } finally {
        loading.value = false;
    }
}

watch(
    () => props.open,
    (val) => {
        if (val) {
            search.value = '';
            selected.value = new Set(props.activeIds);
            fetchCharacters();
        }
    }
);

function toggle(id: string) {
    const next = new Set(selected.value);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    selected.value = next;
}

function selectGroup(group: CharacterGroup) {
    const groupNpcIds = (group.memberIds ?? []).filter((id) => npcIds.value.has(id));
    const allSelected = groupNpcIds.every((id) => selected.value.has(id));
    const next = new Set(selected.value);
    if (allSelected) {
        groupNpcIds.forEach((id) => next.delete(id));
    } else {
        groupNpcIds.forEach((id) => next.add(id));
    }
    selected.value = next;
}

function isGroupSelected(group: CharacterGroup) {
    const groupNpcIds = (group.memberIds ?? []).filter((id) => npcIds.value.has(id));
    return groupNpcIds.length > 0 && groupNpcIds.every((id) => selected.value.has(id));
}

function isGroupPartial(group: CharacterGroup) {
    const groupNpcIds = (group.memberIds ?? []).filter((id) => npcIds.value.has(id));
    return groupNpcIds.some((id) => selected.value.has(id)) && !isGroupSelected(group);
}

function confirm() {
    emit('confirm', [...selected.value]);
    emit('update:open', false);
}
</script>

<template>
    <UModal
        :open="open"
        title="Add NPC to Scene"
        :ui="{ content: 'sm:max-w-200' }"
        :content="{ onOpenAutoFocus: (e: Event) => e.preventDefault() }"
        @update:open="emit('update:open', $event)"
    >
        <template #body>
            <div class="space-y-3">
                <!-- Group quick-select -->
                <div
                    v-if="npcGroups.length"
                    class="flex flex-wrap gap-1.5"
                >
                    <button
                        v-for="group in npcGroups"
                        :key="group.id"
                        class="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors"
                        :class="
                            isGroupSelected(group)
                                ? 'border-violet-500 bg-violet-500/20 text-violet-300'
                                : isGroupPartial(group)
                                  ? 'border-violet-500/40 bg-violet-500/10 text-violet-400'
                                  : 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300'
                        "
                        @click="selectGroup(group)"
                    >
                        <UIcon
                            name="i-heroicons-tag"
                            class="size-3"
                        />
                        {{ group.name }}
                    </button>
                </div>

                <UInput
                    v-model="search"
                    placeholder="Search NPCs…"
                    leading-icon="i-heroicons-magnifying-glass"
                />

                <div
                    v-if="loading"
                    class="space-y-1"
                >
                    <USkeleton
                        v-for="n in 4"
                        :key="n"
                        class="h-12 w-full rounded-xl"
                    />
                </div>

                <div
                    v-else-if="!allCharacters.length"
                    class="py-8 text-center text-sm text-gray-500"
                >
                    No NPCs in this adventure yet
                </div>

                <p
                    v-else-if="filtered.length === 0"
                    class="py-6 text-center text-sm text-gray-500"
                >
                    No NPCs match your search
                </p>

                <ul
                    v-else
                    class="grid max-h-72 grid-cols-5 space-y-0.5 overflow-y-auto"
                >
                    <li
                        v-for="character in filtered"
                        :key="character.id"
                    >
                        <button
                            class="relative flex w-full flex-col items-center gap-3 rounded-xl px-3 py-2.5 transition-colors"
                            :class="
                                selected.has(character.id)
                                    ? 'bg-violet-500/15 ring-1 ring-violet-500/40'
                                    : 'hover:bg-gray-800'
                            "
                            @click="toggle(character.id)"
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
                                <p
                                    v-if="character.playbook"
                                    class="truncate text-xs text-gray-500"
                                >
                                    {{ character.playbook }}
                                </p>
                            </div>
                            <UIcon
                                v-if="selected.has(character.id)"
                                name="i-heroicons-check-circle-solid"
                                class="absolute top-2 right-2 size-5 shrink-0 text-violet-400"
                            />
                        </button>
                    </li>
                </ul>
            </div>
        </template>

        <template #footer>
            <div class="flex items-center justify-between">
                <p class="text-xs text-gray-500">{{ selected.size }} selected</p>
                <div class="flex gap-2">
                    <UButton
                        color="neutral"
                        variant="ghost"
                        @click="emit('update:open', false)"
                    >
                        Cancel
                    </UButton>
                    <UButton @click="confirm"> Update Scene </UButton>
                </div>
            </div>
        </template>
    </UModal>
</template>

