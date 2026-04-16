<?php

namespace App\Http\Controllers;

use App\Models\StockItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class StockItemController extends Controller
{
    /**
     * Display a listing of stock items.
     */
    public function index()
    {
        try {
            $stockItems = StockItem::with([
                'stock',
                'creator',
                'updater'
            ])->get();

            return response()->json([
                'message' => 'Stock items retrieved successfully',
                'data' => $stockItems
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'message' => 'Failed to fetch stock items',
                'errors' => [$e->getMessage()]
            ], 500);
        }
    }

    /**
     * Store a newly created stock item.
     */
    public function store(Request $request)
    {
        try {

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255|unique:stock_items,name',
                'unit_of_measure' => 'required|in:GRAMS,MILLILITERS,TOKENS,BAGS,NUMBER',
                'unit_cost' => 'required|numeric|min:0',
                'currency' => 'required|string|max:10'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $validator->validated();

            $data['created_by'] = auth()->id();
            $data['updated_by'] = auth()->id();

            $stockItem = StockItem::create($data);

            return response()->json([
                'message' => 'Stock item created successfully',
                'data' => $stockItem->load(['stock', 'creator', 'updater'])
            ], 201);

        } catch (\Exception $e) {

            return response()->json([
                'message' => 'Failed to create stock item',
                'errors' => [$e->getMessage()]
            ], 500);
        }
    }

    /**
     * Display the specified stock item.
     */
    public function show(StockItem $stockItem)
    {
        try {

            return response()->json([
                'message' => 'Stock item retrieved successfully',
                'data' => $stockItem->load(['stock', 'creator', 'updater'])
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'message' => 'Failed to fetch stock item',
                'errors' => [$e->getMessage()]
            ], 500);
        }
    }

    /**
     * Update the specified stock item.
     */
    public function update(Request $request, StockItem $stockItem)
    {
        try {

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255|unique:stock_items,name,' . $stockItem->id,
                'unit_of_measure' => 'required|in:GRAMS,MILLILITERS,TOKENS,BAGS,NUMBER',
                'unit_cost' => 'required|numeric|min:0',
                'currency' => 'required|string|max:10'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $validator->validated();
            $data['updated_by'] = auth()->id();

            $stockItem->update($data);

            return response()->json([
                'message' => 'Stock item updated successfully',
                'data' => $stockItem->fresh()->load(['stock', 'creator', 'updater'])
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'message' => 'Failed to update stock item',
                'errors' => [$e->getMessage()]
            ], 500);
        }
    }

    /**
     * Remove the specified stock item.
     */
    public function destroy(StockItem $stockItem)
    {
        try {

            $stockItem->delete();

            return response()->json([
                'message' => 'Stock item deleted successfully'
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'message' => 'Failed to delete stock item',
                'errors' => [$e->getMessage()]
            ], 500);
        }
    }
}