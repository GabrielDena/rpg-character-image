<script setup lang="ts">
const props = defineProps<{
    galleryFitMode: 'cover' | 'contain';
    savingFitMode: boolean;
    displayMode: 'scene' | 'table';
    tableShape: 'round' | 'square' | 'rectangle';
    tableSeats: number;
    savingTableConfig: boolean;
    showCharacters: boolean;
    savingShowCharacters: boolean;
}>();

const emit = defineEmits<{
    toggleFitMode: [];
    setScene: [];
    setTable: [config: { shape: 'round' | 'square' | 'rectangle'; seats: number }];
    toggleShowCharacters: [];
}>();

const showTableModal = ref(false);

function onTableConfirm(config: { shape: 'round' | 'square' | 'rectangle'; seats: number }) {
    emit('setTable', config);
}
</script>

<template>
    <SessionCard title="Display" class="w-36 shrink-0">
        <div class="flex flex-col gap-1 p-2">
            <UButton
                size="sm"
                color="neutral"
                variant="ghost"
                :icon="props.showCharacters ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                :label="props.showCharacters ? 'Hide Chars' : 'Show Chars'"
                :loading="props.savingShowCharacters"
                class="w-full justify-start"
                @click="emit('toggleShowCharacters')"
            />
            <UButton
                size="sm"
                color="neutral"
                variant="ghost"
                :icon="props.galleryFitMode === 'cover' ? 'i-heroicons-arrows-pointing-out' : 'i-heroicons-arrows-pointing-in'"
                :label="props.galleryFitMode === 'cover' ? 'Show Full' : 'Zoom Fill'"
                :loading="props.savingFitMode"
                class="w-full justify-start"
                @click="emit('toggleFitMode')"
            />
            <UButton
                v-if="props.displayMode === 'scene'"
                size="sm"
                color="neutral"
                variant="ghost"
                icon="i-heroicons-table-cells"
                label="Table"
                :loading="props.savingTableConfig"
                class="w-full justify-start"
                @click="showTableModal = true"
            />
            <template v-else>
                <UButton
                    size="sm"
                    color="neutral"
                    variant="ghost"
                    icon="i-heroicons-photo"
                    label="Scene"
                    :loading="props.savingTableConfig"
                    class="w-full justify-start"
                    @click="emit('setScene')"
                />
                <UButton
                    size="sm"
                    color="neutral"
                    variant="ghost"
                    icon="i-heroicons-cog-6-tooth"
                    label="Configure"
                    class="w-full justify-start"
                    @click="showTableModal = true"
                />
            </template>
        </div>
    </SessionCard>

    <TableConfigModal
        :open="showTableModal"
        :shape="props.tableShape"
        :seats="props.tableSeats"
        @update:open="showTableModal = $event"
        @confirm="onTableConfirm"
    />
</template>
