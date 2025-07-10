// script.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Validación del Formulario de Contacto
    const contactForm = document.querySelector('#contacto form');

    if (contactForm) {
        contactForm.addEventListener('submit', function(event) {
            const nameInput = document.getElementById('nombre');
            const emailInput = document.getElementById('email');
            const messageInput = document.getElementById('mensaje');

            let isValid = true;

            // Validación de campo requerido: Nombre
            if (nameInput.value.trim() === '') {
                alert('Por favor, ingresa tu nombre.');
                isValid = false;
                nameInput.focus();
                event.preventDefault(); // Detiene el envío si falla
                return; // Salir de la función para evitar más validaciones innecesarias
            }

            // Validación de formato de correo electrónico
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(emailInput.value)) {
                alert('Por favor, ingresa un correo electrónico válido.');
                isValid = false;
                emailInput.focus();
                event.preventDefault(); // Detiene el envío si falla
                return; // Salir de la función
            }

            // Validación de campo requerido: Mensaje
            if (messageInput.value.trim() === '') {
                alert('Por favor, ingresa tu mensaje.');
                isValid = false;
                messageInput.focus();
                event.preventDefault(); // Detiene el envío si falla
                return; // Salir de la función
            }

            // Si todas las validaciones pasan, mostrar mensaje de éxito
            if (isValid) {
                alert('Mensaje enviado con éxito. ¡Gracias por contactarnos!');
                // El formulario se enviará a Formspree después de este alert
            }
        });
    }

    // 2. Integración de la API y Renderización de Productos
    const productListContainer = document.querySelector('.product-list');
    const productsApiUrl = 'https://fakestoreapi.com/products'; // Ejemplo de API REST de productos

    let products = []; // Para almacenar los productos cargados de la API

    async function fetchProducts() {
        try {
            const response = await fetch(productsApiUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            products = data; // Almacenar los productos
            renderProducts(products);
        } catch (error) {
            console.error('Error al obtener los productos:', error);
            productListContainer.innerHTML = '<p>Lo sentimos, no pudimos cargar los productos en este momento.</p>';
        }
    }

    function renderProducts(productsToRender) {
        productListContainer.innerHTML = ''; // Limpiar el contenedor antes de renderizar
        if (productsToRender.length === 0) {
            productListContainer.innerHTML = '<p>No hay productos disponibles.</p>';
            return;
        }

        productsToRender.forEach(product => {
            const productCard = document.createElement('div');
            productCard.classList.add('product-card');
            productCard.innerHTML = `
                <img src="${product.image}" alt="${product.title}">
                <h3>${product.title}</h3>
                <p>${product.description.substring(0, 70)}...</p>
                <p class="price">$${product.price.toFixed(2)}</p>
                <button data-product-id="${product.id}">Agregar al Carrito</button>
            `;
            productListContainer.appendChild(productCard);
        });

        // Añadir event listeners a los botones "Agregar al Carrito"
        document.querySelectorAll('.product-card button').forEach(button => {
            button.addEventListener('click', (event) => {
                const productId = parseInt(event.target.dataset.productId);
                const productToAdd = products.find(p => p.id === productId);
                if (productToAdd) {
                    addToCart(productToAdd);
                }
            });
        });
    }

    // 3. Carrito de Compras Dinámico (localStorage)
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartCountSpan = document.getElementById('cart-count');
    const cartModal = document.getElementById('cart-modal');
    const cartIcon = document.getElementById('cart-icon');
    const closeCartButton = document.querySelector('.cart-modal .close-button');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalSpan = document.getElementById('cart-total');
    const checkoutButton = document.querySelector('.checkout-button');

    function updateCartCount() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountSpan.textContent = totalItems;
    }

    function saveCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    function addToCart(product) {
        const existingItem = cart.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        saveCart();
        updateCartCount();
        renderCartItems(); // Actualizar la visualización del carrito
        alert(`${product.title} ha sido agregado al carrito.`);
    }

    function renderCartItems() {
        cartItemsContainer.innerHTML = '';
        let total = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p>El carrito está vacío.</p>';
        } else {
            cart.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.classList.add('cart-item');
                itemDiv.innerHTML = `
                    <img src="${item.image}" alt="${item.title}">
                    <div>
                        <h4>${item.title}</h4>
                        <p>Precio: $${item.price.toFixed(2)}</p>
                        <p>Cantidad:
                            <input type="number" min="1" value="${item.quantity}" data-item-id="${item.id}" class="item-quantity">
                        </p>
                        <p>Subtotal: $${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                    <button class="remove-item" data-item-id="${item.id}">Eliminar</button>
                `;
                cartItemsContainer.appendChild(itemDiv);
                total += item.price * item.quantity;
            });
        }
        cartTotalSpan.textContent = total.toFixed(2);
        addCartItemEventListeners(); // Volver a adjuntar listeners cada vez que se renderiza el carrito
    }

    function addCartItemEventListeners() {
        document.querySelectorAll('.item-quantity').forEach(input => {
            input.removeEventListener('change', handleQuantityChange); // Evitar duplicados
            input.addEventListener('change', handleQuantityChange);
        });

        document.querySelectorAll('.remove-item').forEach(button => {
            button.removeEventListener('click', handleRemoveItem); // Evitar duplicados
            button.addEventListener('click', handleRemoveItem);
        });
    }

    function handleQuantityChange(event) {
        const itemId = parseInt(event.target.dataset.itemId);
        const newQuantity = parseInt(event.target.value);
        updateCartItemQuantity(itemId, newQuantity);
    }

    function handleRemoveItem(event) {
        const itemId = parseInt(event.target.dataset.itemId);
        removeCartItem(itemId);
    }

    function updateCartItemQuantity(itemId, newQuantity) {
        const itemIndex = cart.findIndex(item => item.id === itemId);
        if (itemIndex > -1) {
            if (newQuantity > 0) {
                cart[itemIndex].quantity = newQuantity;
            } else {
                // Si la cantidad es 0 o menos, eliminar el producto
                cart.splice(itemIndex, 1);
            }
            saveCart();
            updateCartCount();
            renderCartItems();
        }
    }

    function removeCartItem(itemId) {
        cart = cart.filter(item => item.id !== itemId);
        saveCart();
        updateCartCount();
        renderCartItems();
    }

    // Funcionalidad para abrir y cerrar el modal del carrito
    cartIcon.addEventListener('click', (event) => {
        event.preventDefault(); // Evita que el enlace # se comporte por defecto
        cartModal.style.display = 'block';
        renderCartItems(); // Asegúrate de que el carrito se renderice cuando se abre
    });

    closeCartButton.addEventListener('click', () => {
        cartModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === cartModal) {
            cartModal.style.display = 'none';
        }
    });

    // Manejo del botón "Proceder al Pago"
    checkoutButton.addEventListener('click', () => {
        if (cart.length > 0) {
            alert('Procediendo al pago. ¡Gracias por tu compra!');
            // Aquí podrías redirigir a una página de pago real o procesar la orden
            cart = []; // Vaciar el carrito después del "pago"
            saveCart();
            updateCartCount();
            renderCartItems();
            cartModal.style.display = 'none'; // Cerrar el modal
        } else {
            alert('Tu carrito está vacío. Agrega algunos productos antes de proceder al pago.');
        }
    });

    // Cargar productos y estado del carrito al inicio
    fetchProducts();
    updateCartCount(); // Actualizar el contador del carrito al cargar la página
});