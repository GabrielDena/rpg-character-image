<script setup lang="ts">
import type { TrackingCard, TrackingCardType } from '#shared/types/models';

const props = defineProps<{
    adventureId: string;
}>();

function getPassword() {
    return localStorage.getItem('app_password') ?? '';
}

const toast = useToast();
const cards = ref<TrackingCard[]>([]);
const loading = ref(false);

const TYPE_COLORS: Record<TrackingCardType, string> = {
    clue: 'bg-blue-500',
    juice: 'bg-amber-500',
    tag: 'bg-rose-600',
    status: 'bg-emerald-500',
};

// ── Fetch ─────────────────────────────────────────────────────────────────────
async function fetchCards() {
    loading.value = true;
    try {
        const { trackingCards } = await $fetch<{ trackingCards: TrackingCard[] }>(
            '/api/tracking-cards',
            { query: { adventureId: props.adventureId } },
        );
        cards.value = trackingCards;
    } catch {
        // non-fatal
    } finally {
        loading.value = false;
    }
}

onMounted(fetchCards);

// ── Modal ─────────────────────────────────────────────────────────────────────
const showModal = ref(false);
const editingCard = ref<TrackingCard | null>(null);

function openCreate() {
    editingCard.value = null;
    showModal.value = true;
}

function openEdit(card: TrackingCard) {
    editingCard.value = card;
    showModal.value = true;
}

function onCreated(card: TrackingCard) {
    cards.value.push(card);
}

function onUpdated(updated: TrackingCard) {
    const idx = cards.value.findIndex((c) => c.id === updated.id);
    if (idx !== -1) cards.value[idx] = updated;
}

// ── Delete ────────────────────────────────────────────────────────────────────
const deletingId = ref<string | null>(null);

async function deleteCard(card: TrackingCard) {
    deletingId.value = card.id;
    try {
        await $fetch(`/api/tracking-cards/${card.id}`, {
            method: 'DELETE',
            body: { password: getPassword() },
        });
        cards.value = cards.value.filter((c) => c.id !== card.id);
    } catch (e: unknown) {
        toast.add({ title: 'Failed to delete card', color: 'error', description: e instanceof Error ? e.message : 'Unknown error' });
    } finally {
        deletingId.value = null;
    }
}
</script>

<template>
    <SessionCard title="Tracking Cards">
        <template #action>
            <UButton
                size="xs"
                color="neutral"
                variant="ghost"
                icon="i-heroicons-plus"
                @click="openCreate"
            />
        </template>

        <!-- Empty state -->
        <div
            v-if="!loading && !cards.length"
            class="flex flex-col items-center gap-1.5 px-4 py-6 text-center"
        >
            <UIcon
                name="i-heroicons-identification"
                class="size-6 text-gray-700"
            />
            <p class="text-xs text-gray-600">No tracking cards</p>
        </div>

        <!-- Card list -->
        <ul
            v-if="cards.length"
            class="flex flex-col"
        >
            <li
                v-for="card in cards"
                :key="card.id"
                class="flex items-center gap-2 px-3 py-2 transition-colors hover:bg-gray-800"
            >
                <span
                    class="size-2 shrink-0 rounded-full"
                    :class="TYPE_COLORS[card.type as TrackingCardType]"
                />
                <button
                    class="min-w-0 flex-1 truncate text-left text-sm text-gray-300"
                    @click="openEdit(card)"
                >
                    {{ card.title }}
                </button>
                <button
                    :disabled="!!deletingId"
                    @click="deleteCard(card)"
                >
                    <UIcon
                        name="i-heroicons-x-mark"
                        class="size-3.5 text-gray-500 hover:text-red-400"
                    />
                </button>
            </li>
        </ul>
    </SessionCard>

    <TrackingCardModal
        v-model:open="showModal"
        :adventure-id="adventureId"
        :card="editingCard"
        @created="onCreated"
        @updated="onUpdated"
    />
</template>
