<script setup lang="ts">
import type { TrackingCard, TrackingCardType } from '#shared/types/models';
import type { CharacterWithUrl } from '~/types/character';

const props = defineProps<{
    adventureId: string;
    hiddenIds: string[];
    savingHidden: boolean;
    allCharacters: CharacterWithUrl[];
}>();

const characterById = computed(() =>
    Object.fromEntries(props.allCharacters.map((c) => [c.id, c]))
);

const emit = defineEmits<{
    updateHidden: [ids: string[]];
}>();

function isHidden(id: string) {
    return props.hiddenIds.includes(id);
}

function toggleHidden(id: string) {
    const next = isHidden(id)
        ? props.hiddenIds.filter((i) => i !== id)
        : [...props.hiddenIds, id];
    emit('updateHidden', next);
}

function getPassword() {
    return localStorage.getItem('app_password') ?? '';
}

const toast = useToast();
const store = useAppStore();
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

watch(() => store.trackingCardsVersion, fetchCards);

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
    <SessionCard v-bind="$attrs" title="Tracking Cards">
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
                :class="isHidden(card.id) ? 'opacity-50' : ''"
            >
                <span
                    class="size-2 shrink-0 rounded-full"
                    :class="TYPE_COLORS[card.type as TrackingCardType]"
                />
                <button
                    class="min-w-0 flex-1 text-left"
                    @click="openEdit(card)"
                >
                    <p class="truncate text-sm text-gray-300">{{ card.title }}</p>
                    <p
                        v-if="card.characterId && characterById[card.characterId]"
                        class="truncate text-xs text-gray-500"
                    >
                        {{ characterById[card.characterId]!.name }}
                    </p>
                </button>
                <div class="flex shrink-0 items-center gap-0.5">
                    <UTooltip :text="isHidden(card.id) ? 'Show' : 'Hide'">
                        <button
                            class="flex size-6 items-center justify-center rounded hover:bg-gray-700"
                            :disabled="savingHidden"
                            @click="toggleHidden(card.id)"
                        >
                            <UIcon
                                :name="isHidden(card.id) ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                                class="size-3.5 text-gray-400 hover:text-gray-200"
                            />
                        </button>
                    </UTooltip>
                    <button
                        :disabled="!!deletingId"
                        @click="deleteCard(card)"
                    >
                        <UIcon
                            name="i-heroicons-x-mark"
                            class="size-3.5 text-gray-500 hover:text-red-400"
                        />
                    </button>
                </div>
            </li>
        </ul>
    </SessionCard>

    <TrackingCardModal
        v-model:open="showModal"
        :adventure-id="adventureId"
        :card="editingCard"
        :characters="allCharacters"
        @created="onCreated"
        @updated="onUpdated"
    />
</template>
