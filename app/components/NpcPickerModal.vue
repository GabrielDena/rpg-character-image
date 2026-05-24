<script setup lang="ts">
import type { CharacterWithUrl } from '~/components/CharacterCreateModal.vue';

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
const loading = ref(false);
const selected = ref<Set<string>>(new Set());

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
        const { characters } = await $fetch<{ characters: CharacterWithUrl[] }>('/api/characters', {
            query: { adventureId: props.adventureId },
        });
        allCharacters.value = characters.filter((c) => c.type === 'npc');
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

function confirm() {
    emit('confirm', [...selected.value]);
    emit('update:open', false);
}
</script>

<template>
    <UModal
        :open="open"
        title="Add NPC to Scene"
        :ui="{ content: 'sm:max-w-md' }"
        @update:open="emit('update:open', $event)"
    >
        <template #body>
            <div class="space-y-3">
                <UInput
                    v-model="search"
                    placeholder="Search NPCs…"
                    leading-icon="i-heroicons-magnifying-glass"
                    autofocus
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
                    class="max-h-72 space-y-0.5 overflow-y-auto"
                >
                    <li
                        v-for="character in filtered"
                        :key="character.id"
                    >
                        <button
                            class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-colors"
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
                                class="size-5 shrink-0 text-violet-400"
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

