<script setup lang="ts">
import InputError from '@/components/InputError.vue';
import TextLink from '@/components/TextLink.vue';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthBase from '@/layouts/AuthLayout.vue';
import { Head, useForm } from '@inertiajs/vue3';
import { LoaderCircle } from 'lucide-vue-next';

defineProps<{
    status?: string;
    canResetPassword: boolean;
}>();

const form = useForm({
    name: '',
    password: '',
    remember: false,
});

const submit = () => {
    form.post(route('login'), {
        onFinish: () => form.reset('password'),
    });
};
</script>

<template>
    <AuthBase title="登录您的账户" description="请在下方输入您的用户名和密码进行登录">
        <Head title="登录" />

        <div v-if="status" class="mb-4 text-center text-sm font-medium text-green-600">
            {{ status }}
        </div>

        <form @submit.prevent="submit" class="flex flex-col gap-6">
            <div class="grid gap-6">
                <div class="grid gap-2">
                    <Label for="name">用户名</Label>
                    <Input
                        id="name"
                        type="text"
                        required
                        autofocus
                        tabindex="1"
                        autocomplete="username"
                        v-model="form.name"
                        placeholder="请输入用户名"
                    />
                    <InputError :message="form.errors.name" />
                </div>

                <div class="grid gap-2">
                    <div class="flex items-center justify-between">
                        <Label for="password">密码</Label>
                        <TextLink v-if="canResetPassword" :href="route('password.request')" class="text-sm" tabindex="5"> 忘记密码？ </TextLink>
                    </div>
                    <Input
                        id="password"
                        type="password"
                        required
                        tabindex="2"
                        autocomplete="current-password"
                        v-model="form.password"
                        placeholder="请输入密码"
                    />
                    <InputError :message="form.errors.password" />
                </div>

                <div class="flex items-center justify-between" tabindex="3">
                    <Label for="remember" class="flex items-center space-x-3">
                        <Checkbox id="remember" v-model:checked="form.remember" tabindex="4" />
                        <span>记住我</span>
                    </Label>
                </div>

                <Button type="submit" class="mt-4 w-full" tabindex="4" :disabled="form.processing">
                    <LoaderCircle v-if="form.processing" class="h-4 w-4 animate-spin" />
                    登录
                </Button>
            </div>

            <div class="text-center text-sm text-muted-foreground">
                还没有账户？
                <TextLink :href="route('register')" :tabindex="5">立即注册</TextLink>
            </div>
        </form>
    </AuthBase>
</template>
