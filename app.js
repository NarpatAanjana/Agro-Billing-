function calculateBill() {
    // 1. Fetch input values from HTML DOM elements
    const seller = document.getElementById('sellerName').value;
    const buyer = document.getElementById('buyerName').value;
    const commodity = document.getElementById('commodity').value;
    const grossWeight = parseFloat(document.getElementById('grossWeight').value) || 0;
    const rate = parseFloat(document.getElementById('ratePerQuintal').value) || 0;
    const moisturePct = parseFloat(document.getElementById('moistureDeduction').value) || 0;
    const mandiRate = parseFloat(document.getElementById('mandiFeeRate').value) || 0;
    const commRate = parseFloat(document.getElementById('commissionRate').value) || 0;
    const labor = parseFloat(document.getElementById('laborCharges').value) || 0;

    // 2. Perform agro-commodity mathematical tracking calculations
    const grossTotal = grossWeight * rate;
    const moistureAmt = grossTotal * (moisturePct / 100);
    const netCropValue = grossTotal - moistureAmt;
    const netWeight = grossWeight * (1 - (moisturePct / 100));

    const mandiAmt = netCropValue * (mandiRate / 100);
    const commAmt = netCropValue * (commRate / 100);
    const grandTotal = netCropValue + mandiAmt + commAmt + labor;

    // 3. Render and format numerical totals dynamically into the invoice display view
    document.getElementById('invDate').innerText = new Date().toLocaleDateString('en-IN');
    document.getElementById('outSeller').innerText = seller;
    document.getElementById('outBuyer').innerText = buyer;
    document.getElementById('outCommodity').innerText = commodity;
    
    document.getElementById('outWeightRate').innerText = `${grossWeight.toFixed(2)} Qtl @ ₹${rate.toLocaleString('en-IN')}`;
    document.getElementById('outGrossTotal').innerText = `₹${grossTotal.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    
    document.getElementById('outMoisturePercent').innerText = `${moisturePct.toFixed(1)}%`;
    document.getElementById('outMoistureAmt').innerText = `-₹${moistureAmt.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    
    document.getElementById('outNetWeight').innerText = `${netWeight.toFixed(2)} Qtl`;
    document.getElementById('outNetCropValue').innerText = `₹${netCropValue.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    
    document.getElementById('outMandiRate').innerText = `${mandiRate.toFixed(2)}%`;
    document.getElementById('outMandiAmt').innerText = `₹${mandiAmt.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    
    document.getElementById('outCommRate').innerText = `${commRate.toFixed(2)}%`;
    document.getElementById('outCommAmt').innerText = `₹${commAmt.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    
    document.getElementById('outLaborAmt').innerText = `₹${labor.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('outGrandTotal').innerText = `₹${grandTotal.toLocaleString('en-IN', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
}

// PDF Document generation trigger using html2pdf
function generateInvoicePDF() {
    const element = document.getElementById('invoiceContainer');
    const clientName = document.getElementById('buyerName').value.replace(/\s+/g, '_');
    
    const opt = {
        margin:       10,
        filename:     `AgroBill_${clientName}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
}

// Bind live continuous calculation events to form changes
document.getElementById('billForm').addEventListener('input', calculateBill);

// Initial application boot logic calculation execution
calculateBill();
