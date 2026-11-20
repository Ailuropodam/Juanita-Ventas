// Habla con la API (/api/product). Cada función devuelve una promesa
// La cuál sera cumplida con el recibo de una respuesta en forma de json por parte de la API 
(() => {
    async function call(endpoint, method = "GET", body = null) {
        const data = await API.request(endpoint, method, body);
        if (!data?.success) {
            throw new Error(data?.message || "No se pudo conectar con el servidor.");
        }
        return data;
    }

    window.callProduct = {
        async list() {
            return (await call("/product")).products;
        },

        async get(id) {
            return (await call(`/product/${encodeURIComponent(id)}`)).product;
        },

        async create(product) {
            return (await call("/product", "POST", product)).product;
        },

        async update(id, product) {
            return (await call(`/product/${encodeURIComponent(id)}`, "PUT", product)).product;
        },

        async remove(id) {
            await call(`/product/${encodeURIComponent(id)}`, "DELETE");
        },
    };
})();
