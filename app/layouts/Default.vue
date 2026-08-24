<script setup lang="ts">
const route = useRoute()
const store = useAppStore()
const isDisplayPage = computed(() => route.path === '/display')
const hideNavSpace = computed(() => isDisplayPage.value && store.isFullscreen)
</script>

<template>
    <div class="relative h-full w-full bg-gray-950 text-gray-100">
        <main
            class="absolute inset-0 overflow-hidden transition-all duration-300"
            :class="hideNavSpace ? 'bottom-0' : 'bottom-16'"
        >
            <slot />
        </main>
        <BottomNav />
    </div>
</template>
