<script setup lang="ts">
import type { Item, ItemCategory } from '#shared/types/models';

const props = defineProps<{
    adventureId: string;
    systemId: string;
}>();

const toast = useToast();

const list = ref<Item[]>([]);
const categories = ref<ItemCategory[]>([]);
const loading = ref(false);
const search = ref('');
const selectedCategoryId = ref<string | null>(null);
const showModal = ref(false);
const showCategoriesModal = ref(false);
const editingItem = ref<Item | null>(null);

const filtered = computed(() => {
    let result = list.value;
    const q = search.value.trim().toLowerCase();
    if (q)
        result = result.filter(
            (i) =>
                i.name.toLowerCase().includes(q) ||
                (i.description ?? '').toLowerCase().includes(q)
        );
    if (selectedCategoryId.value !== null) {
        result = result.filter((i) => i.categoryId === selectedCategoryId.value);
    }
    return result;
});

async function fetchItems() {
    loading.value = true;
    try {
        const { items } = await $fetch<{ items: Item[] }>('/api/items', {
            query: { adventureId: props.adventureId },
        });
        list.value = items;
    } catch (e: unknown) {
        toast.add({
            title: 'Failed to load items',
            color: 'error',
            description: e instanceof Error ? e.message : 'Unknown error',
        });
    } finally {
        loading.value = false;
    }
}

async function fetchCategories() {
    try {
        const { categories: rows } = await $fetch<{ categories: ItemCategory[] }>(
            '/api/item-categories',
            { query: { adventureId: props.adventureId } }
        );
        categories.value = rows;
    } catch {}
}

function openCreate() {
    editingItem.value = null;
    showModal.value = true;
}

function openEdit(item: Item) {
    editingItem.value = item;
    showModal.value = true;
}

function onCategoryAdded(cat: ItemCategory) {
    categories.value = [...categories.value, cat].sort((a, b) => a.name.localeCompare(b.name));
}

function onCategoryUpdated(cat: ItemCategory) {
    const idx = categories.value.findIndex((c) => c.id === cat.id);
    if (idx !== -1) {
        categories.value = [
            ...categories.value.slice(0, idx),
            cat,
            ...categories.value.slice(idx + 1),
        ];
    }
}

function onCategoryDeleted(id: string) {
    categories.value = categories.value.filter((c) => c.id !== id);
    if (selectedCategoryId.value === id) selectedCategoryId.value = null;
}

onMounted(() => {
    fetchItems();
    fetchCategories();
});
</script>

<template>
    <div>
        <div class="sticky top-0 z-10 space-y-2 bg-gray-900 p-4 pb-2">
            <div class="flex items-center justify-between">
                <p class="text-xs text-gray-500">
                    {{ filtered.length }} item{{ filtered.length !== 1 ? 's' : '' }}
                </p>
                <div class="flex items-center gap-2">
                    <UButton
                        size="sm"
                        color="neutral"
                        variant="ghost"
                        icon="i-heroicons-tag"
                        title="Manage categories"
                        @click="showCategoriesModal = true"
                    />
                    <UButton
                        size="sm"
                        leading-icon="i-heroicons-plus"
                        @click="openCreate"
                    >
                        New Item
                    </UButton>
                </div>
            </div>
            <UInput
                v-model="search"
                placeholder="Search items…"
                leading-icon="i-heroicons-magnifying-glass"
                size="sm"
                :ui="{ root: 'w-full' }"
            />
            <div
                v-if="categories.length"
                class="flex flex-wrap gap-1.5"
            >
                <button
                    class="rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors"
                    :class="
                        selectedCategoryId === null
                            ? 'border-violet-500 bg-violet-500/10 text-violet-300'
                            : 'border-gray-700 text-gray-400 hover:border-gray-600'
                    "
                    @click="selectedCategoryId = null"
                >
                    All
                </button>
                <button
                    v-for="cat in categories"
                    :key="cat.id"
                    class="rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors"
                    :class="
                        selectedCategoryId === cat.id
                            ? 'border-violet-500 bg-violet-500/10 text-violet-300'
                            : 'border-gray-700 text-gray-400 hover:border-gray-600'
                    "
                    @click="selectedCategoryId = cat.id"
                >
                    {{ cat.name }}
                </button>
            </div>
        </div>

        <div
            v-if="loading"
            class="grid grid-cols-2 gap-3 p-4"
        >
            <USkeleton
                v-for="n in 4"
                :key="n"
                class="h-48 w-full rounded-xl"
            />
        </div>

        <div
            v-else-if="!list.length"
            class="flex flex-col items-center justify-center gap-4 px-6 py-20"
        >
            <UIcon
                name="i-heroicons-archive-box"
                class="size-12 text-gray-700"
            />
            <div class="text-center">
                <p class="text-sm font-medium text-gray-400">No items yet</p>
                <p class="mt-1 text-xs text-gray-600">Add items and documents to this adventure</p>
            </div>
            <UButton
                leading-icon="i-heroicons-plus"
                @click="openCreate"
            >
                New Item
            </UButton>
        </div>

        <p
            v-else-if="!filtered.length"
            class="px-4 py-8 text-center text-sm text-gray-500"
        >
            No items match the current filter
        </p>

        <div
            v-else
            class="grid grid-cols-2 gap-3 p-4"
        >
            <button
                v-for="item in filtered"
                :key="item.id"
                class="flex flex-col overflow-hidden rounded-xl bg-gray-800 text-left transition-colors hover:bg-gray-750 active:bg-gray-700"
                @click="openEdit(item)"
            >
                <div class="relative h-36 w-full bg-gray-700">
                    <img
                        v-if="item.url"
                        :src="item.url"
                        :alt="item.name"
                        class="size-full object-cover"
                    />
                    <div
                        v-else
                        class="flex size-full items-center justify-center"
                    >
                        <UIcon
                            name="i-heroicons-archive-box"
                            class="size-10 text-gray-600"
                        />
                    </div>
                </div>
                <div class="p-3">
                    <p class="truncate text-sm font-medium text-gray-100">{{ item.name }}</p>
                    <span
                        v-if="item.categoryId"
                        class="mt-1 inline-block rounded-full bg-gray-700 px-2 py-0.5 text-[10px] text-gray-400"
                    >
                        {{ categories.find((c) => c.id === item.categoryId)?.name }}
                    </span>
                    <p
                        v-if="item.description"
                        class="mt-1.5 line-clamp-2 text-xs text-gray-500"
                    >
                        {{ item.description }}
                    </p>
                </div>
            </button>
        </div>

        <ItemCreateEditModal
            v-model:open="showModal"
            :adventure-id="adventureId"
            :system-id="systemId"
            :item="editingItem"
            :categories="categories"
            @created="fetchItems"
            @updated="fetchItems"
            @deleted="fetchItems"
        />

        <ItemCategoriesModal
            v-model:open="showCategoriesModal"
            :adventure-id="adventureId"
            :categories="categories"
            @category-added="onCategoryAdded"
            @category-updated="onCategoryUpdated"
            @category-deleted="onCategoryDeleted"
        />
    </div>
</template>
