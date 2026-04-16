<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StockItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'currency' => $this->currency,
            'stock' => new StockResource($this->whenLoaded('stock')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}