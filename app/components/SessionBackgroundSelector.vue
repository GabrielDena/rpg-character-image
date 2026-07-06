<script lang="ts" setup>
import type { Location } from '#shared/types/models';
import type { BackgroundWithUrl } from '~/types/background';
const show = defineModel();

const props = defineProps<{
    backgrounds: BackgroundWithUrl[];
    locations: Location[];
    selectedBackground: BackgroundWithUrl | null;
    savingBackground: boolean;
    loading: boolean;
    useAltBackground: boolean;
}>();

const emit = defineEmits<{
    select: [id: string | null];
    toggleAlt: [];
}>();

const bgSelectorOpen = ref<boolean>(false);
</script>

<template>
    <SessionCard
        title="Background"
        class="overflow-hidden"
    >
        <template #action>
            <UButton
                v-if="selectedBackground?.altUrl"
                size="xs"
                color="neutral"
                variant="ghost"
                :icon="useAltBackground ? 'i-heroicons-moon' : 'i-heroicons-sun'"
                @click="emit('toggleAlt')"
            />
            <UButton
                size="xs"
                color="neutral"
                variant="ghost"
                :icon="show ? 'i-heroicons-eye' : 'i-heroicons-eye-slash'"
                @click="void (show = !show)"
            />
            <UButton
                size="sm"
                variant="outline"
                label="Clear"
                :disabled="savingBackground"
                @click="emit('select', null)"
            />
        </template>
        <button
            v-if="show"
            class="h-full w-full border-gray-800 transition-colors"
            :class="savingBackground ? 'opacity-50' : 'hover:bg-gray-800'"
            :disabled="savingBackground"
            @click="void (bgSelectorOpen = true)"
        >
            <div
                v-if="!selectedBackground"
                class="flex w-full items-center justify-center gap-2 p-2"
            >
                <UIcon
                    name="i-heroicons-squares-2x2"
                    class="size-12 text-gray-700"
                />
                <div class="text-center">
                    <p class="text-sm font-medium text-gray-400">No background selected</p>
                    <p class="mt-1 text-xs text-gray-600">Select background clicking here here</p>
                </div>
            </div>
            <div
                v-else
                class="flex items-center justify-between pr-3"
            >
                <div class="flex items-center gap-4 p-2">
                    <img
                        v-if="selectedBackground.url"
                        :src="selectedBackground.url"
                        :alt="selectedBackground.name"
                        class="size-16 object-cover"
                    />
                    <span class="text-sm">
                        {{ selectedBackground.name }}
                    </span>
                </div>
                <UIcon
                    name="i-heroicons-chevron-right"
                    class="size-5 text-gray-700"
                />
            </div>
        </button>
        <BackgroundPickerModal
            v-model:open="bgSelectorOpen"
            :all-backgrounds="backgrounds"
            :locations="locations"
            @confirm="emit('select', $event)"
        />
    </SessionCard>
</template>

