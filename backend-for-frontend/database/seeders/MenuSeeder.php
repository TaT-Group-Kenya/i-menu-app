<?php

namespace Database\Seeders;

use App\Models\Menu;
use Illuminate\Database\Seeder;

class MenuSeeder extends Seeder
{
    public function run(): void
    {
        $menus = [
            'Ugali/Chicken Stew and a cup of tea',
            'Chapati/beans and a cup of tea',
            'Ugali/Pojo Stew and a cup of tea',
            'Potatoe Stew',
            'Fried Chicken',
            'Beef',
            'Pilau',
            'White Rice',
            'Chicken',
            "Beef Stew",
            'Tea',
            'Coffee',
        ];

        foreach ($menus as $menu) {
            Menu::create([
                'name' => $menu,
                'description' => $menu,
                'price' => 220,
                'created_by' => 1,
                'updated_by' => 1,
            ]);
        }
    }
}