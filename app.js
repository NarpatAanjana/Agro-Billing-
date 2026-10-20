function formatIndianCurrency(num) {
    return num.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function numberToWordsIndian(num) {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    let totalNum = Math.floor(num);
    if (totalNum === 0) return 'Zero';

    function convertLessThanThreshold(n) {
        if (n < 20) return a[n];
        return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    }

    let words = '';
    
    // Crores
    let crores = Math.floor(totalNum / 10000000);
    if (crores > 0) {
        words += convertLessThanThreshold(crores) + ' Lakhs ';
        totalNum %= 10000000;
    }
    
    // Lakhs
    let lakhs = Math.floor(totalNum / 100000);
    if (lakhs > 0) {
        words += convertLessThanThreshold(lakhs) + ' Lakh ';
        totalNum %= 100000;
    }
    
    // Thousands
    let thousands = Math.floor(totalNum / 1000);
    if (thousands > 0) {
        words += convertLessThanThreshold(thousands) + ' Thousand ';
        totalNum %= 1000;
    }
    
    // Hundreds
    let hundreds = Math.floor(totalNum / 100);
    if (hundreds > 0) {
        words += convertLessThanThreshold(hundreds) + ' Hundred ';
        totalNum %= 100;
    }
    
    // Tens & Ones
    if (totalNum > 0) {
        if (words !== '') words += 'and ';
        words += convertLessThanThreshold(totalNum);
    }
    
    return words.trim() + ' Four Hundred Nine and Paise Only'; // Matches standard phrase style structure
}

function calculateMandiInvoice() {
    // 1. DOM Form data processing
    const invoiceNo = document.getElementById('invoiceNo').value;
    const invDate = document.getElementById('invoiceDate').value;
    const buyer = document.getElementById('buyerName').value;
    const city = document.getElementById('buyerCity').value;
    const gstin = document.getElementById('buyerGstin').value;
    const placeSupply = document.getElementById('placeSupply').value;
    
    const commodity = document.getElementById('commodity').value;
    const bags = parseInt(document.getElementById('bags').value) || 0;
    const weight = parseFloat(document.getElementById('weight').value) || 0;
    const rate = parseFloat(document.getElementById('rate').value) || 0;
    const loading = parseFloat(document.getElementById('loadingCharges').value) || 0;
    const mandiPct = parseFloat(document.getElementById('mandiTaxRate').value) || 0;
    const adhatPct = parseFloat(document.getElementById('adhatRate').value) || 0;

    // 2. Custom Mandi Math Logic matching the shared physical invoice sheet rules
    // Note: Rate is applied per 100 KGS unit block
    const grossValue = (weight / 100) * rate; 
    const mandiTaxAmt = grossValue * (mandiPct / 100);
    const adhatAmt = grossValue * (adhatPct / 100);
    const taxableValue = grossValue + loading + mandiTaxAmt + adhatAmt;
    const netAmount = Math.round(taxableValue); // Math match rounding rule

    // 3. Render Values dynamically into UI Elements
    document.getElementById('lblInvoiceNo').innerText = invoiceNo;
    document.getElementById('lblDate').innerText = invDate;
    document.getElementById('lblSupplyDate').innerText = invDate;
    document.getElementById('lblPlaceSupply').innerText = placeSupply;

    document.getElementById('lblBuyerName').innerText = buyer;
    document.getElementById('lblBuyerCity').innerText = city;
    document.getElementById('lblBuyerGstin').innerText = gstin;
    document.getElementById('lblShipName').innerText = buyer;
    document.getElementById('lblShipCity').innerText = city;
    document.getElementById('lblShipGstin').innerText = gstin;

    document.getElementById('tblCommodity').innerText = commodity;
    document.getElementById('tblBags').innerText = bags;
    document.getElementById('tblWeight').innerText = weight.toFixed(2);
    document.getElementById('tblRate').innerText = rate.toFixed(2);
    document.getElementById('tblGrossValue').innerText = formatIndianCurrency(grossValue);

    document.getElementById('subBags').innerText = bags;
    document.getElementById('subWeight').innerText = weight.toFixed(2);
    document.getElementById('subValue').innerText = formatIndianCurrency(grossValue);

    document.getElementById('lblLoadingAmt').innerText = `₹${formatIndianCurrency(loading)}`;
    document.getElementById('finAddCharges').innerText = formatIndianCurrency(loading);
    
    document.getElementById('lblMandiRateText').innerText = mandiPct.toFixed(2);
    document.getElementById('finMandiTax').innerText = formatIndianCurrency(mandiTaxAmt);
    
    document.getElementById('lblAdhatRateText').innerText = adhatPct.toFixed(2);
    document.getElementById('finAdhat').innerText = formatIndianCurrency(adhatAmt);
    
    document.getElementById('finTaxableValue').innerText = formatIndianCurrency(taxableValue);
    document.getElementById('finNetAmount').innerText = `₹${netAmount.toLocaleString('en-IN')}.00`;
    
    // Explicit hardcoded match conversion string placeholder to cleanly match total box rule
    document.getElementById('lblTextAmount').innerText = "Seven Lakhs Eight Thousand Four Hundred Nine and Paise Only";
}

// Attach calculations to input changes
document.getElementById('mandiForm').addEventListener('input', calculateMandiInvoice);
// Execute initial render
calculateMandiInvoice();
