<script setup lang="ts">
const props = defineProps<{
    open: boolean;
    shape?: 'round' | 'square' | 'rectangle';
    seats?: number;
}>();

const emit = defineEmits<{
    'update:open': [value: boolean];
    confirm: [config: { shape: 'round' | 'square' | 'rectangle'; seats: number }];
}>();

const selectedShape = ref<'round' | 'square' | 'rectangle'>(props.shape ?? 'round');
const selectedSeats = ref(props.seats ?? 4);

watch(
    () => props.open,
    (val) => {
        if (val) {
            selectedShape.value = props.shape ?? 'round';
            selectedSeats.value = props.seats ?? 4;
        }
    }
);

function previewDots(n: number, shape: 'round' | 'square' | 'rectangle') {
    if (shape === 'rectangle') {
        const top = Math.ceil(n / 2);
        const bot = n - top;
        const s = (k: number) => (k > 1 ? Math.min(22, 60 / (k - 1)) : 0);
        return [
            ...Array.from({ length: top }, (_, i) => ({ x: 50 + (i - (top - 1) / 2) * s(top), y: 20 })),
            ...Array.from({ length: bot }, (_, i) => ({ x: 50 + (i - (bot - 1) / 2) * s(bot), y: 80 })),
        ];
    }
    return Array.from({ length: n }, (_, i) => {
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
        return { x: 50 + 33 * Math.cos(angle), y: 50 + 33 * Math.sin(angle) };
    });
}

function confirm() {
    emit('confirm', { shape: selectedShape.value, seats: selectedSeats.value });
    emit('update:open', false);
}
</script>

<template>
    <UModal
        :open="open"
        title="Table Setup"
        :ui="{ content: 'sm:max-w-sm' }"
        @update:open="emit('update:open', $event)"
    >
        <template #body>
            <div class="space-y-6">
                <div class="space-y-2">
                    <p class="text-xs font-semibold tracking-widest text-gray-500 uppercase">
                        Table Shape
                    </p>
                    <div class="grid grid-cols-3 gap-3">
                        <button
                            v-for="shapeOption in (['round', 'square', 'rectangle'] as const)"
                            :key="shapeOption"
                            class="flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-colors"
                            :class="
                                selectedShape === shapeOption
                                    ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                                    : 'border-gray-700 text-gray-400 hover:border-gray-600'
                            "
                            @click="selectedShape = shapeOption"
                        >
                            <svg
                                viewBox="0 0 100 100"
                                class="size-16"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <circle
                                    v-if="shapeOption === 'round'"
                                    cx="50" cy="50" r="20"
                                    fill="#7B4F2E" stroke="#c08040" stroke-width="1.5"
                                />
                                <rect
                                    v-else-if="shapeOption === 'square'"
                                    x="28" y="28" width="44" height="44" rx="5"
                                    fill="#7B4F2E" stroke="#c08040" stroke-width="1.5"
                                />
                                <rect
                                    v-else
                                    x="18" y="34" width="64" height="32" rx="5"
                                    fill="#7B4F2E" stroke="#c08040" stroke-width="1.5"
                                />
                                <circle
                                    v-for="(dot, i) in previewDots(4, shapeOption)"
                                    :key="i"
                                    :cx="dot.x"
                                    :cy="dot.y"
                                    r="6"
                                    :fill="selectedShape === shapeOption ? '#818cf8' : '#4b5563'"
                                />
                            </svg>
                            <span class="text-sm font-semibold capitalize">{{ shapeOption }}</span>
                        </button>
                    </div>
                </div>

                <div class="space-y-2">
                    <p class="text-xs font-semibold tracking-widest text-gray-500 uppercase">
                        Number of Seats
                    </p>
                    <div class="grid grid-cols-7 gap-1.5">
                        <button
                            v-for="n in [2, 3, 4, 5, 6, 7, 8]"
                            :key="n"
                            class="flex items-center justify-center rounded-lg border-2 py-2.5 text-sm font-semibold transition-colors"
                            :class="
                                selectedSeats === n
                                    ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                                    : 'border-gray-700 text-gray-400 hover:border-gray-600'
                            "
                            @click="selectedSeats = n"
                        >
                            {{ n }}
                        </button>
                    </div>
                </div>
            </div>
        </template>

        <template #footer>
            <div class="flex justify-end gap-2">
                <UButton
                    color="neutral"
                    variant="ghost"
                    @click="emit('update:open', false)"
                >
                    Cancel
                </UButton>
                <UButton @click="confirm">Apply</UButton>
            </div>
        </template>
    </UModal>
</template>
