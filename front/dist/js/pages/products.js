(() => {
    "use strict";

    const store = window.callProduct;

    // Si la página no cargó el store, no hacemos nada
    if (!store) {
        console.error("Productos: falta cargar js/pages/call-product.js");
        return;
    }

    const priceFormatter = new Intl.NumberFormat("es-AR");

    function formatPrice(price) {
        return `$${priceFormatter.format(Number(price) || 0)}`;
    }

    function clearError(element) {
        element.textContent = "";
        element.hidden = true;
        element.classList.remove("is-error");
        element.style.color = "";
    }

    // ------------------------------------------------------------------------
    // LISTADO
    // Se activa solo en listProduct.html, que tiene <tbody id="products-body">.
    // ------------------------------------------------------------------------
    const tableBody = document.getElementById("products-body");

    if (tableBody) {
        const tableInfo = document.getElementById("table-info");
        const pagination = document.getElementById("pagination");

        const PER_PAGE = 7;

        let products = [];
        let currentPage = 1;

        // Las celdas se crean con textContent, no con innerHTML: los datos vienen
        // de la base y así se evita inyección de HTML
        function createCell(value, className = "") {
            const cell = document.createElement("td");
            cell.textContent = value;
            if (className) cell.className = className;
            return cell;
        }

        function createRow(product) {
            const row = document.createElement("tr");

            row.append(
                createCell(product.name ?? ""),
                createCell(String(product.id ?? "")),
                createCell(String(product.stock ?? 0)),
                createCell(formatPrice(product.price))
            );

            const actionsCell = document.createElement("td");
            actionsCell.className = "cell-action";

            const editLink = document.createElement("a");
            editLink.className = "btn-edit";
            editLink.href = `/product/edit?id=${encodeURIComponent(product.id)}`;
            editLink.textContent = "Editar";

            // Botón de borrado: se apoya en callProduct.remove(), que ya existe.
            // Se usa delegación de eventos más abajo para no crear un listener
            // por fila.
            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "btn-secondary";
            deleteButton.dataset.deleteProduct = product.id;
            deleteButton.textContent = "Eliminar";

            actionsCell.append(editLink, deleteButton);
            row.append(actionsCell);

            return row;
        }

        function renderEmpty(message) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");
            cell.colSpan = 5;
            cell.className = "empty-row";
            cell.textContent = message;
            row.append(cell);
            tableBody.replaceChildren(row);
        }

        // Paginación del lado del cliente: se conserva porque listProduct.html
        // ya trae #pagination y #table-info. Si no existen, se omite sin error.
        function renderPagination(totalPages) {
            if (!pagination) return;

            pagination.replaceChildren();

            const addButton = (label, page, { disabled = false, active = false, ellipsis = false } = {}) => {
                if (ellipsis) {
                    const span = document.createElement("span");
                    span.className = "page-ellipsis";
                    span.textContent = label;
                    pagination.append(span);
                    return;
                }

                const button = document.createElement("button");
                button.type = "button";
                button.className = "page-btn" + (active ? " active" : "");
                button.textContent = label;
                button.disabled = disabled;

                if (!disabled && !active) {
                    button.addEventListener("click", () => {
                        currentPage = page;
                        renderPage();
                    });
                }

                pagination.append(button);
            };

            addButton("‹", currentPage - 1, { disabled: currentPage === 1 });

            const pages = [];
            if (totalPages <= 8) {
                for (let i = 1; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                if (currentPage > 3) pages.push("...");
                for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                    pages.push(i);
                }
                if (currentPage < totalPages - 2) pages.push("...");
                pages.push(totalPages);
            }

            pages.forEach(page => {
                if (page === "...") addButton("...", null, { ellipsis: true });
                else addButton(String(page), page, { active: page === currentPage });
            });

            addButton("›", currentPage + 1, { disabled: currentPage === totalPages });
        }

        function renderPage() {
            const total = products.length;
            const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

            if (currentPage > totalPages) currentPage = totalPages;

            const start = (currentPage - 1) * PER_PAGE;
            const slice = products.slice(start, start + PER_PAGE);

            if (slice.length === 0) {
                renderEmpty("No hay productos cargados.");
            } else {
                tableBody.replaceChildren(...slice.map(createRow));
            }

            if (tableInfo) {
                tableInfo.textContent = total === 0
                    ? "Mostrando 0 de 0"
                    : `Mostrando ${start + 1}-${Math.min(start + PER_PAGE, total)} de ${total}`;
            }

            renderPagination(totalPages);
        }

        async function loadProducts() {
            try {
                const list = await store.list();

                if (!Array.isArray(list)) {
                    throw new Error("La API no devolvió una lista de productos. Revisá call-product.js (.products).");
                }

                products = list;
                currentPage = 1;
                if (tableInfo) tableInfo.style.color = "";
                renderPage();
            } catch (error) {
                products = [];
                const message = error instanceof Error && error.message
                    ? error.message
                    : "No se pudo cargar la lista de productos.";

                renderEmpty("No se pudieron cargar los productos.");

                if (tableInfo) {
                    tableInfo.textContent = message;
                    tableInfo.style.color = "#b00016";
                }
            }
        }

        // Delegación: un solo listener para todos los botones "Eliminar".
        tableBody.addEventListener("click", async event => {
            const button = event.target.closest("[data-delete-product]");
            if (!button) return;

            const id = button.dataset.deleteProduct;
            if (!window.confirm("¿Eliminar este producto?")) return;

            button.disabled = true;
            try {
                await store.remove(id);
                await loadProducts();
            } catch (error) {
                button.disabled = false;
                window.alert(error instanceof Error ? error.message : "No se pudo eliminar el producto.");
            }
        });

        loadProducts();
    }

    // ------------------------------------------------------------------------
    // FORMULARIO (alta y edición)
    // Se activa en registerProduct.html y editProduct.html, ambos con
    // <form id="product-form">.
    // ------------------------------------------------------------------------
    const form = document.getElementById("product-form");

    if (!form) return;
    const title = form.querySelector(".form-title");
    const submitButton = form.querySelector('button[type="submit"]');
    const idInput = document.getElementById("id");
    const nameInput = document.getElementById("name");
    const stockInput = document.getElementById("stock");
    const priceInput = document.getElementById("price");

    // El modo se decide por la URL: /product/edit?id=5 -> editar; si no, alta.
    const productId = new URLSearchParams(window.location.search).get("id");

    // Mensaje de estado del formulario, creado dinámicamente porque las vistas
    // no tienen un contenedor de feedback. 
    const feedback = document.createElement("p");
    feedback.className = "form-hint";
    feedback.setAttribute("role", "status");
    feedback.hidden = true;
    (title || form).insertAdjacentElement("afterend", feedback);

    function setFeedback(message, isError = false) {
        feedback.hidden = false;
        feedback.textContent = message;
        feedback.style.color = isError ? "#b00016" : "";
    }

    function readForm() {
        const product = {
            name: nameInput.value.trim(),
            price: Number(priceInput.value),
            stock: Number(stockInput.value)
        };

        return product;
    }

    // Validación espejo de productController::validate(), limitada a los campos
    // existentes. reportValidity() ya cubre required/min/step.
    function validate(product) {
        if (product.name === "" || product.name.length > 40) {
            return "El nombre tiene que tener entre 1 y 40 caracteres.";
        }
        if (!Number.isFinite(product.price) || product.price < 0 || product.price > 99999999) {
            return "El precio debe ser un número mayor o igual a cero.";
        }
        if (!Number.isInteger(product.stock) || product.stock < 0 || product.stock > 999999) {
            return "El stock debe ser un entero entre 0 y 999999.";
        }
        return null;
    }

    if (productId) {
        if (title) title.textContent = "Editar producto";
        if (submitButton) submitButton.textContent = "Guardar cambios";
        if (idInput) idInput.value = productId;
        if (submitButton) submitButton.disabled = true;

        store.get(productId)
            .then(product => {
                if (!product) throw new Error("No se encontró el producto.");

                nameInput.value = product.name ?? "";
                stockInput.value = String(product.stock ?? 0);
                priceInput.value = String(product.price ?? 0);
                if (submitButton) submitButton.disabled = false;
            })
            .catch(error => {
                if (submitButton) submitButton.disabled = false;
                setFeedback(
                    error instanceof Error ? error.message : "No se pudo cargar el producto.",
                    true
                );
            });
    } else {
        if (title) title.textContent = "Agregar producto";
        // El ID lo asigna la base: ya no se calcula con nextProductId().
        if (idInput) idInput.value = "";
    }

    form.addEventListener("submit", async event => {
        event.preventDefault();

        if (!form.reportValidity()) return;

        const product = readForm();
        const validationError = validate(product);

        if (validationError) {
            setFeedback(validationError, true);
            return;
        }

        clearError(feedback);

        if (submitButton) submitButton.disabled = true;

        try {
            if (productId) {
                await store.update(productId, product);
            } else {
                await store.create(product);
            }

            setFeedback("Producto guardado correctamente.");

            window.setTimeout(() => {
                window.location.href = "/product/list";
            }, 700);
        } catch (error) {
            if (submitButton) submitButton.disabled = false;
            setFeedback(
                error instanceof Error ? error.message : "No se pudo guardar el producto.",
                true
            );
        }
    });

})();
