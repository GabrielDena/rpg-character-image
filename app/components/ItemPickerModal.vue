<script setup lang="ts">
import type { Item } from '#shared/types/models';

const props = defineProps<{
    open: boolean;
    adventureId: string;
    activeIds: string[];
}>();

const emit = defineEmits<{
    'update:open': [value: boolean];
    confirm: [ids: string[]];
}>();

const search = ref('');
const allItems = ref<Item[]>([]);
const loading = ref(false);
const selected = ref<Set<string>>(new Set());

const filtered = computed(() => {
    const q = search.value.trim().toLowerCase();
    if (!q) return allItems.value;
    return allItems.value.filter(
        (i) =>
            i.name.toLowerCase().includes(q) ||
            (i.description ?? '').toLowerCase().includes(q)
    );
});

async function fetchItems() {
    loading.value = true;
    try {
        const { items } = await $fetch<{ items: Item[] }>('/api/items', {
            query: { adventureId: props.adventureId },
        });
        allItems.value = items;
    } catch {
        // non-fatal
    } finally {
        loading.value = false;
    }
}

watch(
    () => props.open,
    (val) => {
        if (val) {
            search.value = '';
            selected.value = new Set(props.activeIds);
            fetchItems();
        }
    }
);

function toggle(id: string) {
    const next = new Set(selected.value);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    selected.value = next;
}

function confirm() {
    emit('confirm', [...selected.value]);
    emit('update:open', false);
}
</script>

<template>
    <UModal
        :open="open"
        title="Add Items to Session"
        :ui="{ content: 'sm:max-w-md' }"
        :content="{ onOpenAutoFocus: (e: Event) => e.preventDefault() }"
        @update:open="emit('update:open', $event)"
    >
        <template #body>
            <div class="space-y-3">
                <UInput
                    v-model="search"
                    placeholder="Search items…"
                    leading-icon="i-heroicons-magnifying-glass"
                />

                <div
                    v-if="loading"
                    class="space-y-1"
                >
                    <USkeleton
                        v-for="n in 4"
                        :key="n"
                        class="h-12 w-full rounded-xl"
                    />
                </div>

                <div
                    v-else-if="!allItems.length"
                    class="py-8 text-center text-sm text-gray-500"
                >
                    No items in this adventure yet
                </div>

                <p
                    v-else-if="!filtered.length"
                    class="py-6 text-center text-sm text-gray-500"
                >
                    No items match your search
                </p>

                <ul
                    v-else
                    class="max-h-72 space-y-0.5 overflow-y-auto"
                >
                    <li
                        v-for="item in filtered"
                        :key="item.id"
                    >
                        <button
                            class="relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors"
                            :class="
                                selected.has(item.id)
                                    ? 'bg-violet-500/15 ring-1 ring-violet-500/40'
                                    : 'hover:bg-gray-800'
                            "
                            @click="toggle(item.id)"
                        >
                            <div class="size-9 shrink-0 overflow-hidden rounded-lg bg-gray-800">
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
                                        class="size-4 text-gray-500"
                                    />
                                </div>
                            </div>
                            <div class="min-w-0 flex-1">
                                <p class="truncate text-sm font-medium text-gray-100">
                                    {{ item.name }}
                                </p>
                                <p
                                    v-if="item.description"
                                    class="truncate text-xs text-gray-500"
                                >
                                    {{ item.description }}
                                </p>
                            </div>
                            <UIcon
                                v-if="selected.has(item.id)"
                                name="i-heroicons-check-circle-solid"
                                class="size-5 shrink-0 text-violet-400"
                            />
                        </button>
                    </li>
                </ul>
            </div>
        </template>

        <template #footer>
            <div class="flex items-center justify-between">
                <p class="text-xs text-gray-500">{{ selected.size }} selected</p>
                <div class="flex gap-2">
                    <UButton
                        color="neutral"
                        variant="ghost"
                        @click="emit('update:open', false)"
                    >
                        Cancel
                    </UButton>
                    <UButton @click="confirm">Confirm</UButton>
                </div>
            </div>
        </template>
    </UModal>
</template>
