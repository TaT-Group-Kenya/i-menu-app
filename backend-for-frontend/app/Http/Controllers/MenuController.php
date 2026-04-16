<?php

namespace App\Http\Controllers;

use App\Models\Menu;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MenuController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | GET ALL MENUS
    |--------------------------------------------------------------------------
    */

    // GET /api/menus
    public function index()
    {
        $menus = Menu::latest()->get();

        return response()->json($menus);
    }

    /*
    |--------------------------------------------------------------------------
    | GET SINGLE MENU
    |--------------------------------------------------------------------------
    */

    // GET /api/menus/{id}
    public function show($id)
    {
        $menu = Menu::with('ingredients.stockItem')->findOrFail($id);

        return response()->json($menu);
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE MENU
    |--------------------------------------------------------------------------
    */

    // POST /api/menus
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:menus,name',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
        ]);

        $menu = Menu::create([
            ...$validated,
            'created_by' => Auth::id(),
            'updated_by' => Auth::id(),
        ]);

        return response()->json($menu, 201);
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE MENU
    |--------------------------------------------------------------------------
    */

    // PUT /api/menus/{id}
    public function update(Request $request, $id)
    {
        $menu = Menu::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255|unique:menus,name,' . $menu->id,
            'description' => 'nullable|string',
            'price' => 'sometimes|numeric|min:0',
        ]);

        $menu->update([
            ...$validated,
            'updated_by' => Auth::id(),
        ]);

        return response()->json($menu);
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE MENU
    |--------------------------------------------------------------------------
    */

    // DELETE /api/menus/{id}
    public function destroy($id)
    {
        $menu = Menu::findOrFail($id);

        // Prevent deleting menus used in orders
        if ($menu->orderItems()->exists()) {
            return response()->json([
                'message' => 'Cannot delete menu because it is used in orders.'
            ], 400);
        }

        $menu->delete();

        return response()->json([
            'message' => 'Menu deleted successfully'
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | LOAD MENU INGREDIENTS
    |--------------------------------------------------------------------------
    */

    // GET /api/menus/{id}/ingredients
    public function ingredients($id)
    {
        $menu = Menu::with('ingredients.stockItem')->findOrFail($id);

        $ingredients = $menu->ingredients->map(function ($ingredient) {

            return [
                'id' => $ingredient->id,
                'menu_id' => $ingredient->menu_id,
                'stock_item_id' => $ingredient->stock_item_id,
                'stock_item_name' => optional($ingredient->stockItem)->name,
                'quantity' => $ingredient->quantity,
                'unit_of_measure' => $ingredient->unit,
                'created_at' => $ingredient->created_at,
            ];
        });

        return response()->json($ingredients);
    }
}