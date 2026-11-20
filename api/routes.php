<?php
## Routing API (Productos)
$router->get('/api/product', 'productController@getAll');
$router->get('/api/product/:id', 'productController@get');
$router->post('/api/product', 'productController@add');
$router->put('/api/product/:id', 'productController@update');
$router->delete('/api/product/:id', 'productController@remove');

## Routing Vistas
$router->get('/', 'accessController@landing');
$router->get('/product/list', 'accessController@listProduct');
$router->get('/product/register', 'accessController@registerProduct');
$router->get('/product/edit', 'accessController@editProduct');
