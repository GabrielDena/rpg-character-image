<script setup lang="ts">
import type { CharacterWithUrl } from '~/types/character';

defineProps<{
    characters: CharacterWithUrl[];
    activeIds: string[];
    loading: boolean;
}>();

const emit = defineEmits<{
    toggle: [id: string];
}>();
</script>

<template>
    <SessionCard title="Players">
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
            v-else-if="!characters.length"
            class="flex flex-col items-center gap-1.5 px-4 py-6 text-center"
        >
            <UIcon
                name="i-heroicons-user-group"
                class="size-6 text-gray-700"
            />
            <p class="text-xs text-gray-600">No PCs yet</p>
        </div>

        <ul v-else>
            <li
                v-for="character in characters"
                :key="character.id"
            >
                <button
                    class="flex w-full items-center gap-2.5 px-3 py-2.5 transition-colors hover:bg-gray-800 active:bg-gray-700"
                    :class="activeIds.includes(character.id) ? 'opacity-50' : ''"
                    @click="emit('toggle', character.id)"
                >
                    <div class="relative size-7 shrink-0 overflow-hidden rounded-full bg-gray-800">
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
                        <div
                            v-if="activeIds.includes(character.id)"
                            class="absolute inset-0 flex items-center justify-center rounded-full bg-violet-500/60"
                        >
                            <UIcon
                                name="i-heroicons-check"
                                class="size-3 text-white"
                            />
                        </div>
                    </div>
                    <p class="min-w-0 flex-1 truncate text-left text-xs font-medium text-gray-200">
                        {{ character.name }}
                    </p>
                    <UIcon
                        v-if="!activeIds.includes(character.id)"
                        name="i-heroicons-plus"
                        class="size-3.5 shrink-0 text-gray-600"
                    />
                </button>
                <div class="mx-3 border-b border-gray-800/60" />
            </li>
        </ul>
    </SessionCard>
</template>

