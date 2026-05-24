<script lang="ts" setup>
import type { BackgroundWithUrl } from './AdventureBackgroundsTab.vue';

const props = defineProps<{
    backgrounds: BackgroundWithUrl[];
    selectedBackground: BackgroundWithUrl | null;
    loading: boolean;
}>();

const emit = defineEmits<{
    select: [id: string];
    clear: [];
}>();

const bgSelectorOpen = ref<boolean>(false);
</script>

<template>
    <SessionCard
        title="Background"
        class="overflow-hidden"
    >
        <button
            v-if="!selectedBackground"
            class="flex w-full items-center justify-center gap-2 border-gray-800 px-3 py-2 transition-colors hover:bg-gray-800"
            @click="bgSelectorOpen = true"
        >
            <UIcon
                name="i-heroicons-squares-2x2"
                class="size-12 text-gray-700"
            />
            <div class="text-center">
                <p class="text-sm font-medium text-gray-400">No background selected</p>
                <p class="mt-1 text-xs text-gray-600">Select background clicking here here</p>
            </div>
        </button>
    </SessionCard>

    <BackgroundPickerModal
        v-model:open="bgSelectorOpen"
        :all-backgrounds="backgrounds"
        @confirm="emit('select', $event)"
    />
</template>

