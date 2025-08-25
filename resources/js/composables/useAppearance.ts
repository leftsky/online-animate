import { onMounted, ref } from 'vue';

type Appearance = 'light' | 'dark' | 'system';

export function updateTheme(value: Appearance) {
    if (value === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        document.documentElement.classList.toggle('dark', systemTheme === 'dark');
    } else {
        document.documentElement.classList.toggle('dark', value === 'dark');
    }

    // 新增：同步 Element Plus 主题
    updateElementPlusTheme(value);
}

function updateElementPlusTheme(value: Appearance) {
    const html = document.documentElement;

    if (value === 'dark') {
        html.classList.add('dark');
    } else if (value === 'light') {
        html.classList.remove('dark');
    } else {
        // system 模式，根据系统偏好自动切换
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        html.classList.toggle('dark', systemTheme === 'dark');
    }
}

const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

const handleSystemThemeChange = () => {
    const currentAppearance = localStorage.getItem('appearance') as Appearance | null;
    updateTheme(currentAppearance || 'system');
};

export function initializeTheme() {
    // Initialize theme from saved preference or default to system...
    const savedAppearance = localStorage.getItem('appearance') as Appearance | null;
    updateTheme(savedAppearance || 'system');

    // Set up system theme change listener...
    mediaQuery.addEventListener('change', handleSystemThemeChange);
}

export function useAppearance() {
    const appearance = ref<Appearance>('system');

    onMounted(() => {
        initializeTheme();

        const savedAppearance = localStorage.getItem('appearance') as Appearance | null;

        if (savedAppearance) {
            appearance.value = savedAppearance;
        }
    });

    function updateAppearance(value: Appearance) {
        appearance.value = value;
        localStorage.setItem('appearance', value);
        updateTheme(value);
    }

    return {
        appearance,
        updateAppearance,
    };
}
