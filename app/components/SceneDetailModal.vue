<script setup lang="ts">
import type { CharacterWithUrl } from '~/types/character';
import type { BackgroundWithUrl } from '~/types/background';
import type { SavedScene } from '~/types/scene';

const props = defineProps<{
    open: boolean;
    scene: SavedScene;
    allCharacters: CharacterWithUrl[];
    allBackgrounds: BackgroundWithUrl[];
}>();

const emit = defineEmits<{
    'update:open': [value: boolean];
    save: [scene: SavedScene];
    delete: [id: string];
    apply: [scene: SavedScene];
}>();

const sceneName = ref(props.scene.name);

watch(
    () => props.open,
    (val) => {
        if (val) sceneName.value = props.scene.name;
    }
);

const sceneCharacters = computed(() =>
    props.allCharacters.filter((c) => props.scene.characterIds.includes(c.id))
);

const sceneBackground = computed(
    () => props.allBackgrounds.find((b) => b.id === props.scene.backgroundId) ?? null
);

function save() {
    emit('save', { ...props.scene, name: sceneName.value });
    emit('update:open', false);
}

function apply() {
    emit('apply', { ...props.scene, name: sceneName.value });
    emit('update:open', false);
}

function deleteScene() {
    emit('delete', props.scene.id);
    emit('update:open', false);
}
</script>

<template>
    <UModal
        :open="open"
        :ui="{ content: 'sm:max-w-md' }"
        @update:open="emit('update:open', $event)"
    >
        <template #title>
            <input
                v-model="sceneName"
                class="w-full bg-transparent font-semibold text-gray-100 outline-none placeholder:text-gray-500"
                placeholder="Scene name"
            />
        </template>

        <template #body>
            <div class="space-y-4">
                <div class="space-y-2">
                    <p class="text-xs font-semibold tracking-widest text-gray-500 uppercase">
                        Characters
                    </p>
                    <div
                        v-if="sceneCharacters.length"
                        class="flex flex-wrap gap-2"
                    >
                        <div
                            v-for="character in sceneCharacters"
                            :key="character.id"
                            class="flex items-center gap-1.5 rounded-lg bg-gray-800 px-2 py-1"
                        >
                            <div class="size-5 shrink-0 overflow-hidden rounded-full bg-gray-700">
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
                                        class="size-3 text-gray-500"
                                    />
                                </div>
                            </div>
                            <span class="text-xs text-gray-300">{{ character.name }}</span>
                        </div>
                    </div>
                    <p
                        v-else
                        class="text-xs text-gray-500"
                    >
                        No characters
                    </p>
                </div>

                <div class="space-y-2">
                    <p class="text-xs font-semibold tracking-widest text-gray-500 uppercase">
                        Background
                    </p>
                    <p class="text-sm text-gray-300">
                        {{ sceneBackground?.name ?? 'None' }}
                    </p>
                </div>

                <div class="space-y-2">
                    <p class="text-xs font-semibold tracking-widest text-gray-500 uppercase">
                        Mode
                    </p>
                    <p class="text-sm capitalize text-gray-300">
                        <template v-if="scene.displayMode === 'table'">
                            Table &mdash; {{ scene.tableShape }}, {{ scene.tableSeats }} seats
                        </template>
                        <template v-else>Scene</template>
                    </p>
                </div>
            </div>
        </template>

        <template #footer>
            <div class="flex w-full items-center justify-between">
                <UButton
                    color="error"
                    variant="ghost"
                    icon="i-heroicons-trash"
                    @click="deleteScene"
                >
                    Delete
                </UButton>
                <div class="flex gap-2">
                    <UButton
                        color="neutral"
                        variant="ghost"
                        @click="emit('update:open', false)"
                    >
                        Cancel
                    </UButton>
                    <UButton
                        color="neutral"
                        variant="outline"
                        @click="save"
                    >
                        Save
                    </UButton>
                    <UButton @click="apply">Apply</UButton>
                </div>
            </div>
        </template>
    </UModal>
</template>
