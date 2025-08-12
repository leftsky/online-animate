<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

/**
 * Web API 基础控制器
 * 用于前端 AJAX 调用的基础功能
 */
abstract class WebApiController extends Controller
{
    /**
     * 成功响应
     *
     * @param mixed $data
     * @param string $message
     * @param int $code
     * @return JsonResponse
     */
    protected function success($data = null, string $message = '操作成功', int $code = 200): JsonResponse
    {
        $response = [
            'success' => true,
            'code' => $code,
            'message' => $message,
        ];

        if ($data !== null) {
            $response['data'] = $data;
        }

        return response()->json($response, $code);
    }

    /**
     * 错误响应
     *
     * @param string $message
     * @param int $code
     * @param mixed $errors
     * @return JsonResponse
     */
    protected function error(string $message = '操作失败', int $code = 400, $errors = null): JsonResponse
    {
        $response = [
            'success' => false,
            'code' => $code,
            'message' => $message,
        ];

        if ($errors !== null) {
            $response['errors'] = $errors;
        }

        return response()->json($response, $code);
    }

    /**
     * 验证失败响应
     *
     * @param mixed $errors
     * @return JsonResponse
     */
    protected function validationError($errors): JsonResponse
    {
        return $this->error('验证失败', 422, $errors);
    }

    /**
     * 未找到资源响应
     *
     * @param string $message
     * @return JsonResponse
     */
    protected function notFound(string $message = '资源未找到'): JsonResponse
    {
        return $this->error($message, 404);
    }

    /**
     * 未授权响应
     *
     * @param string $message
     * @return JsonResponse
     */
    protected function unauthorized(string $message = '未授权访问'): JsonResponse
    {
        return $this->error($message, 401);
    }

    /**
     * 服务器错误响应
     *
     * @param string $message
     * @return JsonResponse
     */
    protected function serverError(string $message = '服务器内部错误'): JsonResponse
    {
        return $this->error($message, 500);
    }
}
