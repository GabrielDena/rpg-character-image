<script setup lang="ts">
defineOptions({ inheritAttrs: false });

const show = defineModel();

const props = defineProps<{
    galleryFitMode: 'cover' | 'contain';
    savingFitMode: boolean;
    displayMode: 'scene' | 'table';
    tableShape: 'round' | 'square' | 'rectangle';
    tableSeats: number;
    tableSideSeats: number;
    savingTableConfig: boolean;
    showCharacters: boolean;
    savingShowCharacters: boolean;
    showItems: boolean;
    savingShowItems: boolean;
}>();

const emit = defineEmits<{
    toggleFitMode: [];
    setScene: [];
    setTable: [config: { shape: 'round' | 'square' | 'rectangle'; seats: number; sideSeats: number }];
    toggleShowCharacters: [];
    toggleShowItems: [];
}>();

const showTableModal = ref(false);

function toggleShow() {
    show.value = !show.value;
}

function openTableModal() {
    showTableModal.value = true;
}

function onTableConfirm(config: { shape: 'round' | 'square' | 'rectangle'; seats: number; sideSeats: number }) {
    emit('setTable', config);
}
</script>

<template>
    <SessionCard
        title="Display"
        v-bind="$attrs"
    >
        <template #action>
            <UButton
                size="xs"
                color="neutral"
                variant="ghost"
                :icon="show ? 'i-heroicons-eye' : 'i-heroicons-eye-slash'"
                @click="toggleShow"
            />
        </template>
        <div
            v-if="show"
            class="flex flex-col gap-1 p-2"
        >
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
                :icon="props.showItems ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                :label="props.showItems ? 'Hide Items' : 'Show Items'"
                :loading="props.savingShowItems"
                class="w-full justify-start"
                @click="emit('toggleShowItems')"
            />
            <UButton
                size="sm"
                color="neutral"
                variant="ghost"
                :icon="
                    props.galleryFitMode === 'cover'
                        ? 'i-heroicons-arrows-pointing-out'
                        : 'i-heroicons-arrows-pointing-in'
                "
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
                @click="openTableModal"
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
                    @click="openTableModal"
                />
            </template>
        </div>
    </SessionCard>

    <TableConfigModal
        :open="showTableModal"
        :shape="props.tableShape"
        :seats="props.tableSeats"
        :side-seats="props.tableSideSeats"
        @update:open="(val) => { showTableModal = val }"
        @confirm="onTableConfirm"
    />
</template>

