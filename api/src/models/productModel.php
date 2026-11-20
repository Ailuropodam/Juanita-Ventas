<?php
namespace app\models;

class productModel {
    private $db;

    private const COLUMNS = "id_product AS id, name_product AS name, price, stock";

    public function __construct($db) {
        $this->db = $db;
    }

    public function getAll(): array {
        $filas = $this->db->query("SELECT " . self::COLUMNS . " FROM Product ORDER BY id_product DESC")
                          ->fetchAll(\PDO::FETCH_ASSOC);
        return array_map([$this, 'format'], $filas);
    }

    public function get(int $id): ?array {
        $stmt = $this->db->prepare("SELECT " . self::COLUMNS . " FROM Product WHERE id_product = :id");
        $stmt->execute(['id' => $id]);
        $fila = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $fila ? $this->format($fila) : null;
    }

    public function register(array $p): int {
        $stmt = $this->db->prepare(
            "INSERT INTO Product (name_product, price, stock)
             VALUES (:name, :price, :stock)"
        );
        $stmt->execute($p);
        return (int) $this->db->lastInsertId();
    }

    public function update(int $id, array $p): bool {
        $stmt = $this->db->prepare(
            "UPDATE Product SET name_product = :name, price = :price, stock = :stock
              WHERE id_product = :id"
        );
        return $stmt->execute($p + ['id' => $id]);
    }

    public function remove(int $id): bool {
        $stmt = $this->db->prepare("DELETE FROM Product WHERE id_product = :id");
        $stmt->execute(['id' => $id]);
        return $stmt->rowCount() > 0;
    }

    private function format(array $fila): array {
        $fila['id'] = (int) $fila['id'];
        $fila['price'] = (float) $fila['price'];
        $fila['stock'] = (int) $fila['stock'];
        return $fila;
    }
}
