import axios from 'axios';

// API响应类型定义
export interface ApiResponse<T = any> {
    success: boolean;
    code: number;
    message: string;
    data: T;
}

// 分页响应类型
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        has_more: boolean;
    };
}

// 搜索参数
export interface SearchParams {
    limit?: number;
    offset?: number;
    search?: string;
    category?: string;
    status?: string;
    gender?: string; // 仅用于人物
    type?: string; // 仅用于物品
}

// 媒体资源类型定义
export interface MediaScenario {
    id: string;
    user_id: number;
    name: string;
    image_path?: string;
    description?: string;
    generation_prompt?: string;
    category?: string;
    tags: string[];
    status: number;
    created_at: string;
    updated_at: string;
}

export interface MediaCharacter {
    id: string;
    user_id: number;
    name: string;
    gender: number;
    age?: number;
    image_path?: string;
    additional_resources: any;
    description?: string;
    personality?: string;
    occupation?: string;
    category?: string;
    tags: string[];
    status: number;
    created_at: string;
    updated_at: string;
}

export interface MediaItem {
    id: string;
    user_id: number;
    name: string;
    image_path?: string;
    description?: string;
    generation_prompt?: string;
    category?: string;
    type?: string;
    properties: any[];
    tags: string[];
    status: number;
    created_at: string;
    updated_at: string;
}

export interface MediaFile {
    id: string;
    name: string;
    filename: string;
    path: string;
    url: string;
    size: number;
    mime_type: string;
    extension: string;
    type: string;
    resource_id?: number;
    user_id: number;
    uploaded_at: string;
}

// API服务类
class MediaApiService {
    private baseUrl = '/web/api';

    // 场景相关API
    async getScenarios(params: SearchParams = {}): Promise<PaginatedResponse<MediaScenario>> {
        const response = await axios.get(`${this.baseUrl}/media_scenarios`, { params });
        return response.data.data; // 返回包含分页信息的对象
    }

    async createScenario(data: Partial<MediaScenario>): Promise<ApiResponse<MediaScenario>> {
        const response = await axios.post(`${this.baseUrl}/media_scenarios`, data);
        return response.data;
    }

    async getScenario(id: string): Promise<ApiResponse<MediaScenario>> {
        const response = await axios.get(`${this.baseUrl}/media_scenarios/${id}`);
        return response.data;
    }

    async updateScenario(id: string, data: Partial<MediaScenario>): Promise<ApiResponse<MediaScenario>> {
        const response = await axios.put(`${this.baseUrl}/media_scenarios/${id}`, data);
        return response.data;
    }

    async deleteScenario(id: string): Promise<ApiResponse<void>> {
        const response = await axios.delete(`${this.baseUrl}/media_scenarios/${id}`);
        return response.data;
    }

    // 人物相关API
    async getCharacters(params: SearchParams = {}): Promise<PaginatedResponse<MediaCharacter>> {
        const response = await axios.get(`${this.baseUrl}/media_characters`, { params });
        return response.data.data; // 返回包含分页信息的对象
    }

    async createCharacter(data: Partial<MediaCharacter>): Promise<ApiResponse<MediaCharacter>> {
        const response = await axios.post(`${this.baseUrl}/media_characters`, data);
        return response.data;
    }

    async getCharacter(id: string): Promise<ApiResponse<MediaCharacter>> {
        const response = await axios.get(`${this.baseUrl}/media_characters/${id}`);
        return response.data;
    }

    async updateCharacter(id: string, data: Partial<MediaCharacter>): Promise<ApiResponse<MediaCharacter>> {
        const response = await axios.put(`${this.baseUrl}/media_characters/${id}`, data);
        return response.data;
    }

    async deleteCharacter(id: string): Promise<ApiResponse<void>> {
        const response = await axios.delete(`${this.baseUrl}/media_characters/${id}`);
        return response.data;
    }

    // 物品相关API
    async getItems(params: SearchParams = {}): Promise<PaginatedResponse<MediaItem>> {
        const response = await axios.get(`${this.baseUrl}/media_items`, { params });
        return response.data.data; // 返回包含分页信息的对象
    }

    async createItem(data: Partial<MediaItem>): Promise<ApiResponse<MediaItem>> {
        const response = await axios.post(`${this.baseUrl}/media_items`, data);
        return response.data;
    }

    async getItem(id: string): Promise<ApiResponse<MediaItem>> {
        const response = await axios.get(`${this.baseUrl}/media_items/${id}`);
        return response.data;
    }

    async updateItem(id: string, data: Partial<MediaItem>): Promise<ApiResponse<MediaItem>> {
        const response = await axios.put(`${this.baseUrl}/media_items/${id}`, data);
        return response.data;
    }

    async deleteItem(id: string): Promise<ApiResponse<void>> {
        const response = await axios.delete(`${this.baseUrl}/media_items/${id}`);
        return response.data;
    }

    // 文件相关API - 已移除，统一使用UploadController
    // 批量上传和删除文件功能通过前端循环调用单文件上传接口实现
}

// 导出单例实例
export const mediaApi = new MediaApiService();
