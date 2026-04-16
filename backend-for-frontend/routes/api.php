<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\StockItemController;
use App\Http\Controllers\StockController;
use App\Http\Controllers\OrderItemController;
use App\Http\Controllers\MenuIngredientController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\MenuController;
use App\Http\Controllers\StockMovementController;


/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

Route::post('/login', [AuthController::class, 'login']);


/*
|--------------------------------------------------------------------------
| Protected Routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);

    /*
    |--------------------------------------------------------------------------
    | USERS
    |--------------------------------------------------------------------------
    */
    Route::apiResource('users', UserController::class);

    /*
    |--------------------------------------------------------------------------
    | STOCK MANAGEMENT
    |--------------------------------------------------------------------------
    */
    Route::apiResource('stock-items', StockItemController::class);
    Route::apiResource('stocks', StockController::class);
    Route::apiResource('stock-movements', StockMovementController::class);

    /*
    |--------------------------------------------------------------------------
    | MENU MANAGEMENT
    |--------------------------------------------------------------------------
    */

    // Standard CRUD
    Route::apiResource('menus', MenuController::class);

    // 🔥 Ingredients endpoint (must be AFTER apiResource menus)
    Route::get('/menus/{id}/ingredients', [MenuController::class, 'ingredients']);

    // Recipe management
    Route::apiResource('menu-ingredients', MenuIngredientController::class);

    /*
    |--------------------------------------------------------------------------
    | ORDERS
    |--------------------------------------------------------------------------
    */

    // Core order routes
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::post('/orders', [OrderController::class, 'store']);

    // Custom order actions
    Route::post('/orders/{id}/pay', [OrderController::class, 'markAsPaid']);
    Route::post('/orders/{id}/cancel', [OrderController::class, 'cancel']);

    // Order items
    Route::apiResource('order-items', OrderItemController::class);
});