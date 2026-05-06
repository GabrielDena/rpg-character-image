<script setup lang="ts">
import { removeBackground } from '@imgly/background-removal';

const BUCKET = 'adventures';
const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'jfif', 'png', 'gif', 'webp', 'avif', 'bmp']);

interface StorageItem {
    name: string;
    id: string | null;
    metadata: Record<string, unknown> | null;
}

interface Props {
    currentPath: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
    refresh: [];
}>();

const supabase = useSupabase();
const toast = useToast();

const batchProcessing = ref(false);
const batchProgress = ref({ current: 0, total: 0 });

function getPassword() {
    return localStorage.getItem('app_password') ?? '';
}

async function batchRemoveBackgrounds() {
    if (!props.currentPath && !confirm('Process all images in root folder?')) return;
    if (batchProcessing.value) return;
    
    batchProcessing.value = true;
    batchProgress.value = { current: 0, total: 0 };
    const password = getPassword();
    
    try {
        const pathToProcess = props.currentPath || '';
        const { items } = await $fetch<{ items: StorageItem[] }>('/api/storage/list', {
            method: 'POST',
            body: { password, path: pathToProcess },
        });
        
        const imageFiles = items.filter((item) => item.id && IMAGE_EXTS.has(item.name.split('.').pop()?.toLowerCase() ?? ''));
        
        if (imageFiles.length === 0) {
            toast.add({ title: 'No images found', color: 'warning', icon: 'i-heroicons-exclamation-triangle' });
            return;
        }
        
        batchProgress.value.total = imageFiles.length;
        const noBgFolder = pathToProcess ? `${pathToProcess}/no-bg` : 'no-bg';
        
        try {
            await $fetch('/api/storage/folder', {
                method: 'POST',
                body: { password, path: `${noBgFolder}/.keep` },
            });
        } catch (error) {
            console.log('no-bg folder might already exist:', error);
        }
        
        const { items: existingNoBg } = await $fetch<{ items: StorageItem[] }>('/api/storage/list', {
            method: 'POST',
            body: { password, path: noBgFolder },
        }).catch(() => ({ items: [] }));
        
        const existingSet = new Set(existingNoBg.map(item => item.name));
        let processed = 0;
        let skipped = 0;
        let failed = 0;
        
        for (let i = 0; i < imageFiles.length; i++) {
            const file = imageFiles[i];
            if (!file) continue;
            
            const outputFileName = file.name.replace(/(\.[^.]+)$/, '.png');
            
            if (existingSet.has(outputFileName)) {
                skipped++;
                batchProgress.value.current = i + 1;
                continue;
            }
            
            try {
                const imagePath = pathToProcess ? `${pathToProcess}/${file.name}` : file.name;
                const imageUrl = supabase.storage.from(BUCKET).getPublicUrl(imagePath).data.publicUrl;
                
                const blob = await removeBackground(imageUrl);
                const outputPath = `${noBgFolder}/${outputFileName}`;
                
                const signed = await $fetch<{ token: string; path: string }>('/api/storage/sign-upload', {
                    method: 'POST',
                    body: { password, path: outputPath },
                });
                
                const { error } = await supabase.storage.from(BUCKET).uploadToSignedUrl(signed.path, signed.token, blob);
                
                if (error) {
                    failed++;
                } else {
                    processed++;
                }
            } catch (error) {
                console.error(`Failed to process ${file.name}:`, error);
                failed++;
            }
            
            batchProgress.value.current = i + 1;
        }
        
        emit('refresh');
        
        toast.add({
            title: 'Batch processing complete',
            description: `Processed: ${processed}, Skipped: ${skipped}, Failed: ${failed}`,
            color: failed > 0 ? 'warning' : 'success',
            icon: failed > 0 ? 'i-heroicons-exclamation-triangle' : 'i-heroicons-check-circle',
        });
    } catch (error) {
        console.error('Batch processing error:', error);
        toast.add({ title: 'Batch processing failed', color: 'error', icon: 'i-heroicons-exclamation-circle' });
    } finally {
        batchProcessing.value = false;
        batchProgress.value = { current: 0, total: 0 };
    }
}
</script>

<template>
    <div
        v-if="currentPath"
        class="rounded-lg border border-orange-800 bg-orange-950/30 p-3"
    >
        <div class="mb-2 flex items-center gap-2">
            <UIcon
                name="i-heroicons-code-bracket"
                class="size-4 text-orange-400"
            />
            <span class="text-xs font-medium text-orange-300">Dev Tools</span>
        </div>
        <div
            v-if="batchProcessing"
            class="mb-2 text-sm text-orange-300"
        >
            Processing {{ batchProgress.current }}/{{ batchProgress.total }}...
        </div>
        <UButton
            block
            size="sm"
            color="warning"
            variant="soft"
            icon="i-heroicons-scissors"
            :loading="batchProcessing"
            :disabled="batchProcessing"
            @click="batchRemoveBackgrounds"
        >
            Batch Remove BG (Current Folder)
        </UButton>
    </div>
</template>
