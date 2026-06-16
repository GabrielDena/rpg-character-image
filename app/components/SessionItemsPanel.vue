<script setup lang="ts">
import type { Item } from '#shared/types/models';

const props = defineProps<{
    allItems: Item[];
    activeIds: string[];
    saving: boolean;
}>();

const emit = defineEmits<{
    update: [ids: string[]];
}>();

const showPicker = ref(false);
const showRemoveAllModal = ref(false);

const activeItems = computed(() =>
    props.activeIds
        .map((id) => props.allItems.find((i) => i.id === id))
        .filter((i): i is Item => !!i)
);
</script>

<template>
    <SessionCard
        title="Items"
        class="h-full"
    >
        <template #action>
            <UButton
                size="xs"
                color="neutral"
                variant="ghost"
                icon="i-heroicons-plus"
                :loading="saving"
                @click="showPicker = true"
            />
        </template>

        <div
            v-if="!activeItems.length"
            class="flex flex-col items-center gap-1.5 px-4 py-6 text-center"
        >
            <UIcon
                name="i-heroicons-archive-box"
                class="size-6 text-gray-700"
            />
            <p class="text-xs text-gray-600">No items in session</p>
        </div>

        <ul
            v-else
            class="flex flex-col"
        >
            <li
                v-for="item in activeItems"
                :key="item.id"
                class="flex items-center gap-2 px-3 py-2 transition-colors hover:bg-gray-800"
            >
                <div class="size-6 shrink-0 overflow-hidden rounded bg-gray-800">
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
                            class="size-3.5 text-gray-600"
                        />
                    </div>
                </div>
                <span class="min-w-0 flex-1 truncate text-sm text-gray-300">{{ item.name }}</span>
                <button @click="emit('update', activeIds.filter((i) => i !== item.id))">
                    <UIcon
                        name="i-heroicons-x-mark"
                        class="size-3.5 text-gray-500 hover:text-red-400"
                    />
                </button>
            </li>
            <li class="border-t border-gray-800">
                <button
                    class="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-800 hover:text-red-400"
                    :disabled="saving"
                    @click="showRemoveAllModal = true"
                >
                    <UIcon
                        name="i-heroicons-trash"
                        class="size-3.5 shrink-0"
                    />
                    <span>Remove all items</span>
                </button>
            </li>
        </ul>

        <ItemPickerModal
            v-model:open="showPicker"
            :items="allItems"
            :active-ids="activeIds"
            @confirm="emit('update', $event)"
        />
    </SessionCard>

    <UModal
        :open="showRemoveAllModal"
        title="Remove All Items"
        :ui="{ content: 'sm:max-w-sm' }"
        :content="{ onOpenAutoFocus: (e: Event) => e.preventDefault() }"
        @update:open="showRemoveAllModal = $event"
    >
        <template #body>
            <p class="text-sm text-gray-300">
                Are you sure you want to remove all items from the session?
            </p>
        </template>
        <template #footer>
            <div class="flex justify-end gap-2">
                <UButton
                    color="neutral"
                    variant="ghost"
                    @click="showRemoveAllModal = false"
                >
                    Cancel
                </UButton>
                <UButton
                    color="error"
                    @click="emit('update', []); showRemoveAllModal = false"
                >
                    Remove All
                </UButton>
            </div>
        </template>
    </UModal>
</template>
