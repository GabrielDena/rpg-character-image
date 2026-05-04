<script setup lang="ts">
const BUCKET = 'adventures';
const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'jfif', 'png', 'gif', 'webp', 'avif', 'bmp']);

interface StorageItem {
    name: string;
    id: string | null;
    metadata: Record<string, unknown> | null;
}

interface ImageItem {
    name: string;
    path: string;
    url: string;
}

const supabase = useSupabase();
const store = useAppStore();

const images = ref<ImageItem[]>([]);
const loadingImages = ref(false);
const imagesError = ref<string | null>(null);
const gridCols = ref(4);
const searchQuery = ref('');

const selectedSet = computed(() => new Set(store.selectedImages));
const selectedCount = computed(() => store.selectedImages.length);

const filteredImages = computed(() => {
    if (!searchQuery.value.trim()) return images.value;
    const query = searchQuery.value.toLowerCase();
    return images.value.filter((img) => img.name.toLowerCase().includes(query));
});

async function fetchImages() {
    if (!store.selectedFolder) return;
    loadingImages.value = true;
    imagesError.value = null;
    try {
        const password = import.meta.client ? (sessionStorage.getItem('app_password') ?? '') : '';
        const { items } = await $fetch<{ items: StorageItem[] }>('/api/storage/list', {
            method: 'POST',
            body: { password, path: store.selectedFolder },
        });
        images.value = items
            .filter((item) => item.id && IMAGE_EXTS.has(item.name.split('.').pop()?.toLowerCase() ?? ''))
            .map((item) => {
                const path = `${store.selectedFolder}/${item.name}`;
                return {
                    name: item.name,
                    path,
                    url: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl,
                };
            });
    } catch (e: unknown) {
        imagesError.value = e instanceof Error ? e.message : 'Could not load images';
    } finally {
        loadingImages.value = false;
    }
}

watch(
    () => store.selectedFolder,
    (folder) => {
        if (folder) fetchImages();
        else images.value = [];
    },
    { immediate: true }
);
</script>

<template>
    <div class="flex h-full flex-col">
        <!-- Status bar -->
        <div class="shrink-0 border-b border-gray-800 bg-gray-900 px-4 py-3">
            <div class="flex items-center justify-between gap-3">
                <span class="text-sm text-gray-400">
                    <template v-if="loadingImages">Loading…</template>
                    <template v-else-if="store.selectedFolder">
                        {{ filteredImages.length }}<template v-if="searchQuery">/{{ images.length }}</template> image{{ filteredImages.length !== 1 ? 's' : '' }}
                    </template>
                    <template v-else>No folder selected</template>
                </span>

                <UInput
                    v-if="store.selectedFolder && !loadingImages"
                    v-model="searchQuery"
                    icon="i-heroicons-magnifying-glass"
                    placeholder="Search images..."
                    size="xs"
                    class="w-48"
                >
                    <template #trailing>
                        <UButton
                            v-if="searchQuery"
                            variant="link"
                            color="neutral"
                            size="xs"
                            icon="i-heroicons-x-mark"
                            :padded="false"
                            @click="searchQuery = ''"
                        />
                    </template>
                </UInput>

                <div class="flex items-center gap-2">
                    <UBadge
                        v-if="selectedCount > 0"
                        color="primary"
                        variant="soft"
                        :label="`${selectedCount} selected`"
                    />
                    <UButton
                        v-if="selectedCount > 0"
                        variant="ghost"
                        color="neutral"
                        size="xs"
                        label="Clear"
                        @click="store.clearSelection()"
                    />
                    <div class="flex items-center gap-1">
                        <UButton
                            variant="ghost"
                            color="neutral"
                            size="xs"
                            icon="i-heroicons-minus"
                            :disabled="gridCols >= 10"
                            @click="gridCols++"
                        />
                        <UButton
                            variant="ghost"
                            color="neutral"
                            size="xs"
                            icon="i-heroicons-arrow-path"
                            @click="gridCols = 4"
                        />
                        <UButton
                            variant="ghost"
                            color="neutral"
                            size="xs"
                            icon="i-heroicons-plus"
                            :disabled="gridCols <= 2"
                            @click="gridCols--"
                        />
                    </div>
                </div>
            </div>
        </div>

        <!-- Content -->
        <div class="min-h-0 flex-1 overflow-y-auto">
            <UEmpty
                v-if="!store.selectedFolder"
                icon="i-heroicons-folder"
                title="No folder selected"
                description="Go to the Folder tab and select a folder first"
                class="py-20"
            />

            <div
                v-else-if="loadingImages"
                class="grid gap-0.5"
                :style="`grid-template-columns: repeat(${gridCols}, minmax(0, 1fr))`"
            >
                <USkeleton
                    v-for="n in 12"
                    :key="n"
                    class="aspect-square w-full"
                />
            </div>

            <div
                v-else-if="imagesError"
                class="p-4"
            >
                <UAlert
                    icon="i-heroicons-exclamation-triangle"
                    color="error"
                    variant="soft"
                    title="Could not load images"
                    :description="imagesError"
                    :actions="[{ label: 'Retry', leadingIcon: 'i-heroicons-arrow-path', onClick: fetchImages }]"
                />
            </div>

            <UEmpty
                v-else-if="!images.length"
                icon="i-heroicons-photo"
                title="No images found"
                description="This folder contains no supported image files"
                class="py-20"
            />

            <UEmpty
                v-else-if="!filteredImages.length"
                icon="i-heroicons-magnifying-glass"
                title="No matches"
                description="No images match your search query"
                class="py-20"
            />

            <div
                v-else
                class="grid gap-0.5"
                :style="`grid-template-columns: repeat(${gridCols}, minmax(0, 1fr))`"
            >
                <button
                    v-for="image in filteredImages"
                    :key="image.path"
                    class="group relative aspect-square overflow-hidden bg-gray-800 focus:outline-none"
                    @click="store.toggleImage(image.path)"
                >
                    <img
                        :src="image.url"
                        :alt="image.name"
                        loading="lazy"
                        class="size-full object-cover transition-opacity duration-150"
                        :class="selectedSet.has(image.path) ? 'opacity-80' : 'opacity-100'"
                    />

                    <div
                        v-if="selectedSet.has(image.path)"
                        class="bg-primary-500/20 pointer-events-none absolute inset-0"
                    />

                    <div
                        class="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full transition-all duration-150"
                        :class="
                            selectedSet.has(image.path)
                                ? 'bg-primary-500 ring-2 ring-white'
                                : 'bg-black/50 ring-1 ring-white/30'
                        "
                    >
                        <UIcon
                            v-if="selectedSet.has(image.path)"
                            name="i-heroicons-check"
                            class="size-3 text-white"
                        />
                    </div>
                </button>
            </div>
        </div>
    </div>
</template>

