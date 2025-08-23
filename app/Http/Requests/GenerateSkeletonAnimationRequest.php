<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * 生成骨骼动画请求验证类
 */
class GenerateSkeletonAnimationRequest extends FormRequest
{
    /**
     * 确定用户是否有权限进行此请求
     *
     * @return bool
     */
    public function authorize(): bool
    {
        return true; // 所有已认证用户都可以访问
    }

    /**
     * 获取应用于请求的验证规则
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'text' => 'required|string|min:3|max:500',
            'duration' => 'nullable|numeric|min:0.1|max:60.0',
            'loop' => 'nullable|boolean',
            'speed' => 'nullable|numeric|min:0.1|max:5.0',
            'intensity' => 'nullable|numeric|min:0.1|max:3.0',
            'direction' => 'nullable|string|in:forward,backward,left,right,up,down',
            'style' => 'nullable|string|in:normal,exaggerated,subtle,realistic,stylized',
            'scale' => 'nullable|numeric|min:0.1|max:5.0',
            'easing' => 'nullable|string|in:linear,ease-in,ease-out,ease-in-out,bounce,elastic',
            'character_id' => 'nullable|integer|exists:media_characters,id',
            'scene_id' => 'nullable|integer|exists:media_scenarios,id'
        ];
    }

    /**
     * 获取验证错误的自定义属性名称
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'text' => '自然语言描述',
            'duration' => '动画时长',
            'loop' => '循环播放',
            'speed' => '动画速度',
            'intensity' => '动作强度',
            'direction' => '动作方向',
            'style' => '动画风格',
            'scale' => '缩放比例',
            'easing' => '缓动函数',
            'character_id' => '角色ID',
            'scene_id' => '场景ID'
        ];
    }

    /**
     * 获取验证错误的自定义消息
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'text.required' => '请输入动作描述',
            'text.min' => '动作描述至少需要3个字符',
            'text.max' => '动作描述不能超过500个字符',
            'duration.min' => '动画时长不能少于0.1秒',
            'duration.max' => '动画时长不能超过60秒',
            'speed.min' => '动画速度不能低于0.1',
            'speed.max' => '动画速度不能超过5.0',
            'intensity.min' => '动作强度不能低于0.1',
            'intensity.max' => '动作强度不能超过3.0',
            'scale.min' => '缩放比例不能低于0.1',
            'scale.max' => '缩放比例不能超过5.0',
            'direction.in' => '无效的动作方向',
            'style.in' => '无效的动画风格',
            'easing.in' => '无效的缓动函数',
            'character_id.exists' => '指定的角色不存在',
            'scene_id.exists' => '指定的场景不存在'
        ];
    }

    /**
     * 准备验证数据
     *
     * @return void
     */
    protected function prepareForValidation(): void
    {
        // 清理和标准化输入数据
        if ($this->has('text')) {
            $this->merge([
                'text' => trim($this->text)
            ]);
        }

        // 确保数值字段为浮点数
        $numericFields = ['duration', 'speed', 'intensity', 'scale'];
        foreach ($numericFields as $field) {
            if ($this->has($field) && is_numeric($this->$field)) {
                $this->merge([
                    $field => (float) $this->$field
                ]);
            }
        }

        // 确保布尔字段为布尔值
        if ($this->has('loop')) {
            $this->merge([
                'loop' => filter_var($this->loop, FILTER_VALIDATE_BOOLEAN)
            ]);
        }
    }

    /**
     * 获取验证后的数据
     *
     * @return array
     */
    public function validated($key = null, $default = null): array
    {
        $validated = parent::validated($key, $default);

        // 设置默认值
        $defaults = [
            'duration' => 2.0,
            'loop' => true,
            'speed' => 1.0,
            'intensity' => 1.0,
            'direction' => 'forward',
            'style' => 'normal',
            'scale' => 1.0,
            'easing' => 'ease-in-out'
        ];

        foreach ($defaults as $key => $defaultValue) {
            if (!isset($validated[$key])) {
                $validated[$key] = $defaultValue;
            }
        }

        return $validated;
    }
}
