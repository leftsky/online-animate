import { readonly, ref } from 'vue';

export interface ConfirmOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
}

const isOpen = ref(false);
const options = ref<ConfirmOptions>({
    title: '',
    message: '',
    confirmText: '确认',
    cancelText: '取消',
    variant: 'default',
});

let resolvePromise: ((value: boolean) => void) | null = null;

export function useConfirm() {
    const confirm = (opts: ConfirmOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            options.value = {
                confirmText: '确认',
                cancelText: '取消',
                variant: 'default',
                ...opts,
            };

            resolvePromise = resolve;
            isOpen.value = true;
        });
    };

    const handleConfirm = () => {
        isOpen.value = false;
        if (resolvePromise) {
            resolvePromise(true);
            resolvePromise = null;
        }
    };

    const handleCancel = () => {
        isOpen.value = false;
        if (resolvePromise) {
            resolvePromise(false);
            resolvePromise = null;
        }
    };

    return {
        confirm,
        isOpen: readonly(isOpen),
        options: readonly(options),
        handleConfirm,
        handleCancel,
    };
}
