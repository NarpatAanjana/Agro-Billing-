
const goodsBody = document.getElementById("goodsBody");

const get = (id) => document.getElementById(id);
const val = (id) => Number(get(id).value) || 0;

const fmt = (n) => (Number(n) || 0).toLocaleString("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const money = (n) => fmt(n);

function addItem(description = "", hsn = "", bags = 0,
  qty = 0, unit = "KGS", rate = 0, ratePer = 100) {

  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td class="serial"></td>
    <td><input class="description" aria-label="Description"></td>
    <td><input class="hsn" aria-label="HSNC"></td>
    <td><input class="bags" type="number" min="0" step="any"
      aria-label="Bags"></td>
    <td><input class="qty" type="number" min="0" step="any"
      aria-label="Weight or quantity"></td>
    <td><input class="unit" aria-label="Unit"></td>
    <td><input class="rate" type="number" min="0" step="any"
      aria-label="Rate"></td>
    <td><input class="ratePer" type="number" min="0.000001"
      step="any" aria-label="Rate per"></td>
    <td class="value">0.00</td>
    <td class="no-print">
      <button type="button" class="remove-item">X</button>
    </td>
  `;

  tr.querySelector(".description").value = description;
  tr.querySelector(".hsn").value = hsn;
  tr.querySelector(".bags").value = bags;
  tr.querySelector(".qty").value = qty;
  tr.querySelector(".unit").value = unit;
  tr.querySelector(".rate").value = rate;
  tr.querySelector(".ratePer").value = ratePer;

  goodsBody.appendChild(tr);
  calculate();
}

goodsBody.addEventListener("input", calculate);

goodsBody.addEventListener("click", (event) => {
  if (event.target.classList.contains("remove-item")) {
    event.target.closest("tr").remove();
    calculate();
  }
});

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function calculate() {
  let goodsTotal = 0;
  let bagsTotal = 0;
  let qtyTotal = 0;

  const rows = [...goodsBody.querySelectorAll("tr")];

  rows.forEach((tr, index) => {
    tr.querySelector(".serial").textContent = index + 1;

    const bags = Math.max(0, Number(tr.querySelector(".bags").value) || 0);
    const qty = Math.max(0, Number(tr.querySelector(".qty").value) || 0);
    const rate = Math.max(0, Number(tr.querySelector(".rate").value) || 0);
    const ratePer = Math.max(0, Number(tr.querySelector(".ratePer").value) || 0);

    // Rate is charged per the entered rate-per quantity.
    const amount = ratePer > 0 ? round2(qty * rate / ratePer) : 0;

    tr.querySelector(".value").textContent = money(amount);

    goodsTotal += amount;
    bagsTotal += bags;
    qtyTotal += qty;
  });

  goodsTotal = round2(goodsTotal);

  get("totalBags").textContent = fmt(bagsTotal);
  get("totalQty").textContent = fmt(qtyTotal);
  get("goodsSubtotal").textContent = money(goodsTotal);

  const loading = Math.max(0, val("loadingCharge"));
  const mandi = round2(goodsTotal * Math.max(0, val("mandiRate")) / 100);
  const adhat = round2(goodsTotal * Math.max(0, val("adhatRate")) / 100);

  // Charges are added to the goods value before GST.
  const taxable = round2(goodsTotal + loading + mandi + adhat);

  const sgst = round2(taxable * Math.max(0, val("sgstRate")) / 100);
  const cgst = round2(taxable * Math.max(0, val("cgstRate")) / 100);
  const igst = round2(taxable * Math.max(0, val("igstRate")) / 100);

  const beforeRound = round2(taxable + sgst + cgst + igst);
  const net = Math.round(beforeRound);
  const roundOff = round2(net - beforeRound);

  get("loadingDisplay").textContent = money(loading);
  get("mandiAmount").textContent = money(mandi);
  get("adhatAmount").textContent = money(adhat);
  get("taxableValue").textContent = money(taxable);

  get("sgstAmount").textContent = sgst ? money(sgst) : "-";
  get("cgstAmount").textContent = cgst ? money(cgst) : "-";
  get("igstAmount").textContent = igst ? money(igst) : "-";

  get("roundOff").textContent = money(roundOff);
  get("netAmount").textContent = money(net);
  get("amountWords").textContent = amountInWords(net);

  get("signatureName").textContent =
    get("sellerName").value || "Business";
}

function amountInWords(amount) {
  if (!Number.isFinite(amount) || amount < 0) return "Invalid Amount";
  if (amount === 0) return "Zero Only";

  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six",
    "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
    "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"
  ];

  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty",
    "Sixty", "Seventy", "Eighty", "Ninety"
  ];

  function wordsBelowThousand(n) {
    let out = "";

    if (n >= 100) {
      out += ones[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }

    if (n >= 20) {
      out += tens[Math.floor(n / 10)] + " ";
      n %= 10;
    }

    if (n > 0) out += ones[n] + " ";

    return out.trim();
  }

  let n = Math.floor(amount);
  const parts = [];

  const groups = [
    [10000000, "Crore"],
    [100000, "Lakh"],
    [1000, "Thousand"],
    [1, ""]
  ];

  for (const [divisor, label] of groups) {
    const chunk = Math.floor(n / divisor);
    if (chunk > 0) {
      parts.push(
        wordsBelowThousand(chunk) + (label ? " " + label : "")
      );
      n %= divisor;
    }
  }

  return parts.join(" ").trim() + " Rupees Only";
}

// Recalculate when any charge or tax rate changes.
[
  "loadingCharge", "mandiRate", "adhatRate",
  "sgstRate", "cgstRate", "igstRate", "sellerName"
].forEach((id) => {
  get(id).addEventListener("input", calculate);
});

// Keep the invoice number and dates editable.
get("invoiceNo").addEventListener("input", () => {});
get("invoiceDate").addEventListener("change", () => {});

// Sample data matching the layout of the reference.
// Replace these values with your actual invoice details.
addItem("CHANA", "071320", 120, 9761, "KGS", 6955, 100);

calculate();
