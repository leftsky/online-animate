<template>
  <div
    class="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
    :class="{ 'bg-accent text-accent-foreground': isSelected }"
    @click="select"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  value: any;
  isSelected?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false
});

const emit = defineEmits<{
  select: [value: any];
}>();

const select = () => {
  emit('select', props.value);
};
</script>
