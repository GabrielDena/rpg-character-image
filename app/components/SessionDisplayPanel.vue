<script setup lang="ts">
defineProps<{
    galleryFitMode: 'cover' | 'contain';
    savingFitMode: boolean;
}>();

const emit = defineEmits<{
    toggleFitMode: [];
}>();
</script>

<template>
    <SessionCard title="Display" class="w-36 shrink-0">
        <div class="flex flex-col gap-1 p-2">
            <UButton
                size="sm"
                color="neutral"
                variant="ghost"
                :icon="galleryFitMode === 'cover' ? 'i-heroicons-arrows-pointing-out' : 'i-heroicons-arrows-pointing-in'"
                :label="galleryFitMode === 'cover' ? 'Show Full' : 'Zoom Fill'"
                :loading="savingFitMode"
                class="w-full justify-start"
                @click="emit('toggleFitMode')"
            />
        </div>
    </SessionCard>
</template>
