<?php

namespace App\Http\Controllers;

use App\Models\MenuIngredient;
use Illuminate\Http\Request;

class MenuIngredientController extends Controller
{
    /**
     * Display ingredients
     * Optional: ?menu_id=1
     */
    public function index(Request $request)
    {
        $menuId = $request->query('menu_id');

        $ingredients = MenuIngredient::with(['stockItem:id,name,unit_of_measure'])
            ->when($menuId, function ($query) use ($menuId) {
                $query->where('menu_id', $menuId);
            })
            ->get();

        return response()->json(
            $ingredients->map(function ($item) {
                return [
                    'id' => $item->id,
                    'menu_id' => $item->menu_id,
                    'stock_item_id' => $item->stock_item_id,
                    'stock_item_name' => $item->stockItem->name ?? null,
                    'quantity' => $item->quantity,
                    'unit_of_measure' => $item->stockItem->unit_of_measure ?? null,
                    'created_at' => $item->created_at,
                ];
            })
        );
    }

    /**
     * Store (CREATE or UPDATE if exists)
     */
    public function store(Request $request)
{
    $validated = $request->validate([
        'menu_id' => 'required|exists:menus,id',
        'stock_item_id' => 'required|exists:stock_items,id',
        'quantity' => 'required|numeric|min:0'
    ]);

    // 🔥 HARD CHECK (NO ORM MAGIC)
    $existing = MenuIngredient::where('menu_id', $validated['menu_id'])
        ->where('stock_item_id', $validated['stock_item_id'])
        ->first();

    if ($existing) {
        // ✅ UPDATE instead of INSERT
        $existing->update([
            'quantity' => $validated['quantity']
        ]);

        $existing->load('stockItem:id,name,unit_of_measure');

        return response()->json([
            'id' => $existing->id,
            'menu_id' => $existing->menu_id,
            'stock_item_id' => $existing->stock_item_id,
            'stock_item_name' => $existing->stockItem->name,
            'quantity' => $existing->quantity,
            'unit_of_measure' => $existing->stockItem->unit_of_measure,
            'message' => 'Ingredient updated instead of duplicated'
        ]);
    }

    // ✅ SAFE CREATE
    $ingredient = MenuIngredient::create($validated);

    $ingredient->load('stockItem:id,name,unit_of_measure');

    return response()->json([
        'id' => $ingredient->id,
        'menu_id' => $ingredient->menu_id,
        'stock_item_id' => $ingredient->stock_item_id,
        'stock_item_name' => $ingredient->stockItem->name,
        'quantity' => $ingredient->quantity,
        'unit_of_measure' => $ingredient->stockItem->unit_of_measure,
        'message' => 'Ingredient created'
    ], 201);
}
    /**
     * Show single ingredient
     */
    public function show($id)
    {
        $ingredient = MenuIngredient::with('stockItem:id,name,unit_of_measure')->findOrFail($id);

        return response()->json([
            'id' => $ingredient->id,
            'menu_id' => $ingredient->menu_id,
            'stock_item_id' => $ingredient->stock_item_id,
            'stock_item_name' => $ingredient->stockItem->name,
            'quantity' => $ingredient->quantity,
            'unit_of_measure' => $ingredient->stockItem->unit_of_measure,
            'created_at' => $ingredient->created_at,
        ]);
    }

    /**
     * Update ingredient (SAFE)
     */
    public function update(Request $request, $id)
    {
        $ingredient = MenuIngredient::findOrFail($id);

        $validated = $request->validate([
            'menu_id' => 'required|exists:menus,id',
            'stock_item_id' => 'required|exists:stock_items,id',
            'quantity' => 'required|numeric|min:0'
        ]);

        // ✅ Prevent duplicate conflict
        $exists = MenuIngredient::where('menu_id', $validated['menu_id'])
            ->where('stock_item_id', $validated['stock_item_id'])
            ->where('id', '!=', $id)
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Ingredient already exists for this menu.'
            ], 400);
        }

        $ingredient->update($validated);

        $ingredient->load('stockItem:id,name,unit_of_measure');

        return response()->json([
            'id' => $ingredient->id,
            'menu_id' => $ingredient->menu_id,
            'stock_item_id' => $ingredient->stock_item_id,
            'stock_item_name' => $ingredient->stockItem->name,
            'quantity' => $ingredient->quantity,
            'unit_of_measure' => $ingredient->stockItem->unit_of_measure
        ]);
    }

    /**
     * Delete ingredient
     */
    public function destroy($id)
    {
        MenuIngredient::where('id', $id)->delete();

        return response()->json([
            'message' => 'Ingredient deleted successfully'
        ]);
    }
}