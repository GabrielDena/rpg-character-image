<script setup lang="ts">
import type { CharacterWithUrl } from '~/types/character';

const props = defineProps<{
    adventureId: string;
    systemId: string;
    activeCharacters: CharacterWithUrl[];
    activeIds: string[];
    hiddenIds: string[];
    loading: boolean;
    saving: boolean;
}>();

const emit = defineEmits<{
    update: [ids: string[]];
    updateHidden: [ids: string[]];
}>();

const showNpcModal = ref(false);
const showCharacterModal = ref(false);
const editingCharacter = ref<CharacterWithUrl | null>(null);

function toggleEditCharacter(character: CharacterWithUrl) {
    showCharacterModal.value = true;
    editingCharacter.value = character;
}

function isHidden(id: string) {
    return props.hiddenIds.includes(id);
}

function toggleHidden(id: string) {
    const next = isHidden(id)
        ? props.hiddenIds.filter((i) => i !== id)
        : [...props.hiddenIds, id];
    emit('updateHidden', next);
}

function soloCharacter(id: string) {
    const otherIds = props.activeIds.filter((i) => i !== id);
    emit('updateHidden', otherIds);
}

function removeCharacter(id: string) {
    emit('update', props.activeIds.filter((i) => i !== id));
    if (isHidden(id)) {
        emit('updateHidden', props.hiddenIds.filter((i) => i !== id));
    }
}
</script>

<template>
    <SessionCard
        title="Scene"
        class="w-full"
    >
        <template #action>
            <template v-if="activeCharacters.length">
                <UButton
                    size="xs"
                    label="Show All"
                    color="neutral"
                    variant="ghost"
                    icon="i-heroicons-eye"
                    @click="emit('updateHidden', [])"
                />
                <UButton
                    size="xs"
                    label="Hide All"
                    color="neutral"
                    variant="ghost"
                    icon="i-heroicons-eye-slash"
                    @click="emit('updateHidden', [...activeIds])"
                />
                <UButton
                    size="xs"
                    label="Clear"
                    color="error"
                    variant="ghost"
                    icon="i-heroicons-trash"
                    :loading="saving"
                    @click="emit('update', [])"
                />
            </template>
            <UButton
                size="xs"
                color="neutral"
                variant="ghost"
                icon="i-heroicons-plus"
                :loading="saving"
                @click="void (showNpcModal = true)"
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
            class="flex flex-col gap-1 p-2"
        >
            <li
                v-for="character in [...activeCharacters].sort((a, b) => a.name.localeCompare(b.name))"
                :key="character.id"
                class="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors"
                :class="isHidden(character.id) ? 'bg-gray-800/40 opacity-50' : 'bg-gray-800/20 hover:bg-gray-800/40'"
            >
                <!-- Avatar -->
                <button
                    class="size-7 shrink-0 overflow-hidden rounded-full bg-gray-800"
                    @click="toggleEditCharacter(character)"
                >
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
                </button>

                <!-- Name + type -->
                <button
                    class="min-w-0 flex-1 text-left"
                    @click="toggleEditCharacter(character)"
                >
                    <p class="truncate text-xs font-medium text-gray-200">{{ character.name }}</p>
                    <span
                        class="shrink-0 rounded px-1 py-0.5 text-[9px] tracking-wide uppercase"
                        :class="
                            character.type === 'pc'
                                ? 'bg-violet-500/15 text-violet-400'
                                : 'bg-gray-700/60 text-gray-500'
                        "
                    >
                        {{ character.type }}
                    </span>
                </button>

                <!-- Actions -->
                <div class="flex shrink-0 items-center gap-0.5">
                    <!-- Toggle visibility -->
                    <UTooltip :text="isHidden(character.id) ? 'Show' : 'Hide'">
                        <button
                            class="flex size-6 items-center justify-center rounded hover:bg-gray-700"
                            @click="toggleHidden(character.id)"
                        >
                            <UIcon
                                :name="isHidden(character.id) ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                                class="size-3.5 text-gray-400 hover:text-gray-200"
                            />
                        </button>
                    </UTooltip>

                    <!-- Solo (show only this one) -->
                    <UTooltip text="Show only this">
                        <button
                            class="flex size-6 items-center justify-center rounded hover:bg-gray-700"
                            @click="soloCharacter(character.id)"
                        >
                            <UIcon
                                name="i-heroicons-magnifying-glass"
                                class="size-3.5 text-gray-400 hover:text-gray-200"
                            />
                        </button>
                    </UTooltip>

                    <!-- Remove from scene -->
                    <UTooltip text="Remove from scene">
                        <button
                            class="flex size-6 items-center justify-center rounded hover:bg-gray-700"
                            @click="removeCharacter(character.id)"
                        >
                            <UIcon
                                name="i-heroicons-x-mark"
                                class="size-3.5 text-gray-500 hover:text-red-400"
                            />
                        </button>
                    </UTooltip>
                </div>
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
