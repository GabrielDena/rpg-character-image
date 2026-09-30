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
    showTrackingCards: boolean;
    savingShowTrackingCards: boolean;
    trackingCardsScale: number;
    savingTrackingCardsScale: boolean;
}>();

const emit = defineEmits<{
    toggleFitMode: [];
    setScene: [];
    setTable: [config: { shape: 'round' | 'square' | 'rectangle'; seats: number; sideSeats: number }];
    toggleShowCharacters: [];
    toggleShowItems: [];
    toggleShowTrackingCards: [];
    increaseTrackingCardsScale: [];
    decreaseTrackingCardsScale: [];
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
            class="grid grid-cols-2 gap-1 p-2"
        >
            <!-- Row 1: visibility toggles -->
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
                :icon="props.showTrackingCards ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                :label="props.showTrackingCards ? 'Hide Cards' : 'Show Cards'"
                :loading="props.savingShowTrackingCards"
                class="w-full justify-start"
                @click="emit('toggleShowTrackingCards')"
            />

            <!-- Row 1b: tracking cards size -->
            <UButton
                size="sm"
                color="neutral"
                variant="ghost"
                icon="i-heroicons-minus"
                label="Cards -"
                :loading="props.savingTrackingCardsScale"
                :disabled="props.trackingCardsScale <= 1"
                class="w-full justify-start"
                @click="emit('decreaseTrackingCardsScale')"
            />
            <UButton
                size="sm"
                color="neutral"
                variant="ghost"
                icon="i-heroicons-plus"
                label="Cards +"
                :loading="props.savingTrackingCardsScale"
                :disabled="props.trackingCardsScale >= 5"
                class="w-full justify-start"
                @click="emit('increaseTrackingCardsScale')"
            />

            <!-- Row 2: fit mode + display mode -->
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

