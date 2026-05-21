<script setup lang="ts">
const props = defineProps<{
    open: boolean;
    file: File | null;
}>();

const emit = defineEmits<{
    'update:open': [value: boolean];
    confirm: [blob: Blob];
}>();

const imageRef = ref<HTMLImageElement | null>(null);
let cropper: any = null;
let objectUrl: string | null = null;

async function initCropper() {
    await nextTick();
    if (!imageRef.value || !props.file) return;

    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
    }

    objectUrl = URL.createObjectURL(props.file);
    imageRef.value.src = objectUrl;

    await new Promise<void>((resolve) => {
        imageRef.value!.onload = () => resolve();
        imageRef.value!.onerror = () => resolve();
    });

    if (!imageRef.value) return;

    const { default: Cropper } = await import('cropperjs');

    cropper = new Cropper(imageRef.value, {
        aspectRatio: 1,
        viewMode: 1,
        autoCropArea: 0.8,
        dragMode: 'move',
        guides: false,
        center: true,
        highlight: false,
        cropBoxMovable: false,
        cropBoxResizable: false,
        background: false,
    });
}

watch(
    () => props.open,
    async (val) => {
        if (val && props.file) {
            await initCropper();
        } else {
            if (cropper) {
                cropper.destroy();
                cropper = null;
            }
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
                objectUrl = null;
            }
        }
    }
);

function confirm() {
    if (!cropper) return;
    const canvas = cropper.getCroppedCanvas({ width: 400, height: 400 });
    canvas.toBlob(
        (blob: Blob | null) => {
            if (blob) emit('confirm', blob);
            emit('update:open', false);
        },
        'image/jpeg',
        0.9
    );
}

onUnmounted(() => {
    if (cropper) cropper.destroy();
    if (objectUrl) URL.revokeObjectURL(objectUrl);
});
</script>

<template>
    <UModal
        :open="open"
        title="Crop Avatar"
        description="Move and zoom to position the face in the square"
        @update:open="emit('update:open', $event)"
    >
        <template #body>
            <div class="overflow-hidden rounded-lg bg-gray-950">
                <img
                    ref="imageRef"
                    alt="Crop preview"
                    class="block max-h-105 w-full"
                />
            </div>
        </template>
        <template #footer>
            <div class="flex justify-end gap-2">
                <UButton
                    color="neutral"
                    variant="ghost"
                    @click="emit('update:open', false)"
                >
                    Cancel
                </UButton>
                <UButton @click="confirm">
                    Crop & Use
                </UButton>
            </div>
        </template>
    </UModal>
</template>
