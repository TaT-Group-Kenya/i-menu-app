<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'message' => 'i-menu API is running',
        'version' => '1.0',
        'endpoints' => [
            'login' => '/api/login',
            'register' => '/api/register',
        ]
    ]);
});