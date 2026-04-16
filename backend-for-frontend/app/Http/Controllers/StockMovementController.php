<?php

namespace App\Http\Controllers;

use App\Models\StockMovement;
use Illuminate\Http\Request;

class StockMovementController extends Controller
{
    public function index()
    {
        $movements = StockMovement::with(['stock.stockItem', 'order'])
            ->latest()
            ->get();

        return response()->json($movements);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'stock_id' => 'required|exists:stocks,id',
            'type' => 'required|in:sale,cancel,restock,adjustment',
            'quantity' => 'required|numeric',
            'before' => 'required|numeric',
            'after' => 'required|numeric',
            'order_id' => 'nullable|exists:orders,id'
        ]);

        $movement = StockMovement::create($validated);

        return response()->json($movement, 201);
    }

    public function show(StockMovement $stockMovement)
    {
        return response()->json(
            $stockMovement->load(['stock.stockItem', 'order'])
        );
    }

    public function update(Request $request, StockMovement $stockMovement)
    {
        $validated = $request->validate([
            'type' => 'in:sale,cancel,restock,adjustment',
            'quantity' => 'numeric',
            'before' => 'numeric',
            'after' => 'numeric',
        ]);

        $stockMovement->update($validated);

        return response()->json($stockMovement);
    }

    public function destroy(StockMovement $stockMovement)
    {
        $stockMovement->delete();

        return response()->json([
            'message' => 'Stock movement deleted'
        ]);
    }
}