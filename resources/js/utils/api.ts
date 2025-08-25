/**
 * Web API 工具类
 * 统一管理前端 AJAX 调用 - 基于 Axios
 */

import { AnimationParser } from '@/lib/AnimationParser';
import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';

export interface ApiResponse<T = any> {
    success: boolean;
    code: number;
    message: string;
    data?: T;
    errors?: any;
}

export interface AppConfig {
    app_name: string;
    upload_max_size: string;
    supported_image_types: string[];
    supported_video_types: string[];
    supported_audio_types: string[];
    supported_document_types: string[];
}

// 配置 axios 实例
const apiClient = axios.create({
    baseURL: '/web/api',
    timeout: 300000,
    headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
});

// 请求拦截器 - 添加认证信息
apiClient.interceptors.request.use(
    (config) => {
        // API路由不需要CSRF token，使用session认证
        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

// 响应拦截器 - 统一处理响应
apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        return response.data;
    },
    (error) => {
        const response: ApiResponse = {
            success: false,
            code: error.response?.status || 500,
            message: error.response?.data?.message || error.message || '请求失败',
        };

        if (error.response?.data?.errors) {
            response.errors = error.response.data.errors;
        }

        return Promise.resolve(response);
    },
);

/**
 * GET 请求
 */
export async function apiGet<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return apiClient.get(url, config);
}

/**
 * POST 请求
 */
export async function apiPost<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return apiClient.post(url, data, config);
}

/**
 * PUT 请求
 */
export async function apiPut<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return apiClient.put(url, data, config);
}

/**
 * DELETE 请求
 */
export async function apiDelete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return apiClient.delete(url, config);
}

/**
 * 配置相关 API
 */
export const configApi = {
    /**
     * 获取应用配置
     */
    getAppConfig(): Promise<ApiResponse<AppConfig>> {
        return apiGet<AppConfig>('/config');
    },
};

/**
 * 文件上传相关 API
 */
export const uploadApi = {
    /**
     * 单文件上传
     */
    uploadFile(file: File, options: { folder?: string } = {}): Promise<ApiResponse> {
        const formData = new FormData();
        formData.append('file', file);
        if (options.folder) formData.append('folder', options.folder);

        return apiPost('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
};

/**
 * 媒体资源相关 API
 */
export const mediaApi = {
    /**
     * 获取场景列表
     */
    getScenarios(
        params: {
            limit?: number;
            offset?: number;
            search?: string;
            category?: string;
            status?: number;
        } = {},
    ): Promise<ApiResponse> {
        const queryParams = new URLSearchParams();
        if (params.limit) queryParams.append('limit', String(params.limit));
        if (params.offset) queryParams.append('offset', String(params.offset));
        if (params.search) queryParams.append('search', params.search);
        if (params.category) queryParams.append('category', params.category);
        if (params.status !== undefined) queryParams.append('status', String(params.status));

        const url = `/media_scenarios${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        return apiGet(url);
    },

    /**
     * 创建场景
     */
    createScenario(data: {
        name: string;
        description?: string;
        image_path?: string;
        generation_prompt?: string;
        category?: string;
        tags?: string[];
    }): Promise<ApiResponse> {
        return apiPost('/media_scenarios', data);
    },

    /**
     * 更新场景
     */
    updateScenario(
        id: string | number,
        data: {
            name?: string;
            description?: string;
            image_path?: string;
            generation_prompt?: string;
            category?: string;
            tags?: string[];
        },
    ): Promise<ApiResponse> {
        return apiPut(`/media_scenarios/${id}`, data);
    },

    /**
     * 删除场景
     */
    deleteScenario(id: string | number): Promise<ApiResponse> {
        return apiDelete(`/media_scenarios/${id}`);
    },

    /**
     * 获取人物列表
     */
    getCharacters(
        params: {
            limit?: number;
            offset?: number;
            search?: string;
            category?: string;
            status?: number;
            gender?: number;
        } = {},
    ): Promise<ApiResponse> {
        const queryParams = new URLSearchParams();
        if (params.limit) queryParams.append('limit', String(params.limit));
        if (params.offset) queryParams.append('offset', String(params.offset));
        if (params.search) queryParams.append('search', params.search);
        if (params.category) queryParams.append('category', params.category);
        if (params.status !== undefined) queryParams.append('status', String(params.status));
        if (params.gender !== undefined) queryParams.append('gender', String(params.gender));

        const url = `/media_characters${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        return apiGet(url);
    },

    /**
     * 创建人物
     */
    createCharacter(data: {
        name: string;
        description?: string;
        gender?: number;
        age?: number;
        image_path?: string;
        additional_resources?: string;
        personality?: string;
        occupation?: string;
        tags?: string[];
    }): Promise<ApiResponse> {
        return apiPost('/media_characters', data);
    },

    /**
     * 更新人物
     */
    updateCharacter(
        id: string | number,
        data: {
            name?: string;
            description?: string;
            gender?: number;
            age?: number;
            image_path?: string;
            additional_resources?: any;
            personality?: string;
            occupation?: string;
            tags?: string[];
        },
    ): Promise<ApiResponse> {
        return apiPut(`/media_characters/${id}`, data);
    },

    /**
     * 删除人物
     */
    deleteCharacter(id: string | number): Promise<ApiResponse> {
        return apiDelete(`/media_characters/${id}`);
    },

    /**
     * 获取物品列表
     */
    getItems(
        params: {
            limit?: number;
            offset?: number;
            search?: string;
            category?: string;
            status?: number;
            type?: string;
        } = {},
    ): Promise<ApiResponse> {
        const queryParams = new URLSearchParams();
        if (params.limit) queryParams.append('limit', String(params.limit));
        if (params.offset) queryParams.append('offset', String(params.offset));
        if (params.search) queryParams.append('search', params.search);
        if (params.category) queryParams.append('category', params.category);
        if (params.status !== undefined) queryParams.append('status', String(params.status));
        if (params.type) queryParams.append('type', params.type);

        const url = `/media_items${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        return apiGet(url);
    },

    /**
     * 创建物品
     */
    createItem(data: {
        name: string;
        description?: string;
        image_path?: string;
        generation_prompt?: string;
        category?: string;
        type?: string;
        properties?: any[];
        tags?: string[];
    }): Promise<ApiResponse> {
        return apiPost('/media_items', data);
    },

    /**
     * 更新物品
     */
    updateItem(
        id: string | number,
        data: {
            name?: string;
            description?: string;
            image_path?: string;
            generation_prompt?: string;
            category?: string;
            type?: string;
            properties?: any[];
            tags?: string[];
        },
    ): Promise<ApiResponse> {
        return apiPut(`/media_items/${id}`, data);
    },

    /**
     * 删除物品
     */
    deleteItem(id: string | number): Promise<ApiResponse> {
        return apiDelete(`/media_items/${id}`);
    },
};

/**
 * 分镜内容相关 API
 */
export const sceneContentApi = {
    /**
     * 获取分镜内容列表
     */
    getList(
        params: {
            scene_id?: number | null;
            element_type?: string;
            status?: number;
            limit?: number;
            offset?: number;
        } = {},
    ): Promise<ApiResponse> {
        const queryParams = new URLSearchParams();

        if (params.scene_id !== undefined) {
            queryParams.append('scene_id', params.scene_id === null ? 'null' : String(params.scene_id));
        }
        if (params.element_type) queryParams.append('element_type', params.element_type);
        if (params.status !== undefined) queryParams.append('status', String(params.status));
        if (params.limit) queryParams.append('limit', String(params.limit));
        if (params.offset) queryParams.append('offset', String(params.offset));

        const url = `/scene_contents${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

        return apiGet(url).then((response) => {
            // 如果请求成功且有数据，处理 YAML 脚本
            if (response.success && response.data && Array.isArray(response.data)) {
                const processedData = response.data.map((item) => {
                    if (item.animation_script) {
                        try {
                            // 使用 AnimationParser 解析 YAML 脚本
                            const parsed = AnimationParser.parseYamlToJson(item.animation_script);

                            // 添加 media 和 zindex 字段
                            if (parsed) {
                                parsed.media = item.element_source || '';
                                parsed.zindex = item.layer_order || 0;

                                // 转换回 YAML
                                const updatedScript = AnimationParser.parseJsonToYaml(parsed);

                                return {
                                    ...item,
                                    animation_script: updatedScript,
                                };
                            }
                        } catch (error) {
                            console.warn('解析 YAML 脚本失败:', error);
                        }
                    }
                    return item;
                });

                return {
                    ...response,
                    data: processedData,
                };
            }

            return response;
        });
    },

    /**
     * 创建分镜内容
     */
    create(data: {
        scene_id?: number | null;
        element_name: string;
        element_type: string;
        element_source?: string;
        animation_script?: string;
        layer_order?: number;
        status?: number;
    }): Promise<ApiResponse> {
        return apiPost('/scene_contents', data);
    },

    /**
     * 获取分镜内容详情
     */
    get(id: number): Promise<ApiResponse> {
        return apiGet(`/scene_contents/${id}`);
    },

    /**
     * 更新分镜内容
     */
    update(
        id: number,
        data: {
            element_name?: string;
            element_type?: string;
            element_source?: string;
            animation_script?: string;
            layer_order?: number;
            status?: number;
        },
    ): Promise<ApiResponse> {
        return apiPut(`/scene_contents/${id}`, data);
    },

    /**
     * 删除分镜内容
     */
    delete(id: number): Promise<ApiResponse> {
        return apiDelete(`/scene_contents/${id}`);
    },

    /**
     * 重新排序分镜内容
     */
    reorder(data: { scene_id: number; dragged_id: number; target_id?: number | null }): Promise<ApiResponse> {
        return apiPost('/scene_contents/reorder', data);
    },
};

/**
 * 错误处理工具
 */
export const apiUtils = {
    /**
     * 检查 API 响应是否成功
     */
    isSuccess<T>(response: ApiResponse<T>): response is ApiResponse<T> & { data: T } {
        return response.success === true;
    },

    /**
     * 获取错误消息
     */
    getErrorMessage(response: ApiResponse): string {
        return response.message || '操作失败';
    },

    /**
     * 显示成功消息（可以集成 toast 组件）
     */
    showSuccess(message: string): void {
        console.log('✅ 成功:', message);
        // 这里可以集成 toast 组件
    },

    /**
     * 显示错误消息（可以集成 toast 组件）
     */
    showError(message: string): void {
        console.error('❌ 错误:', message);
        // 这里可以集成 toast 组件
    },

    /**
     * 处理 API 响应
     */
    async handleResponse<T>(
        responsePromise: Promise<ApiResponse<T>>,
        options: {
            successMessage?: string;
            showSuccessToast?: boolean;
            showErrorToast?: boolean;
        } = {},
    ): Promise<T | null> {
        const { successMessage, showSuccessToast = false, showErrorToast = true } = options;

        try {
            const response = await responsePromise;

            if (this.isSuccess(response)) {
                if (showSuccessToast && successMessage) {
                    this.showSuccess(successMessage);
                }
                return response.data;
            } else {
                if (showErrorToast) {
                    this.showError(this.getErrorMessage(response));
                }
                return null;
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : '请求失败';
            if (showErrorToast) {
                this.showError(message);
            }
            return null;
        }
    },
};

/**
 * 默认导出，包含所有 API
 */
export default {
    config: configApi,
    upload: uploadApi,
    media: mediaApi,
    sceneContent: sceneContentApi,
    utils: apiUtils,
    // 直接方法
    get: apiGet,
    post: apiPost,
    put: apiPut,
    delete: apiDelete,
    // axios 实例
    client: apiClient,
};
