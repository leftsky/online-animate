export interface UploadOptions {
    type?: 'image' | 'document' | 'video' | 'audio';
    folder?: string;
    accept?: string;
    maxSize?: number; // MB
    multiple?: boolean;
}

// 使用 ApiResponse 类型，不再需要单独的 UploadResult
export type UploadResult = ApiResponse;

export interface BatchUploadResult {
    success: boolean;
    message: string;
    data?: {
        uploaded: UploadResult['data'][];
        errors: Array<{
            index: number;
            filename: string;
            error: string;
        }>;
    };
}

import { uploadApi, type ApiResponse } from './api';

/**
 * 单文件上传（直接使用 API）
 * @deprecated 直接使用 uploadApi.uploadFile() 代替
 */
export const uploadFile = uploadApi.uploadFile;

/**
 * 文件选择器
 */
export function selectFiles(options: UploadOptions = {}): Promise<File[]> {
    return new Promise((resolve, reject) => {
        const { accept = 'image/*', multiple = false } = options;

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = accept;
        input.multiple = multiple;

        input.onchange = (e: Event) => {
            const files = Array.from((e.target as HTMLInputElement).files || []);
            if (files.length > 0) {
                resolve(files);
            } else {
                reject(new Error('未选择文件'));
            }
        };

        input.oncancel = () => {
            reject(new Error('用户取消选择'));
        };

        input.click();
    });
}

/**
 * 便捷的图片上传方法
 */
export async function uploadImage(options: Omit<UploadOptions, 'type'> = {}): Promise<UploadResult> {
    try {
        const files = await selectFiles({
            ...options,
            accept: 'image/*',
            multiple: false,
        });

        return await uploadApi.uploadFile(files[0], {
            ...options,
            type: 'image',
        });
    } catch (error) {
        return {
            success: false,
            code: 500,
            message: error instanceof Error ? error.message : '图片上传失败',
        };
    }
}

/**
 * 文件大小格式化
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 验证文件类型
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.some((type) => {
        if (type.includes('*')) {
            const baseType = type.split('/')[0];
            return file.type.startsWith(baseType + '/');
        }
        return file.type === type;
    });
}

/**
 * 验证文件大小
 */
export function validateFileSize(file: File, maxSizeMB: number): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
}
