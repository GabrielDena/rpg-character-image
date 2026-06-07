<script setup lang="ts">
const PREDEFINED = [2, 3, 4, 5, 6, 7, 8] as const;

const props = defineProps<{
    open: boolean;
    shape?: 'round' | 'square' | 'rectangle';
    seats?: number;
    sideSeats?: number;
}>();

const emit = defineEmits<{
    'update:open': [value: boolean];
    confirm: [config: { shape: 'round' | 'square' | 'rectangle'; seats: number; sideSeats: number }];
}>();

const selectedShape = ref<'round' | 'square' | 'rectangle'>(props.shape ?? 'round');
const selectedSeats = ref(props.seats ?? 4);
const isCustom = ref(false);
const customSeats = ref(10);
const customSideSeats = ref(0);

watch(
    () => props.open,
    (val) => {
        if (val) {
            selectedShape.value = props.shape ?? 'round';
            const side = props.sideSeats ?? 0;
            const s = props.seats ?? 4;
            if (side > 0 || !(PREDEFINED as readonly number[]).includes(s)) {
                isCustom.value = true;
                customSeats.value = s;
                customSideSeats.value = side;
            } else {
                isCustom.value = false;
                selectedSeats.value = s;
                customSeats.value = s;
                customSideSeats.value = 0;
            }
        }
    }
);

function previewDots(n: number, shape: 'round' | 'square' | 'rectangle', side = 0) {
    if (shape === 'rectangle') {
        const longCount = Math.max(0, n - 2 * side);
        const top = Math.ceil(longCount / 2);
        const bot = longCount - top;
        const s = (k: number) => (k > 1 ? Math.min(22, 60 / (k - 1)) : 0);
        const ss = (k: number) => (k > 1 ? Math.min(14, 28 / (k - 1)) : 0);
        return [
            ...Array.from({ length: top }, (_, i) => ({ x: 50 + (i - (top - 1) / 2) * s(top), y: 20 })),
            ...Array.from({ length: bot }, (_, i) => ({ x: 50 + (i - (bot - 1) / 2) * s(bot), y: 80 })),
            ...Array.from({ length: side }, (_, i) => ({ x: 13, y: 50 + (i - (side - 1) / 2) * ss(side) })),
            ...Array.from({ length: side }, (_, i) => ({ x: 87, y: 50 + (i - (side - 1) / 2) * ss(side) })),
        ];
    }
    return Array.from({ length: n }, (_, i) => {
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
        return { x: 50 + 33 * Math.cos(angle), y: 50 + 33 * Math.sin(angle) };
    });
}

function confirm() {
    const seats = isCustom.value ? customSeats.value : selectedSeats.value;
    const sideSeats =
        isCustom.value && selectedShape.value === 'rectangle' ? customSideSeats.value : 0;
    emit('confirm', { shape: selectedShape.value, seats, sideSeats });
    emit('update:open', false);
}
</script>

<template>
    <UModal
        :open="open"
        title="Table Setup"
        :ui="{ content: 'sm:max-w-sm' }"
        :content="{ onOpenAutoFocus: (e: Event) => e.preventDefault() }"
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
                                    cx="50"
                                    cy="50"
                                    r="20"
                                    fill="#7B4F2E"
                                    stroke="#c08040"
                                    stroke-width="1.5"
                                />
                                <rect
                                    v-else-if="shapeOption === 'square'"
                                    x="28"
                                    y="28"
                                    width="44"
                                    height="44"
                                    rx="5"
                                    fill="#7B4F2E"
                                    stroke="#c08040"
                                    stroke-width="1.5"
                                />
                                <rect
                                    v-else
                                    x="18"
                                    y="34"
                                    width="64"
                                    height="32"
                                    rx="5"
                                    fill="#7B4F2E"
                                    stroke="#c08040"
                                    stroke-width="1.5"
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
                            v-for="n in PREDEFINED"
                            :key="n"
                            class="flex items-center justify-center rounded-lg border-2 py-2.5 text-sm font-semibold transition-colors"
                            :class="
                                !isCustom && selectedSeats === n
                                    ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                                    : 'border-gray-700 text-gray-400 hover:border-gray-600'
                            "
                            @click="selectedSeats = n; isCustom = false"
                        >
                            {{ n }}
                        </button>
                    </div>
                    <button
                        class="flex w-full items-center justify-center rounded-lg border-2 py-2 text-sm font-semibold transition-colors"
                        :class="
                            isCustom
                                ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                                : 'border-gray-700 text-gray-400 hover:border-gray-600'
                        "
                        @click="isCustom = true"
                    >
                        Custom
                    </button>
                    <div
                        v-if="isCustom"
                        class="space-y-2 pt-1"
                    >
                        <div class="flex items-center gap-3">
                            <span class="w-28 shrink-0 text-xs text-gray-500">Total seats</span>
                            <input
                                v-model.number="customSeats"
                                type="number"
                                min="1"
                                max="30"
                                class="w-full rounded-lg bg-gray-800 px-3 py-1.5 text-sm text-gray-100 outline-none ring-1 ring-gray-700 focus:ring-primary-500"
                            />
                        </div>
                        <div
                            v-if="selectedShape === 'rectangle'"
                            class="flex items-center gap-3"
                        >
                            <span class="w-28 shrink-0 text-xs text-gray-500">Per short side</span>
                            <input
                                v-model.number="customSideSeats"
                                type="number"
                                min="0"
                                :max="Math.floor(customSeats / 2)"
                                class="w-full rounded-lg bg-gray-800 px-3 py-1.5 text-sm text-gray-100 outline-none ring-1 ring-gray-700 focus:ring-primary-500"
                            />
                        </div>
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
