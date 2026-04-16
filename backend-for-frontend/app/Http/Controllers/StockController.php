<?php

namespace App\Http\Controllers;

use App\Models\Stock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockController extends Controller
{
    /**
     * List all stocks
     */
    public function index()
    {
        $stocks = Stock::with('stockItem')->get();

        return response()->json($stocks);
    }

    /**
     * Create stock
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'stock_item_id' => 'required|exists:stock_items,id|unique:stocks,stock_item_id',
            'quantity' => 'required|numeric|min:0',
            'stock_warning_count' => 'required|integer|min:0',
            'stock_duration_forecast_day' => 'nullable|integer|min:0'
        ]);

        return DB::transaction(function () use ($validated) {

            $validated['created_by'] = auth()->id();
            $validated['updated_by'] = auth()->id();

            $stock = Stock::create($validated);

            return response()->json(
                $stock->load('stockItem'),
                201
            );
        });
    }

    /**
     * Show single stock
     */
    public function show(Stock $stock)
    {
        return response()->json(
            $stock->load('stockItem')
        );
    }

    /**
     * Update stock
     */
    public function update(Request $request, Stock $stock)
    {
        $validated = $request->validate([
            'quantity' => 'required|numeric|min:0',
            'stock_warning_count' => 'required|integer|min:0',
            'stock_duration_forecast_day' => 'nullable|integer|min:0'
        ]);

        return DB::transaction(function () use ($stock, $validated) {

            $validated['updated_by'] = auth()->id();

            $stock->update($validated);

            return response()->json(
                $stock->load('stockItem')
            );
        });
    }

    /**
     * Delete stock
     */
    public function destroy(Stock $stock)
    {
        return DB::transaction(function () use ($stock) {

            $stock->delete();

            return response()->json([
                'message' => 'Stock deleted successfully'
            ]);
        });
    }
}