<template>
    <Dialog :open="open" @update:open="$emit('update:open', $event)">
        <DialogContent class="max-w-md">
            <DialogHeader>
                <DialogTitle>添加人物</DialogTitle>
                <DialogDescription> 创建新的人物角色 </DialogDescription>
            </DialogHeader>

            <form @submit.prevent="handleSubmit" class="space-y-4">
                <div class="space-y-2">
                    <Label for="name">名称</Label>
                    <Input id="name" v-model="form.name" placeholder="输入名称" required />
                </div>

                <div class="space-y-2">
                    <Label for="description">描述</Label>
                    <Textarea id="description" v-model="form.description" placeholder="输入描述" rows="3" />
                </div>

                <div class="space-y-2">
                    <Label for="gender">性别</Label>
                    <div class="relative">
                        <Button variant="outline" @click="showGenderDropdown = !showGenderDropdown" class="w-full justify-between">
                            {{ getGenderText(form.gender) }}
                            <ChevronDown class="h-4 w-4" />
                        </Button>
                        <div
                            v-if="showGenderDropdown"
                            class="absolute left-0 top-full z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg"
                        >
                            <div class="p-1">
                                <div
                                    v-for="gender in genderOptions"
                                    :key="gender.value"
                                    class="cursor-pointer rounded px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                                    @click="selectGender(gender.value)"
                                >
                                    {{ gender.label }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="space-y-2">
                    <Label for="age">年龄</Label>
                    <Input id="age" v-model="form.age" type="number" placeholder="输入年龄" />
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" @click="handleCancel">取消</Button>
                    <Button type="submit" :disabled="loading">添加</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ChevronDown } from 'lucide-vue-next';
import { ref, watch } from 'vue';

// Props
interface Props {
    open: boolean;
    loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    loading: false,
});

// 性别选项
const genderOptions = [
    { value: 0, label: '未知' },
    { value: 1, label: '男性' },
    { value: 2, label: '女性' },
    { value: 3, label: '其他' },
];

// 表单数据
const form = ref({
    name: '',
    description: '',
    gender: 0,
    age: '' as string,
});

const showGenderDropdown = ref(false);

// 监听open变化，重置表单
watch(
    () => props.open,
    (newOpen) => {
        if (newOpen) {
            resetForm();
        }
    },
);

// 方法
const getGenderText = (gender: number) => {
    const option = genderOptions.find((g) => g.value === gender);
    return option ? option.label : '未知';
};

const selectGender = (gender: number) => {
    form.value.gender = gender;
    showGenderDropdown.value = false;
};

const resetForm = () => {
    form.value = {
        name: '',
        description: '',
        gender: 0,
        age: '',
    };
    showGenderDropdown.value = false;
};

const handleSubmit = () => {
    if (!form.value.name.trim()) {
        return;
    }

    const submitData = {
        name: form.value.name.trim(),
        description: form.value.description.trim(),
        gender: form.value.gender,
        age: form.value.age ? parseInt(form.value.age) : undefined,
    };

    emit('submit', submitData);
};

const handleCancel = () => {
    emit('update:open', false);
};

const emit = defineEmits<{
    'update:open': [value: boolean];
    submit: [data: { name: string; description: string; gender: number; age?: number }];
}>();
</script>
