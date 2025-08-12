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
    return Inertia::render('Storyboard');
})->middleware(['auth', 'verified'])->name('storyboard');

// 包含 API 路由
require __DIR__.'/api.php';

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
