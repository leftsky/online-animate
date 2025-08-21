<template>
    <div
        class="group relative cursor-pointer rounded-lg border border-border bg-card p-3 transition-all hover:border-primary/50"
        :class="{
            'border-primary bg-primary/5': isSelected,
        }"
        @click="$emit('select', character)"
    >
        <div class="flex items-center gap-3">
            <!-- 人物头像 -->
            <div class="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-muted">
                <img v-if="character.image_path" :src="character.image_path" :alt="character.name" class="h-full w-full object-cover" />
                <div v-else class="flex h-full w-full items-center justify-center text-muted-foreground">
                    <Users class="h-6 w-6" />
                </div>
            </div>

            <!-- 人物信息 -->
            <div class="min-w-0 flex-1">
                <h3 class="truncate text-sm font-medium text-foreground">
                    {{ character.name }}
                </h3>
                <p v-if="character.description" class="mt-0.5 truncate text-xs text-muted-foreground">
                    {{ character.description }}
                </p>
                <div class="mt-1 flex items-center gap-2">
                    <span class="text-xs text-muted-foreground">{{ getGenderText(character.gender) }}</span>
                    <span v-if="character.age" class="text-xs text-muted-foreground">{{ character.age }}岁</span>
                    <span v-if="hasModelFile" class="inline-flex items-center gap-1 text-xs text-green-600">
                        <div class="h-1.5 w-1.5 rounded-full bg-green-600"></div>
                        模型
                    </span>
                </div>
            </div>

            <!-- 操作按钮 -->
            <div class="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button variant="ghost" size="sm" class="h-6 w-6 p-0" @click.stop="$emit('upload-model', character)" :title="getModelFileStatus">
                    <Package class="h-3 w-3" :class="hasModelFile ? 'text-green-600' : 'text-muted-foreground'" />
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                        <Button variant="ghost" size="sm" class="h-6 w-6 p-0">
                            <MoreVertical class="h-3 w-3" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem @click="$emit('delete', character)">
                            <Trash2 class="mr-2 h-4 w-4" />
                            删除
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Package, Trash2, Users } from 'lucide-vue-next';
import { computed } from 'vue';

import { type MediaCharacter } from '@/services/mediaApi';

// Props
interface Props {
    character: MediaCharacter;
    isSelected?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    isSelected: false,
});

// Emits
defineEmits<{
    select: [character: MediaCharacter];
    'upload-model': [character: MediaCharacter];
    delete: [character: MediaCharacter];
}>();

// 性别选项
const genderOptions = [
    { value: 0, label: '未知' },
    { value: 1, label: '男性' },
    { value: 2, label: '女性' },
    { value: 3, label: '其他' },
];

// 计算属性
const hasModelFile = computed(() => {
    if (!props.character.additional_resources) return false;
    try {
        const resourcesData = Array.isArray(props.character.additional_resources)
            ? props.character.additional_resources[0]
            : props.character.additional_resources;

        if (typeof resourcesData === 'string') {
            const parsed = JSON.parse(resourcesData);
            return !!parsed.modelFile;
        } else if (typeof resourcesData === 'object' && resourcesData !== null) {
            const modelFile = (resourcesData as any).modelFile;
            return typeof modelFile === 'string' && modelFile.trim().length > 0;
        }
    } catch {
        return false;
    }
    return false;
});

const getModelFileStatus = computed(() => {
    return hasModelFile.value ? '已上传模型文件' : '上传模型文件';
});

// 方法
const getGenderText = (gender: number) => {
    const option = genderOptions.find((g) => g.value === gender);
    return option ? option.label : '未知';
};
</script>
