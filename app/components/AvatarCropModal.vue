<script setup lang="ts">
const CONTAINER = 320;
const RADIUS = 130;
const OUTPUT = 400;

const props = defineProps<{
    open: boolean;
    file: File | null;
}>();

const emit = defineEmits<{
    'update:open': [value: boolean];
    confirm: [blob: Blob];
}>();

const imgSrc = ref<string | null>(null);
const naturalW = ref(0);
const naturalH = ref(0);
const scale = ref(1);
const offsetX = ref(0);
const offsetY = ref(0);

const minScale = computed(() => {
    if (!naturalW.value || !naturalH.value) return 1;
    return Math.max((RADIUS * 2) / naturalW.value, (RADIUS * 2) / naturalH.value);
});

watch(
    () => props.file,
    (file) => {
        if (!file) return;
        if (imgSrc.value) URL.revokeObjectURL(imgSrc.value);
        imgSrc.value = URL.createObjectURL(file);
        naturalW.value = 0;
        naturalH.value = 0;
        offsetX.value = 0;
        offsetY.value = 0;
    }
);

watch(
    () => props.open,
    (val) => {
        if (!val) return;
        offsetX.value = 0;
        offsetY.value = 0;
    }
);

function onImageLoad(e: Event) {
    const img = e.target as HTMLImageElement;
    naturalW.value = img.naturalWidth;
    naturalH.value = img.naturalHeight;
    scale.value = minScale.value;
    offsetX.value = 0;
    offsetY.value = 0;
}

function clamp() {
    const maxX = Math.max(0, (naturalW.value * scale.value) / 2 - RADIUS);
    const maxY = Math.max(0, (naturalH.value * scale.value) / 2 - RADIUS);
    offsetX.value = Math.max(-maxX, Math.min(maxX, offsetX.value));
    offsetY.value = Math.max(-maxY, Math.min(maxY, offsetY.value));
}

// Pointer handling (drag + pinch)
const activePointers = new Map<number, { x: number; y: number }>();

function onPointerDown(e: PointerEvent) {
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
}

function onPointerMove(e: PointerEvent) {
    if (!activePointers.has(e.pointerId)) return;
    const prev = activePointers.get(e.pointerId)!;
    const curr = { x: e.clientX, y: e.clientY };

    if (activePointers.size === 1) {
        offsetX.value += curr.x - prev.x;
        offsetY.value += curr.y - prev.y;
        clamp();
    } else if (activePointers.size === 2) {
        const other = [...activePointers.entries()].find(([id]) => id !== e.pointerId)?.[1];
        if (other) {
            const prevDist = Math.hypot(prev.x - other.x, prev.y - other.y);
            const currDist = Math.hypot(curr.x - other.x, curr.y - other.y);
            if (prevDist > 0) {
                scale.value = Math.max(
                    minScale.value,
                    Math.min(scale.value * (currDist / prevDist), minScale.value * 5)
                );
                clamp();
            }
        }
    }
    activePointers.set(e.pointerId, curr);
}

function onPointerUp(e: PointerEvent) {
    activePointers.delete(e.pointerId);
}

function onWheel(e: WheelEvent) {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.08 : 0.92;
    scale.value = Math.max(minScale.value, Math.min(scale.value * factor, minScale.value * 5));
    clamp();
}

const imgTransform = computed(
    () =>
        `translate(calc(-50% + ${offsetX.value}px), calc(-50% + ${offsetY.value}px)) scale(${scale.value})`
);

async function confirm() {
    if (!imgSrc.value || !naturalW.value) return;
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext('2d')!;

    ctx.beginPath();
    ctx.arc(OUTPUT / 2, OUTPUT / 2, OUTPUT / 2, 0, Math.PI * 2);
    ctx.clip();

    const scaledW = naturalW.value * scale.value;
    const scaledH = naturalH.value * scale.value;
    const imageLeft = CONTAINER / 2 + offsetX.value - scaledW / 2;
    const imageTop = CONTAINER / 2 + offsetY.value - scaledH / 2;
    const circleLeft = CONTAINER / 2 - RADIUS;
    const circleTop = CONTAINER / 2 - RADIUS;

    const srcX = (circleLeft - imageLeft) / scale.value;
    const srcY = (circleTop - imageTop) / scale.value;
    const srcSize = (RADIUS * 2) / scale.value;

    const img = new Image();
    img.src = imgSrc.value;
    await new Promise<void>((res) => {
        img.onload = () => res();
    });
    ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, OUTPUT, OUTPUT);

    canvas.toBlob(
        (blob) => {
            if (blob) emit('confirm', blob);
            emit('update:open', false);
        },
        'image/jpeg',
        0.92
    );
}

onUnmounted(() => {
    if (imgSrc.value) URL.revokeObjectURL(imgSrc.value);
});
</script>

<template>
    <UModal
        :open="open"
        title="Crop Avatar"
        description="Drag to reposition · Scroll or pinch to zoom"
        :ui="{ content: 'sm:max-w-sm' }"
        @update:open="emit('update:open', $event)"
    >
        <template #body>
            <div class="flex flex-col items-center gap-3">
                <!-- Crop stage -->
                <div
                    class="relative overflow-hidden rounded-xl bg-gray-950 select-none"
                    :style="{
                        width: `${CONTAINER}px`,
                        height: `${CONTAINER}px`,
                        touchAction: 'none',
                    }"
                    @pointerdown="onPointerDown"
                    @pointermove="onPointerMove"
                    @pointerup="onPointerUp"
                    @pointercancel="onPointerUp"
                    @wheel.prevent="onWheel"
                >
                    <!-- Image -->
                    <img
                        v-if="imgSrc"
                        :src="imgSrc"
                        alt="Crop"
                        draggable="false"
                        class="absolute max-w-none"
                        :style="{
                            top: '50%',
                            left: '50%',
                            transformOrigin: 'center center',
                            transform: imgTransform,
                            cursor: activePointers.size > 0 ? 'grabbing' : 'grab',
                        }"
                        @load="onImageLoad"
                    />

                    <!-- Circle spotlight overlay (box-shadow punch-out) -->
                    <div
                        class="pointer-events-none absolute rounded-full"
                        :style="{
                            width: `${RADIUS * 2}px`,
                            height: `${RADIUS * 2}px`,
                            left: `${CONTAINER / 2 - RADIUS}px`,
                            top: `${CONTAINER / 2 - RADIUS}px`,
                            boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
                            border: '2px solid rgba(255,255,255,0.65)',
                        }"
                    />
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
                <UButton @click="confirm"> Apply </UButton>
            </div>
        </template>
    </UModal>
</template>

