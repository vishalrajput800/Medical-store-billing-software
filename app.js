const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

const money = value => "₹" + (Number(value) || 0).toLocaleString("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

function localDateString() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function makeBillNumber() {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  return `VRH-${date}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function addMedicine() {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td><input class="med-name" type="text" placeholder="Medicine or item name" aria-label="Medicine name"></td>
    <td><input class="qty" type="number" min="0" step="1" value="1" aria-label="Quantity"></td>
    <td><input class="rate" type="number" min="0" step="0.01" placeholder="0.00" aria-label="Rate"></td>
    <td><input class="discount" type="number" min="0" step="0.01" value="0" aria-label="Discount"></td>
    <td class="amount">₹0.00</td>
    <td class="no-print remove-col"><button class="remove-btn" type="button" aria-label="Remove item" title="Remove item">×</button></td>`;
  $("#items").appendChild(row);

  row.querySelectorAll(".qty, .rate, .discount").forEach(input => input.addEventListener("input", calculateTotals));
  row.querySelector(".remove-btn").addEventListener("click", () => {
    const rows = $$("#items tr");
    if (rows.length === 1) {
      $(".med-name", row).value = "";
      $(".qty", row).value = "1";
      $(".rate", row).value = "";
      $(".discount", row).value = "0";
    } else {
      row.remove();
    }
    calculateTotals();
  });
  row.querySelector(".med-name").focus();
  calculateTotals();
}

function amountInWords(value) {
  const n = Math.round((Number(value) || 0) * 100) / 100;
  const whole = Math.floor(n);
  const paise = Math.round((n - whole) * 100);
  const small = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  function underThousand(num) {
    let out = "";
    if (num >= 100) { out += small[Math.floor(num / 100)] + " Hundred "; num %= 100; }
    if (num >= 20) { out += tens[Math.floor(num / 10)] + " "; num %= 10; }
    if (num > 0) out += small[num] + " ";
    return out;
  }
  function words(num) {
    if (num === 0) return "Zero";
    let out = "";
    for (const [size, name] of [[10000000, "Crore"], [100000, "Lakh"], [1000, "Thousand"], [1, ""]]) {
      if (num >= size) {
        out += underThousand(Math.floor(num / size));
        if (name) out += name + " ";
        num %= size;
      }
    }
    return out.trim();
  }
  return `${words(whole)} rupee${whole === 1 ? "" : "s"}${paise ? " and " + words(paise) + " paise" : ""} only`;
}

function calculateTotals() {
  let subtotal = 0;
  let discountTotal = 0;
  $$("#items tr").forEach(row => {
    const qty = Math.max(0, Number($(".qty", row).value) || 0);
    const rate = Math.max(0, Number($(".rate", row).value) || 0);
    const discount = Math.max(0, Number($(".discount", row).value) || 0);
    const gross = qty * rate;
    const actualDiscount = Math.min(discount, gross);
    subtotal += gross;
    discountTotal += actualDiscount;
    $(".amount", row).textContent = money(gross - actualDiscount);
  });
  const tax = Math.max(0, Number($("#tax").value) || 0);
  const grandTotal = Math.max(0, subtotal - discountTotal + tax);
  $("#subtotal").textContent = money(subtotal);
  $("#discountTotal").textContent = "− " + money(discountTotal);
  $("#taxDisplay").textContent = money(tax);
  $("#grandTotal").textContent = money(grandTotal);
  $("#amountWords").textContent = calculateWordsLabel(grandTotal);
}

function calculateWordsLabel(total) {
  return "Amount in words: " + amountInWords(total);
}

let toastTimer;
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}

function newBill() {
  const hasData = $("#customer").value.trim() ||
    $$("#items tr").some(row => $(".med-name", row).value.trim() || Number($(".rate", row).value));
  if (hasData && !window.confirm("Start a new bill? Current details will be cleared.")) return;
  $("#customer").value = "";
  $("#phone").value = "";
  $("#doctor").value = "";
  $("#payment").value = "Cash";
  $("#notes").value = "";
  $("#tax").value = "0";
  $("#billNo").value = makeBillNumber();
  $("#billDate").value = localDateString();
  $("#items").innerHTML = "";
  addMedicine();
  calculateTotals();
  showToast("New bill is ready.");
}

function printReceipt() {
  if (!$("#customer").value.trim()) {
    $("#customer").focus();
    showToast("Please enter the patient / customer name first.");
    return;
  }
  if (!$$("#items tr").some(row => $(".med-name", row).value.trim())) {
    showToast("Please enter at least one medicine or item.");
    return;
  }
  calculateTotals();
  window.print();
}

$("#addMedicineBtn").addEventListener("click", addMedicine);
$("#addMedicineLink").addEventListener("click", addMedicine);
$("#newBillBtn").addEventListener("click", newBill);
$("#printBtn").addEventListener("click", printReceipt);
$("#tax").addEventListener("input", calculateTotals);

$("#billNo").value = makeBillNumber();
$("#billDate").value = localDateString();
addMedicine();
