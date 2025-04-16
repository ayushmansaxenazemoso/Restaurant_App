// fetch from local storage
let savedOrders = localStorage.getItem("tableOrders");
let tableOrders = savedOrders
  ? JSON.parse(savedOrders)
  : { 1: [], 2: [], 3: [] };

let bill_number = localStorage.getItem("bill_number");

if (bill_number == null) {
  bill_number = 0;
  localStorage.setItem("bill_number", bill_number);
} else {
  bill_number = parseInt(bill_number);
}

let draggedItem = null;

function drag(event) {
  let name = event.target.dataset.name;
  let price = parseFloat(event.target.dataset.price);
  draggedItem = { name, price, quantity: 1 };
}

function saveOrdersTolocalStorage() {
  localStorage.setItem("tableOrders", JSON.stringify(tableOrders));
}

function allowDrop(event) {
  event.preventDefault();
}

function drop(event) {
  event.preventDefault();
  let tableId = event.currentTarget.getAttribute("data-id");
  let tableCard = event.currentTarget;

  let spans = tableCard.querySelectorAll("span");
  let priceSpan = spans[0];
  let itemsSpan = spans[1];

  let currentAmount = parseFloat(priceSpan.textContent);
  let currentItems = parseInt(itemsSpan.textContent);

  priceSpan.textContent = currentAmount + draggedItem.price;
  itemsSpan.textContent = currentItems + 1;

  let orderList = tableOrders[tableId];
  let existingItem = null;

  for (let item of orderList) {
    if (item.name == draggedItem.name) {
      existingItem = item;
      break;
    }
  }

  if (existingItem !== null) {
    existingItem.quantity++;
  } else {
    orderList.push({
      name: draggedItem.name,
      price: draggedItem.price,
      quantity: draggedItem.quantity,
    });
  }

  saveOrdersTolocalStorage();
}

function showModal(tableId) {
  let modal = document.getElementById("order-modal");
  let modalTitle = document.getElementById("modal-title");
  let orderItems = document.getElementById("order-items");
  let orderTotal = document.getElementById("order-total");

  let tab = document.getElementById(tableId);
  tab.style.backgroundColor = "rgb(144 175 172)";

  modal.classList.remove("hidden");
  modal.setAttribute("data-table-id", tableId);
  modalTitle.textContent = `Table - ${tableId} | Order Details`;
  orderItems.innerHTML = "";

  let orders = tableOrders[tableId];
  let total = 0;

  orders.forEach((item, index) => {
    total += item.price * item.quantity;

    let row = document.createElement("div");
    row.classList.add("order-row");

    row.innerHTML = `
      <div class="item-name">${item.name}</div>
      <div class="quantity-controls">
        <button class='minus' onclick="changeQuantity('${tableId}', ${index}, -1)">-</button>
        <input type="number" min="1" value="${item.quantity}" onchange="updateQuantityFromInput('${tableId}', ${index}, this.value)">
        <button onclick="changeQuantity('${tableId}', ${index}, 1)">+</button>
        <button onclick="deleteItem('${tableId}', ${index})">🗑</button>
      </div>
    `;

    orderItems.appendChild(row);
  });

  orderTotal.innerHTML = `Total: ₹<span class="total-bill">${total}</span>`;
}

function changeQuantity(tableId, index, change) {
  let item = tableOrders[tableId][index];
  item.quantity = Math.max(1, item.quantity + change);

  let minusBtn = document.querySelectorAll(".minus")[index];

  if (item.quantity == 1) {
    minusBtn.disabled = true;
    minusBtn.classList.add("disable_btn");
  } else {
    minusBtn.classList.remove("disable_btn");
    minusBtn.disabled = false;
  }

  updateTableCard(tableId);
  showModal(tableId);
  saveOrdersTolocalStorage();
}

function deleteItem(tableId, index) {
  tableOrders[tableId].splice(index, 1);
  updateTableCard(tableId);
  showModal(tableId);
  saveOrdersTolocalStorage();
}

function updateTableCard(tableId) {
  let tableCard = document.querySelector(`.table-card[data-id="${tableId}"]`);
  let q = tableCard.querySelectorAll("span");
  let priceSpan = q[0];
  let itemCountSpan = q[1];

  let totalPrice = 0;
  let totalItems = 0;

  tableOrders[tableId].forEach((item) => {
    totalPrice += item.price * item.quantity;
    totalItems += item.quantity;
  });

  priceSpan.textContent = totalPrice;
  itemCountSpan.textContent = totalItems;
}

function closelocal() {
  let modal = document.getElementById("order-modal");
  let tableId = modal.getAttribute("data-table-id");

  if (confirm("Bill has been generated")) {
    bill_number++;
    localStorage.setItem("bill_number", bill_number);

    let orders = tableOrders[tableId];
    let totalItems = 0;
    let totalBill = 0;
    let orderDetails = "";

    orders.forEach((item) => {
      totalItems += item.quantity;
      totalBill += item.price * item.quantity;
      orderDetails += `${item.name} - ₹${item.price} x ${item.quantity}\n`;
    });

    let content = `Bill Number: ${bill_number}
  Table ID: ${tableId}

  Order Details:
  ${orderDetails}
  Total Items: ${totalItems}
  Total Bill: ₹${totalBill}
  `;

    let filename = `bill_number_${bill_number}.txt`;
    let file = new Blob([content], { type: "text/plain" });

    let a = document.createElement("a");
    a.href = URL.createObjectURL(file);
    a.download = filename;
    a.click();

    tableOrders[tableId] = [];
    updateTableCard(tableId);
    saveOrdersTolocalStorage();
    closeModal();
  }
}

function closeModal() {
  let modal = document.getElementById("order-modal");
  let tableId = modal.getAttribute("data-table-id");

  modal.classList.add("hidden");

  let tab = document.querySelector(`.table-card[data-id="${tableId}"]`);
  if (tab) {
    tab.style.backgroundColor = "#e8f4ff";
  }
}





document.querySelectorAll(".search-box")[0].addEventListener("input", function (e) {
    let searchValue = e.target.value.toLowerCase();
    let tableCards = document.querySelectorAll(".table-card");

    tableCards.forEach((card) => {
      let text = card.textContent.toLowerCase();
      card.style.display = text.includes(searchValue) ? "" : "none";
    });
  });

document.querySelectorAll(".search-box")[1].addEventListener("input", function (e) {
    let searchValue = e.target.value.toLowerCase();
    let menuItems = document.querySelectorAll(".menu-item");

    menuItems.forEach((item) => {
      let text = item.textContent.toLowerCase();
      item.style.display = text.includes(searchValue) ? "" : "none";
    });
  });

function clearSearch(inputId) {
  const input = document.getElementById(inputId);
  input.value = "";
}

// Update quantity from input
function updateQuantityFromInput(tableId, index, newQuantity) {
  newQuantity = parseInt(newQuantity);
  if (newQuantity < 1) {
    alert("Entered quantity must be greater than zero");
    return;
  }
  tableOrders[tableId][index].quantity = newQuantity;
  updateTableCard(tableId);
  showModal(tableId);
  saveOrdersTolocalStorage();
}

// update
Object.keys(tableOrders).forEach((tableId) => {
  updateTableCard(tableId);
});
