<script setup lang="ts">
defineProps<{
    title?: string;
}>();
</script>

<template>
    <div class="flex h-full flex-col overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
        <div
            v-if="title"
            class="flex h-10 shrink-0 items-center justify-between border-b border-gray-800 px-3"
        >
            <h2 class="text-xs font-semibold tracking-widest text-gray-500 uppercase">
                {{ title }}
            </h2>
            <slot name="action" />
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto">
            <slot />
        </div>
    </div>
</template>

