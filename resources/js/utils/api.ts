/**
 * Web API 工具类
 * 统一管理前端 AJAX 调用 - 基于 Axios
 */

import axios, { type AxiosResponse, type AxiosRequestConfig } from 'axios';

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
    timeout: 30000,
    headers: {
        'Accept': 'application/json',
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
    }
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
    }
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
export async function apiPost<T = any>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
    return apiClient.post(url, data, config);
}

/**
 * PUT 请求
 */
export async function apiPut<T = any>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
    return apiClient.put(url, data, config);
}

/**
 * DELETE 请求
 */
export async function apiDelete<T = any>(
    url: string, 
    config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
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
    uploadFile(file: File, options: { type?: string; folder?: string } = {}): Promise<ApiResponse> {
        const formData = new FormData();
        formData.append('file', file);
        if (options.type) formData.append('type', options.type);
        if (options.folder) formData.append('folder', options.folder);
        
        return apiPost('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
};

/**
 * 分镜内容相关 API
 */
export const sceneContentApi = {
    /**
     * 获取分镜内容列表
     */
    getList(params: { 
        scene_id?: number | null; 
        element_type?: string; 
        status?: number;
        limit?: number;
        offset?: number;
    } = {}): Promise<ApiResponse> {
        const queryParams = new URLSearchParams();
        
        if (params.scene_id !== undefined) {
            queryParams.append('scene_id', params.scene_id === null ? 'null' : String(params.scene_id));
        }
        if (params.element_type) queryParams.append('element_type', params.element_type);
        if (params.status !== undefined) queryParams.append('status', String(params.status));
        if (params.limit) queryParams.append('limit', String(params.limit));
        if (params.offset) queryParams.append('offset', String(params.offset));
        
        const url = `/scene-contents${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        return apiGet(url);
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
        return apiPost('/scene-contents', data);
    },

    /**
     * 获取分镜内容详情
     */
    get(id: number): Promise<ApiResponse> {
        return apiGet(`/scene-contents/${id}`);
    },

    /**
     * 更新分镜内容
     */
    update(id: number, data: {
        element_name?: string;
        element_type?: string;
        element_source?: string;
        animation_script?: string;
        layer_order?: number;
        status?: number;
    }): Promise<ApiResponse> {
        return apiPut(`/scene-contents/${id}`, data);
    },

    /**
     * 删除分镜内容
     */
    delete(id: number): Promise<ApiResponse> {
        return apiDelete(`/scene-contents/${id}`);
    },

    /**
     * 重新排序分镜内容
     */
    reorder(data: {
        scene_id: number;
        dragged_id: number;
        target_id?: number | null;
    }): Promise<ApiResponse> {
        return apiPost('/scene-contents/reorder', data);
    }
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
        } = {}
    ): Promise<T | null> {
        const {
            successMessage,
            showSuccessToast = false,
            showErrorToast = true
        } = options;

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
    }
};

/**
 * 默认导出，包含所有 API
 */
export default {
    config: configApi,
    upload: uploadApi,
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
