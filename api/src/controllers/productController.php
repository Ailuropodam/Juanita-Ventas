<?php

namespace app\controllers;

use app\models\productModel;
use app\utils\response;

class productController {
	private productModel $products;

	public function __construct($db) {
		$this->products = new productModel($db);
	}

	# GET /api/product
	public function getAll(): void {
		$products = $this->products->getAll();
		Response::json(true, 'Productos obtenidos.', ['products' => $products, 'total' => count($products)]);
	}

	# GET /api/product/:id
	public function get(string $id): void {
		$product = $this->products->get((int) $id);
		if (!$product) {
			Response::json(false, 'No se encontró el producto.', [], 404);
		}
		Response::json(true, 'Producto obtenido.', ['product' => $product]);
	}

	# POST /api/product
	public function add(): void {
		$id = $this->products->register($this->validate());
		Response::json(true, 'Producto creado.', ['product' => $this->products->get($id)], 201);
	}

	# PUT /api/product/:id
	public function update(string $id): void {
		$productId = (int) $id;
		if (!$this->products->get($productId)) {
			Response::json(false, 'No se encontró el producto que intentas editar.', [], 404);
		}
		$this->products->update($productId, $this->validate());
		Response::json(true, 'Producto actualizado.', ['product' => $this->products->get($productId)]);
	}

	# DELETE /api/product/:id
	public function remove(string $id): void {
		try {
			$borrado = $this->products->remove((int) $id);
		}
		catch (\PDOException $e) {
			error_log($e->getMessage());
			Response::json(false, 'No se pudo eliminar el producto.', [], 500);
		}

		if (!$borrado) {
			Response::json(false, 'No se encontró el producto que intentas eliminar.', [], 404);
		}

		Response::json(true, 'Producto eliminado correctamente.');
	}

	private function validate(): array {
		$data = json_decode(file_get_contents('php://input'), true);
		$data = is_array($data) ? $data : [];

		$nombre = trim((string) ($data['name'] ?? ''));
		$precio = $data['price'] ?? null;
		$stock = $data['stock'] ?? null;

		if ($nombre === '' || mb_strlen($nombre) > 40) {
			Response::json(false, 'El nombre tiene que tener entre 1 y 40 caracteres.', [], 400);
		}
		if (!is_numeric($precio) || $precio < 0 || $precio > 99999999) {
			Response::json(false, 'El precio debe ser un número mayor o igual a cero.', [], 400);
		}
		if (!is_numeric($stock) || (int) $stock != $stock || $stock < 0 || $stock > 999999) {
			Response::json(false, 'El stock debe ser un entero entre 0 y 999999.', [], 400);
		}

		return [
			'name' => $nombre,
			'price' => round((float) $precio, 2),
			'stock' => (int) $stock,
		];
	}
}
