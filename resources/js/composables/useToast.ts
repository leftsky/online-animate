import { ref, readonly } from 'vue';

export interface Toast {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    description?: string;
    duration?: number;
}

const toasts = ref<Toast[]>([]);

let toastIdCounter = 0;

export function useToast() {
    const addToast = (toast: Omit<Toast, 'id'>) => {
        const id = `toast-${++toastIdCounter}`;
        const newToast: Toast = {
            id,
            duration: 5000,
            ...toast,
        };
        
        toasts.value.push(newToast);
        
        // 自动移除toast
        if (newToast.duration && newToast.duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, newToast.duration);
        }
        
        return id;
    };
    
    const removeToast = (id: string) => {
        const index = toasts.value.findIndex(toast => toast.id === id);
        if (index > -1) {
            toasts.value.splice(index, 1);
        }
    };
    
    const clearAllToasts = () => {
        toasts.value = [];
    };
    
    const toast = {
        success: (title: string, description?: string) => 
            addToast({ type: 'success', title, description }),
        
        error: (title: string, description?: string) => 
            addToast({ type: 'error', title, description }),
        
        warning: (title: string, description?: string) => 
            addToast({ type: 'warning', title, description }),
        
        info: (title: string, description?: string) => 
            addToast({ type: 'info', title, description }),
    };
    
    return {
        toast,
        toasts: readonly(toasts),
        removeToast,
        clearAllToasts,
    };
}
