<template>
    <div class="flex h-full w-full flex-col rounded-lg border border-border bg-background/95 shadow-lg backdrop-blur-sm">
        <!-- 标题栏 -->
        <div class="sticky top-0 z-10 flex flex-shrink-0 items-center border-b border-border bg-background/95 p-3">
            <div class="flex flex-col">
                <h3 class="text-sm font-medium text-foreground">AI对话控制</h3>
                <div class="text-xs text-muted-foreground">通过自然语言控制模型动作</div>
            </div>
        </div>

        <!-- 对话记录区域 - 占满剩余空间 -->
        <div class="flex-1 p-3">
            <div class="flex h-full flex-col">
                <!-- 清空按钮 -->
                <div class="mb-2 flex justify-end">
                    <Button variant="ghost" size="sm" @click="clearChat" class="h-6 px-2 text-xs">清空</Button>
                </div>

                <!-- 对话记录内容 - 占满剩余空间 -->
                <div class="flex-1 space-y-2 overflow-y-auto rounded border border-border bg-muted/30 p-2">
                    <div v-for="(message, index) in chatHistory" :key="index" class="flex items-start gap-2 text-xs">
                        <span class="mt-0.5 flex-shrink-0 text-muted-foreground">
                            {{ formatTime(message.timestamp) }}
                        </span>
                        <div class="flex-1">
                            <div class="mb-1 flex items-center gap-2">
                                <span class="font-medium" :class="message.isUser ? 'text-blue-600' : 'text-green-600'">
                                    {{ message.isUser ? '用户' : 'AI' }}
                                </span>
                            </div>
                            <div class="break-words text-foreground">
                                {{ message.content }}
                            </div>
                        </div>
                    </div>

                    <div v-if="chatHistory.length === 0" class="py-4 text-center text-xs text-muted-foreground">暂无对话记录</div>
                </div>
            </div>
        </div>

        <!-- 固定在底部的聊天输入 -->
        <div class="sticky bottom-0 border-t border-border bg-background/95 p-3">
            <div class="flex gap-2">
                <Input 
                    v-model="newMessage" 
                    placeholder="输入自然语言指令，如：让模型走路..." 
                    class="h-8 text-xs flex-1" 
                    @keyup.enter="sendMessage" 
                />
                <Button 
                    @click="sendMessage" 
                    :disabled="!newMessage.trim() || isProcessing" 
                    size="sm" 
                    class="h-8 px-3 text-xs"
                >
                    <Send v-if="!isProcessing" class="h-3 w-3" />
                    <Loader2 v-else class="h-3 w-3 animate-spin" />
                    {{ isProcessing ? '处理中' : '发送' }}
                </Button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiPost } from '@/utils/api';
import { Loader2, Send } from 'lucide-vue-next';
import { ref } from 'vue';

interface ChatMessage {
    content: string;
    isUser: boolean;
    timestamp: Date;
}

const emit = defineEmits<{
    'ai-action': [action: string];
    'ai-animation-generated': [animation: { type: string; data: any; name: string; duration: number }];
}>();

// 响应式数据
const chatHistory = ref<ChatMessage[]>([]);
const newMessage = ref('');
const isProcessing = ref(false);

// 发送消息
const sendMessage = async () => {
    if (!newMessage.value.trim() || isProcessing.value) return;

    const userMessage = newMessage.value.trim();

    // 添加用户消息到聊天历史
    addChatMessage(userMessage, true);

    // 清空输入框
    newMessage.value = '';

    // 开始处理
    isProcessing.value = true;

    try {
        // 调用后端骨骼动画接口
        const result = await apiPost('/skeleton-animation/generate', {
            text: userMessage,
            duration: 3.0, // 默认3秒
            loop: true,
            speed: 1.0,
            intensity: 1.0,
        });

        if (result.success) {
            // 添加AI响应到聊天历史
            const aiResponse = `✅ 动画生成成功！\n动作类型: ${result.data.metadata.action_type}\n置信度: ${(result.data.metadata.confidence * 100).toFixed(1)}%\n时长: ${result.data.animation_data.duration}秒`;
            addChatMessage(aiResponse, false);

            // 发送动画数据给父组件
            emit('ai-animation-generated', {
                type: 'custom',
                data: result.data,
                name: `AI_${result.data.metadata.action_type}_${Date.now()}`,
                duration: result.data.animation_data.duration * 1000,
            });
        } else {
            throw new Error(result.message || '动画生成失败');
        }
    } catch (error) {
        console.error('AI处理失败:', error);
        const errorMessage = `❌ 处理失败: ${error instanceof Error ? error.message : '未知错误'}`;
        addChatMessage(errorMessage, false);
    } finally {
        isProcessing.value = false;
    }
};

// 添加聊天消息
const addChatMessage = (content: string, isUser: boolean) => {
    chatHistory.value.unshift({
        content,
        isUser,
        timestamp: new Date(),
    });

    // 限制聊天历史数量
    if (chatHistory.value.length > 50) {
        chatHistory.value = chatHistory.value.slice(0, 50);
    }
};

// 清空聊天记录
const clearChat = () => {
    chatHistory.value = [];
};

// 格式化时间
const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
};
</script>
