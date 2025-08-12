<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{{ options.title }}</DialogTitle>
        <DialogDescription>
          {{ options.message }}
        </DialogDescription>
      </DialogHeader>
      
      <DialogFooter>
        <Button variant="outline" @click="handleCancel">
          {{ options.cancelText }}
        </Button>
        <Button 
          :variant="options.variant === 'destructive' ? 'destructive' : 'default'"
          @click="handleConfirm"
        >
          {{ options.confirmText }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { useConfirm } from '@/composables/useConfirm';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const { isOpen, options, handleConfirm, handleCancel } = useConfirm();
</script>
