<script setup lang="ts">
import type { CharacterWithUrl } from '~/types/character';

const props = defineProps<{
    adventureId: string;
    systemId: string;
    activeCharacters: CharacterWithUrl[];
    activeIds: string[];
    loading: boolean;
    saving: boolean;
}>();

const emit = defineEmits<{
    update: [ids: string[]];
}>();

const showNpcModal = ref(false);
const showCharacterModal = ref(false);
const editingCharacter = ref<CharacterWithUrl | null>(null);

function toggleEditCharacter(character: CharacterWithUrl) {
    showCharacterModal.value = true;
    editingCharacter.value = character;
}
</script>

<template>
    <SessionCard
        title="Scene"
        class="w-full"
    >
        <template #action>
            <UButton
                size="xs"
                color="neutral"
                variant="ghost"
                icon="i-heroicons-plus"
                :loading="saving"
                @click="showNpcModal = true"
            />
        </template>

        <div
            v-if="loading"
            class="space-y-1 p-2"
        >
            <USkeleton
                v-for="n in 3"
                :key="n"
                class="h-10 w-full rounded-lg"
            />
        </div>

        <div
            v-else-if="!activeCharacters.length"
            class="flex flex-col items-center gap-1.5 px-4 py-6 text-center"
        >
            <UIcon
                name="i-heroicons-sparkles"
                class="size-6 text-gray-700"
            />
            <p class="text-xs text-gray-600">No characters in scene</p>
        </div>

        <ul
            v-else
            class="flex flex-wrap gap-2 p-2"
        >
            <li
                v-for="character in activeCharacters"
                :key="character.id"
            >
                <SessionCard
                    :title="character.name"
                    class="w-30"
                >
                    <template #action>
                        <button
                            @click="
                                emit(
                                    'update',
                                    activeIds.filter((i) => i !== character.id)
                                )
                            "
                        >
                            <UIcon
                                name="i-heroicons-x-mark"
                                class="size-3.5 text-gray-500 hover:text-red-400"
                            />
                        </button>
                    </template>
                    <button
                        class="flex w-full flex-col items-center justify-center gap-2 p-2 hover:bg-gray-800"
                        @click="toggleEditCharacter(character)"
                    >
                        <div class="size-7 shrink-0 overflow-hidden rounded-full bg-gray-800">
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
                                    class="size-3.5 text-gray-500"
                                />
                            </div>
                        </div>
                        <span
                            class="shrink-0 rounded px-1 py-0.5 text-[10px] tracking-wide uppercase"
                            :class="
                                character.type === 'pc'
                                    ? 'bg-violet-500/15 text-violet-400'
                                    : 'bg-gray-700/60 text-gray-500'
                            "
                        >
                            {{ character.type }}
                        </span>
                    </button>
                </SessionCard>
            </li>
        </ul>
        <NpcPickerModal
            v-model:open="showNpcModal"
            :adventure-id="adventureId"
            :active-ids="activeIds"
            @confirm="emit('update', $event)"
        />
        <CharacterCreateModal
            v-model:open="showCharacterModal"
            :adventure-id="adventureId"
            :system-id="systemId"
            :character="editingCharacter"
        />
    </SessionCard>
</template>

