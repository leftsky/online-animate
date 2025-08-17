<template>
  <div class="flex h-full bg-background">
    <!-- 左侧 JSON 区域 -->
    <div class="flex-1 flex flex-col border-r border-border">
      <div class="p-4 border-b border-border">
        <h3 class="text-lg font-semibold text-foreground">JSON 数据</h3>
        <p class="text-sm text-muted-foreground">编辑 JSON 数据，点击转换按钮生成 YAML</p>
      </div>
      
      <div class="flex-1 p-4">
        <div class="mb-4 flex gap-2">
          <Button @click="loadSampleData" variant="outline" size="sm" type="button">
            加载示例数据
          </Button>
          <Button @click="formatJson" variant="outline" size="sm" type="button">
            格式化 JSON
          </Button>
          <Button @click="convertJsonToYaml" variant="default" size="sm" type="button">
            转换为 YAML
          </Button>


        </div>
        
        <div class="relative">
          <Textarea
            :value="jsonInput"
            placeholder="请输入或粘贴 JSON 数据..."
            class="font-mono text-sm h-96 resize-none"
            :class="{ 'border-destructive': jsonError }"
            @input="handleJsonInput"
          />
          <div v-if="jsonError" class="absolute bottom-2 right-2 text-xs text-destructive bg-destructive/10 px-2 py-1 rounded">
            JSON 格式错误
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧 YAML 区域 -->
    <div class="flex-1 flex flex-col">
      <div class="p-4 border-b border-border">
        <h3 class="text-lg font-semibold text-foreground">YAML 脚本</h3>
        <p class="text-sm text-muted-foreground">编辑 YAML 脚本，点击转换按钮生成 JSON</p>
      </div>
      
      <div class="flex-1 p-4">
        <div class="mb-4 flex gap-2">
          <Button @click="loadSampleYaml" variant="outline" size="sm" type="button">
            加载示例 YAML
          </Button>

          <Button @click="convertYamlToJson" variant="default" size="sm" type="button">
            转换为 JSON
          </Button>

        </div>
        
        <div class="relative">
          <Textarea
            :value="yamlInput"
            placeholder="请输入或粘贴 YAML 脚本..."
            class="font-mono text-sm h-96 resize-none"
            :class="{ 'border-destructive': yamlError }"
            @input="handleYamlInput"
          />
          <div v-if="yamlError" class="absolute bottom-2 right-2 text-xs text-destructive bg-destructive/10 px-2 py-1 rounded">
            YAML 格式错误
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { AnimationParser } from '@/lib/AnimationParser'
import { useToast } from '@/composables/useToast'

const { toast } = useToast()

// 响应式数据
const jsonInput = ref('')
const yamlInput = ref('')
const jsonError = ref(false)
const yamlError = ref(false)

// 示例 JSON 数据
const sampleJson = {
  media: "https://example.com/image.jpg",
  name: "测试分镜",
  description: "这是一个测试分镜",
  width: 1920,
  height: 1080,
  initialPosition: {
    pos: "100 200",
    scale: 1,
    opacity: 1,
    rotation: 0
  },
  animationSequences: [
    {
      id: "anim_1",
      name: "淡入动画",
      duration: 2000,
      easing: "easeInOut",
      keyframes: [
        {
          startTime: 0,
          duration: 1000,
          opacity: 0,
          scale: "0.8 0.8"
        },
        {
          startTime: 1000,
          duration: 1000,
          opacity: 1,
          scale: 1
        }
      ]
    }
  ]
}

// 示例 YAML 数据
const sampleYaml = `media: https://example.com/image.jpg
name: 测试分镜
description: 这是一个测试分镜
width: 1920
height: 1080
initialPosition:
  x: 100
  y: 200
  scaleX: 1
  scaleY: 1
  opacity: 1
  rotation: 0
animationSequences:
  - id: anim_1
    name: 淡入动画
    duration: 2000
    easing: easeInOut
    keyframes:
      - startTime: 0
        duration: 1000
        opacity: 0
        scaleX: 0.8
        scaleY: 0.8
      - startTime: 1000
        duration: 1000
        opacity: 1
        scaleX: 1
        scaleY: 1`

// 加载示例 JSON 数据
const loadSampleData = () => {
  jsonInput.value = JSON.stringify(sampleJson, null, 2)
  jsonError.value = false
  try {
    toast.success("已加载示例数据", "示例 JSON 数据已加载到左侧编辑器中")
  } catch (error) {
    console.error('Toast 错误:', error)
  }
}

// 加载示例 YAML 数据
const loadSampleYaml = () => {
  yamlInput.value = sampleYaml
  yamlError.value = false
  
  try {
    toast.success("已加载示例 YAML", "示例 YAML 脚本已加载到右侧编辑器中")
  } catch (error) {
    console.error('Toast 错误:', error)
  }
}

// 格式化 JSON
const formatJson = () => {
  try {
    const parsed = JSON.parse(jsonInput.value)
    jsonInput.value = JSON.stringify(parsed, null, 2)
    jsonError.value = false
    toast.success("JSON 格式化成功", "JSON 数据已格式化")
  } catch {
    jsonError.value = true
    toast.error("JSON 格式化失败", "请检查 JSON 格式是否正确")
  }
}



// 监听输入变化，清除错误状态
const clearJsonError = () => {
  if (jsonError.value) {
    jsonError.value = false
  }
}

const clearYamlError = () => {
  if (yamlError.value) {
    yamlError.value = false
  }
}

// 手动转换函数
const convertJsonToYaml = () => {
  if (!jsonInput.value.trim()) return
  
  try {
    const jsonData = JSON.parse(jsonInput.value)
    const yamlResult = AnimationParser.parseJsonToYaml(jsonData)
    if (yamlResult) {
      yamlInput.value = yamlResult
      yamlError.value = false
      jsonError.value = false
      toast.success("转换成功", "JSON 已成功转换为 YAML")
    }
  } catch {
    jsonError.value = true
    toast.error("转换失败", "请检查 JSON 格式是否正确")
  }
}

const convertYamlToJson = () => {
  if (!yamlInput.value.trim()) return
  
  try {
    const jsonResult = AnimationParser.parseYamlToJson(yamlInput.value)
    if (jsonResult && Object.keys(jsonResult).length > 0) {
      jsonInput.value = JSON.stringify(jsonResult, null, 2)
      yamlError.value = false
      jsonError.value = false
      toast.success("转换成功", "YAML 已成功转换为 JSON")
    }
  } catch {
    yamlError.value = true
    toast.error("转换失败", "请检查 YAML 格式是否正确")
  }
}

// 键盘输入事件处理
const handleJsonInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  if (target.value !== jsonInput.value) {
    jsonInput.value = target.value
    clearJsonError()
  }
}

const handleYamlInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  if (target.value !== yamlInput.value) {
    yamlInput.value = target.value
    clearYamlError()
  }
}
</script>

<style scoped>
/* 自定义滚动条样式 */
textarea::-webkit-scrollbar {
  width: 8px;
}

textarea::-webkit-scrollbar-track {
  background: hsl(var(--muted));
  border-radius: 4px;
}

textarea::-webkit-scrollbar-thumb {
  background: hsl(var(--muted-foreground));
  border-radius: 4px;
}

textarea::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground) / 0.8);
}
</style>
