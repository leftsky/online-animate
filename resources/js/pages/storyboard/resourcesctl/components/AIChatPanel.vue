<template>
    <div class="flex h-full w-full flex-col rounded-lg border border-border bg-background/95 shadow-lg backdrop-blur-sm">
        <!-- 标题栏 -->
        <div class="sticky top-0 z-10 flex flex-shrink-0 items-center border-b border-border bg-background/95 p-3">
            <div class="flex flex-col">
                <h3 class="text-sm font-medium text-foreground">AI对话控制</h3>
                <div class="text-xs text-muted-foreground">通过自然语言控制模型动作</div>
            </div>
        </div>

        <!-- 可滚动内容区域 -->
        <div class="flex-1 space-y-3 overflow-y-auto p-3">
            <!-- 预设指令 -->
            <div>
                <h4 class="mb-2 flex items-center text-sm font-medium text-foreground">
                    <Zap class="mr-2 h-4 w-4" />
                    预设指令
                </h4>
                <div class="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" @click="sendPresetMessage('让模型走路')" class="h-8 text-xs"> 走路 </Button>
                    <Button variant="outline" size="sm" @click="sendPresetMessage('让模型挥手')" class="h-8 text-xs"> 挥手 </Button>
                    <Button variant="outline" size="sm" @click="sendPresetMessage('模型向右转90度')" class="h-8 text-xs"> 右转90° </Button>
                    <Button variant="outline" size="sm" @click="sendPresetMessage('模型向前移动')" class="h-8 text-xs"> 前进 </Button>
                </div>
            </div>

            <!-- 模型状态 -->
            <div>
                <h4 class="mb-2 flex items-center text-sm font-medium text-foreground">
                    <Activity class="mr-2 h-4 w-4" />
                    模型状态
                </h4>
                <div class="space-y-2 text-xs">
                    <div class="flex items-center justify-between">
                        <span class="text-muted-foreground">加载状态:</span>
                        <span :class="getStatusColor(modelStatus)">
                            {{ getStatusText(modelStatus) }}
                        </span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-muted-foreground">可用动画:</span>
                        <span class="text-foreground">{{ availableAnimations.length }} 个</span>
                    </div>
                </div>
            </div>

            <!-- 聊天历史 -->
            <div>
                <div class="mb-2 flex items-center justify-between">
                    <h4 class="flex items-center text-sm font-medium text-foreground">
                        <MessageSquare class="mr-2 h-4 w-4" />
                        对话记录
                    </h4>
                    <Button variant="ghost" size="sm" @click="clearChat" class="h-6 px-2 text-xs"> 清空 </Button>
                </div>

                <div class="max-h-48 space-y-2 overflow-y-auto rounded border border-border bg-muted/30 p-2">
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

            <!-- 聊天输入 -->
            <div>
                <h4 class="mb-2 flex items-center text-sm font-medium text-foreground">
                    <Send class="mr-2 h-4 w-4" />
                    发送指令
                </h4>
                <div class="space-y-2">
                    <Input v-model="newMessage" placeholder="输入自然语言指令，如：让模型走路..." class="h-8 text-xs" @keyup.enter="sendMessage" />
                    <Button @click="sendMessage" :disabled="!newMessage.trim() || isProcessing" size="sm" class="h-8 w-full text-xs">
                        <Send v-if="!isProcessing" class="mr-1 h-3 w-3" />
                        <Loader2 v-else class="mr-1 h-3 w-3 animate-spin" />
                        {{ isProcessing ? '处理中...' : '发送' }}
                    </Button>
                </div>
            </div>

            <!-- 调试日志 -->
            <div>
                <h4 class="mb-2 flex items-center text-sm font-medium text-foreground">
                    <FileText class="mr-2 h-4 w-4" />
                    执行日志
                </h4>

                <div class="max-h-32 space-y-2 overflow-y-auto rounded border border-border bg-muted/30 p-2">
                    <div v-for="(log, index) in logs" :key="index" class="flex items-start gap-2 text-xs">
                        <span class="mt-0.5 flex-shrink-0 text-muted-foreground">
                            {{ formatTime(log.timestamp) }}
                        </span>
                        <span class="flex-1 break-words" :class="getLogColor(log.type)">
                            {{ log.message }}
                        </span>
                    </div>

                    <div v-if="logs.length === 0" class="py-4 text-center text-xs text-muted-foreground">暂无执行日志</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Activity, FileText, Loader2, MessageSquare, Send, Zap } from 'lucide-vue-next';
import { ref, watch } from 'vue';

interface ChatMessage {
    content: string;
    isUser: boolean;
    timestamp: Date;
}

interface LogEntry {
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    timestamp: Date;
}

interface Props {
    modelStatus: string;
    availableAnimations: any[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
    'ai-action': [action: string];
}>();

// 响应式数据
const chatHistory = ref<ChatMessage[]>([]);
const logs = ref<LogEntry[]>([]);
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

    // 模拟AI处理
    isProcessing.value = true;

    try {
        // 这里可以集成DeepSeek API进行自然语言理解
        // 目前使用简单的关键词匹配作为示例

        // 模拟AI响应延迟
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // 生成AI响应
        const aiResponse = generateAIResponse(userMessage);
        addChatMessage(aiResponse, false);

        // 发送动作指令
        emit('ai-action', userMessage);
    } catch (error) {
        console.error('AI处理失败:', error);
        addChatMessage('抱歉，处理您的指令时出现了错误。', false);
    } finally {
        isProcessing.value = false;
    }
};

// 发送预设消息
const sendPresetMessage = (message: string) => {
    newMessage.value = message;
    sendMessage();
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

// 生成AI响应
const generateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('走路') || lowerMessage.includes('走')) {
        return '好的，我将让模型执行走路动作。';
    } else if (lowerMessage.includes('挥手')) {
        return '好的，我将让模型执行挥手动作。';
    } else if (lowerMessage.includes('转') || lowerMessage.includes('旋转')) {
        return '好的，我将调整模型的旋转角度。';
    } else if (lowerMessage.includes('移动') || lowerMessage.includes('前进')) {
        return '好的，我将让模型向前移动。';
    } else {
        return '我理解了您的指令，正在执行相应的动作。';
    }
};

// 添加日志
const addLog = (type: LogEntry['type'], message: string) => {
    logs.value.unshift({
        type,
        message,
        timestamp: new Date(),
    });

    // 限制日志数量
    if (logs.value.length > 100) {
        logs.value = logs.value.slice(0, 100);
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

// 获取日志颜色
const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
        case 'success':
            return 'text-green-600';
        case 'warning':
            return 'text-yellow-600';
        case 'error':
            return 'text-red-600';
        default:
            return 'text-foreground';
    }
};

// 获取状态颜色
const getStatusColor = (status: string) => {
    switch (status) {
        case 'loaded':
            return 'text-green-600';
        case 'loading':
            return 'text-yellow-600';
        case 'error':
            return 'text-red-600';
        default:
            return 'text-muted-foreground';
    }
};

// 获取状态文本
const getStatusText = (status: string) => {
    switch (status) {
        case 'loaded':
            return '已加载';
        case 'loading':
            return '加载中';
        case 'error':
            return '加载失败';
        default:
            return '未知状态';
    }
};

// 监听模型状态变化，自动添加日志
watch(
    () => props.modelStatus,
    (newStatus, oldStatus) => {
        if (newStatus !== oldStatus && oldStatus) {
            addLog('info', `模型状态变化: ${getStatusText(oldStatus)} → ${getStatusText(newStatus)}`);
        }
    },
);

// 监听可用动画变化
watch(
    () => props.availableAnimations.length,
    (newCount, oldCount) => {
        if (newCount !== oldCount && oldCount !== undefined) {
            addLog('info', `可用动画数量: ${oldCount} → ${newCount}`);
        }
    },
);

// 暴露方法给父组件
defineExpose({
    addLog,
});
</script>
