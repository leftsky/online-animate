declare module 'element-plus/es/locale/lang/zh-cn' {
    const zhCn: any;
    export default zhCn;
}

declare module 'element-plus' {
    import { App } from 'vue';

    interface ElementPlusOptions {
        locale?: any;
    }

    const ElementPlus: {
        install(app: App, options?: ElementPlusOptions): void;
    };

    export default ElementPlus;
}
