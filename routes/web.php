<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome');
})->name('home');

Route::get('dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::get('storyboard', function () {
    return Inertia::render('storyboard/Storyboard');
})->middleware(['auth', 'verified'])->name('storyboard');

Route::get('resource-library', function () {
    return Inertia::render('storyboard/resourcesctl/ResourceLibrary');
})->middleware(['auth', 'verified'])->name('resource-library');

Route::get('character-library', function () {
    return Inertia::render('storyboard/resourcesctl/CharacterLibrary');
})->middleware(['auth', 'verified'])->name('character-library');

Route::get('character-animation-debug', function () {
    return Inertia::render('storyboard/resourcesctl/CharacterAnimationDebug');
})->middleware(['auth', 'verified'])->name('character-animation-debug');

Route::get('novel-management', function () {
    return Inertia::render('novel/NovelManagement');
})->middleware(['auth', 'verified'])->name('novel-management');

Route::get('video-management', function () {
    return Inertia::render('video/VideoManagement');
})->middleware(['auth', 'verified'])->name('video-management');

Route::get('scene-management', function () {
    return Inertia::render('scene/SceneManagement');
})->middleware(['auth', 'verified'])->name('scene-management');


// 包含 API 路由
require __DIR__ . '/api.php';

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
