<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name' => 'System Admin',
            'email' => 'admin@imenu.com',
            'password' => Hash::make('password'),
            'role' => 'ADMIN',
        ]);

        User::create([
            'name' => 'Main Cashier',
            'email' => 'cashier@imenu.com',
            'password' => Hash::make('password'),
            'role' => 'CASHIER',
        ]);
    }
}