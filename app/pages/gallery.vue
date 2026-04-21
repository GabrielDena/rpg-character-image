<script setup lang="ts">
const store = useAppStore()

const container = ref<HTMLElement | null>(null)
const containerWidth = ref(0)
const containerHeight = ref(0)

onMounted(() => {
    if (!container.value) return
    const ro = new ResizeObserver(([entry]) => {
        containerWidth.value = entry?.contentRect.width || 0
        containerHeight.value = entry?.contentRect.height || 0
    })
    ro.observe(container.value)
    onUnmounted(() => ro.disconnect())
})

const count = computed(() => store.selectedImages.length)

// Pick the column count whose column/row ratio best matches the container.
const cols = computed(() => {
    if (count.value === 0) return 1
    const ratio =
        containerWidth.value && containerHeight.value
            ? containerWidth.value / containerHeight.value
            : 16 / 9

    let best = 1
    let bestScore = Infinity
    for (let c = 1; c <= count.value; c++) {
        const r = Math.ceil(count.value / c)
        const score = Math.abs(c / r - ratio)
        if (score < bestScore) {
            bestScore = score
            best = c
        }
    }
    return best
})

// Target height per image so every row fills the container exactly.
const imageHeight = computed(() => {
    if (!containerHeight.value) return 'auto'
    const rows = Math.ceil(count.value / cols.value)
    // subtract row gaps from total height before dividing
    const gap = 2
    const usable = containerHeight.value - gap * (rows - 1)
    return `${Math.floor(usable / rows)}px`
})
</script>

<template>
    <div ref="container" class="h-full w-full">
        <!-- Empty state -->
        <div
            v-if="count === 0"
            class="flex h-full flex-col items-center justify-center gap-3"
        >
            <UIcon name="i-heroicons-squares-2x2" class="size-12 text-gray-700" />
            <div class="text-center">
                <p class="text-sm font-medium text-gray-400">No images selected</p>
                <p class="mt-1 text-xs text-gray-600">
                    Select images on the Select tab to display them here
                </p>
            </div>
        </div>

        <!-- Column layout -->
        <div
            v-else
            class="h-full w-full overflow-hidden"
            :style="{ columnCount: cols, columnGap: '2px' }"
        >
            <img
                v-for="filename in store.selectedImages"
                :key="filename"
                :src="`/api/image/${encodeURIComponent(filename)}`"
                :alt="filename"
                loading="lazy"
                class="block w-full object-cover"
                :style="{ height: imageHeight, marginBottom: '2px', breakInside: 'avoid', objectFit: 'contain' }"
            />
        </div>
    </div>
</template>
