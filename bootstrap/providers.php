<?php

return [
    App\Providers\AppServiceProvider::class,
    App\Providers\Filament\AdminPanelProvider::class,
    App\Providers\TelescopeServiceProvider::class,
    Overtrue\LaravelFilesystem\Qiniu\QiniuStorageServiceProvider::class,
];
