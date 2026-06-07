<script setup lang="ts">
import type { BackgroundWithUrl } from '~/types/background';

const props = defineProps<{
    open: boolean;
    allBackgrounds: BackgroundWithUrl[];
}>();

const emit = defineEmits<{
    'update:open': [value: boolean];
    confirm: [id: string];
}>();

const search = ref('');
const loading = ref(false);

const filtered = computed(() => {
    const q = search.value.trim().toLowerCase();
    if (!q) return props.allBackgrounds;
    return props.allBackgrounds.filter((c) => c.name.toLowerCase().includes(q));
});

watch(
    () => props.open,
    (val) => {
        if (val) {
            search.value = '';
        }
    }
);

function confirm(id: string) {
    emit('confirm', id);
    emit('update:open', false);
}
</script>

<template>
    <UModal
        :open="open"
        title="Select Scene Background"
        :ui="{ content: 'sm:max-w-md' }"
        :content="{ onOpenAutoFocus: (e: Event) => e.preventDefault() }"
        @update:open="emit('update:open', $event)"
    >
        <template #body>
            <div class="space-y-3">
                <UInput
                    v-model="search"
                    placeholder="Search Backgrounds…"
                    leading-icon="i-heroicons-magnifying-glass"
                    autofocus
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
                    v-else-if="!allBackgrounds.length"
                    class="py-8 text-center text-sm text-gray-500"
                >
                    No Backgrounds in this adventure yet
                </div>

                <p
                    v-else-if="filtered.length === 0"
                    class="py-6 text-center text-sm text-gray-500"
                >
                    No Backgrounds match your search
                </p>

                <ul
                    v-else
                    class="max-h-72 space-y-0.5 overflow-y-auto"
                >
                    <li
                        v-for="background in filtered"
                        :key="background.id"
                    >
                        <button
                            class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-gray-800"
                            @click="confirm(background.id)"
                        >
                            <div class="size-8 shrink-0 overflow-hidden rounded-full bg-gray-800">
                                <img
                                    :src="background.url!"
                                    :alt="background.name"
                                    class="size-full object-cover"
                                />
                            </div>
                            <div class="min-w-0 flex-1 text-left">
                                <p class="truncate text-sm font-medium text-gray-100">
                                    {{ background.name }}
                                </p>
                            </div>
                        </button>
                    </li>
                </ul>
            </div>
        </template>
    </UModal>
</template>

