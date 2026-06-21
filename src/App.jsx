import { useState, useRef, forwardRef, useEffect } from "react";

// ── SUPABASE CONFIG ────────────────────────────────────────────────────────────
const SUPA_URL = "https://asfdgwvgvgnngjqmimgi.supabase.co";
const SUPA_KEY = "sb_publishable_i0V0N7RhqEdb1J69Yhgleg_WCa1o7qY";

const supa = async (path, method = "GET", body = null) => {
  const res = await fetch(`${SUPA_URL}/rest/v1${path}`, {
    method,
    headers: {
      "apikey": SUPA_KEY,
      "Authorization": `Bearer ${SUPA_KEY}`,
      "Content-Type": "application/json",
      "Prefer": method === "POST" ? "return=representation" : "",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) { const e = await res.text(); throw new Error(e); }
  if (res.status === 204) return null;
  return res.json();
};

// ── CONSTANTS ──────────────────────────────────────────────────────────────────
const BRAG = {
  bank: "Kotak Mahindra Bank, Gurgaon",
  accountName: "Brag Systems",
  accountNo: "1907202009",
  ifsc: "KKBK0000287",
  upi: "bragsystems@kotak",
};

const DOC_TYPES = ["Tax Invoice", "Proforma Invoice", "Quotation"];

const emptyItem = () => ({
  id: Date.now() + Math.random(),
  description: "", hsnSac: "", qty: "", unit: "NOS", rate: "", amount: "",
});

const formatINR = (val) => {
  const n = parseFloat(val) || 0;
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const numberToWords = (num) => {
  const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine",
    "Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  if (num === 0) return "Zero";
  const convert = (n) => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? " " + ones[n%10] : "");
    if (n < 1000) return ones[Math.floor(n/100)] + " Hundred" + (n%100 ? " " + convert(n%100) : "");
    if (n < 100000) return convert(Math.floor(n/1000)) + " Thousand" + (n%1000 ? " " + convert(n%1000) : "");
    if (n < 10000000) return convert(Math.floor(n/100000)) + " Lakh" + (n%100000 ? " " + convert(n%100000) : "");
    return convert(Math.floor(n/10000000)) + " Crore" + (n%10000000 ? " " + convert(n%10000000) : "");
  };
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  return convert(rupees) + " Rupees" + (paise > 0 ? " and " + convert(paise) + " Paise" : "") + " Only";
};

const today = () => new Date().toISOString().split("T")[0];
const addDays = (d, n) => { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt.toISOString().split("T")[0]; };
const fmtDate = (d) => {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${parseInt(day)}-${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(m)-1]}-${y}`;
};

// ── BUILD PRINT HTML ───────────────────────────────────────────────────────────
function buildPrintHTML(props) {
  const { docType, invoiceNo, invoiceDate, dueDate, poRef, vehicleNo, lrNo,
    modeOfTransport, incoterms, placeOfSupply, clientName, clientAddress,
    clientGstin, clientPhone, clientEmail, items, taxType, taxRate, taxable, tax, grand, notes } = props;

  const fmtN = (v) => parseFloat(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });

  const docRows = [
    ["No.", invoiceNo], ["Date", fmtDate(invoiceDate)],
    ...(docType !== "Quotation" ? [["Due Date", fmtDate(dueDate)]] : []),
    ...(poRef ? [["PO / Ref", poRef]] : []),
  ].map(([k,v]) => `<tr><td style="color:#888;padding-right:8px;padding-bottom:2px;text-align:right;font-size:9px">${k}</td><td style="font-weight:bold;text-align:right;font-size:9px">${v}</td></tr>`).join("");

  const transportRows = [
    ["Mode of Transport", modeOfTransport||"—"],["Vehicle No.", vehicleNo||"—"],
    ["LR / Way Bill No.", lrNo||"—"],["Delivery Terms", incoterms||"—"],
  ].map(([k,v]) => `<tr><td style="color:#777;width:48%;padding-bottom:3px;font-size:9px">${k}</td><td style="font-weight:bold;font-size:9px">${v}</td></tr>`).join("");

  const itemRows = items.map((it, idx) => `
    <tr style="background:${idx%2===0?"#fff":"#f9f9f9"}">
      <td class="tc" style="text-align:center">${idx+1}</td>
      <td class="tc">${it.description||""}</td>
      <td class="tc" style="text-align:center">${it.hsnSac||""}</td>
      <td class="tc" style="text-align:center">${it.qty||""}</td>
      <td class="tc" style="text-align:center">${it.unit||""}</td>
      <td class="tc" style="text-align:right">${it.rate?fmtN(it.rate):""}</td>
      <td class="tc" style="text-align:right;font-weight:bold">${it.amount?fmtN(it.amount):""}</td>
    </tr>`).join("");

  const emptyRows = items.length < 5 ? Array(5-items.length).fill(0).map(()=>
    `<tr>${Array(7).fill(0).map(()=>`<td class="tc" style="padding:12px 7px">&nbsp;</td>`).join("")}</tr>`).join("") : "";

  const totalQty = items.reduce((s,it)=>s+(parseFloat(it.qty)||0),0);

  let taxRows = "";
  if (taxType==="IGST") taxRows=`<tr><td class="sc" style="padding:5px 8px">IGST @ ${taxRate}%</td><td class="sc" style="text-align:right;padding:5px 8px">${fmtN(tax)}</td></tr>`;
  else if (taxType==="CGST+SGST") taxRows=`
    <tr><td class="sc" style="padding:5px 8px">CGST @ ${taxRate/2}%</td><td class="sc" style="text-align:right;padding:5px 8px">${fmtN(tax/2)}</td></tr>
    <tr><td class="sc" style="padding:5px 8px">SGST @ ${taxRate/2}%</td><td class="sc" style="text-align:right;padding:5px 8px">${fmtN(tax/2)}</td></tr>`;
  else taxRows=`<tr><td class="sc" style="padding:5px 8px">Tax (Nil/Exempt)</td><td class="sc" style="text-align:right;padding:5px 8px">0.00</td></tr>`;

  const bankRows = [["Bank",BRAG.bank],["Account Name",BRAG.accountName],["A/c No.",BRAG.accountNo],["IFSC",BRAG.ifsc],["UPI",BRAG.upi]]
    .map(([k,v])=>`<tr><td style="color:#777;padding-right:12px;padding-bottom:3px;width:90px;font-size:9px">${k}</td><td style="font-weight:bold;font-size:9px">${v}</td></tr>`).join("");

  const clientExtra = [clientPhone,clientEmail].filter(Boolean).join(" &nbsp;|&nbsp; ");
  const termsHtml = (notes||"").replace(/\n/g,"<br/>");

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<title>${docType} - ${invoiceNo}</title>
<style>
  @page{size:A4;margin:10mm 12mm}
  *{margin:0;padding:0;box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  body{font-family:Arial,sans-serif;font-size:10px;color:#111;background:#fff}
  table{width:100%;border-collapse:collapse}
  .tc{border:1px solid #999;padding:5px 7px;font-size:10px;vertical-align:top}
  .th{border:1px solid #444;padding:5px 7px;font-size:9px;font-weight:bold;background:#1a1a1a;color:#fff;text-align:center}
  .bc{border:1px solid #999;padding:6px 8px;vertical-align:top}
  .sc{border-bottom:1px solid #ccc;font-size:10px}
</style></head><body>
<table style="margin-bottom:6px"><tr>
  <td style="width:58%;padding-right:10px;vertical-align:top">
    <div style="font-size:22px;font-weight:900;letter-spacing:2px;line-height:1">BRAG SYSTEMS</div>
    <div style="font-size:8.5px;color:#E59215;font-weight:bold;margin:3px 0 5px">India's Grain Storage Execution Partner</div>
    <div style="font-size:8.5px;color:#555;line-height:1.7">Eco Tower, Cyberwalk Tech Park, IMT Manesar, Gurugram — 122051, Haryana<br/>
    GSTIN: <strong>06CUEPS5377Q1ZN</strong> &nbsp;|&nbsp; PAN: <strong>CUEPS5377Q</strong><br/>
    Ph: 7817805947 &nbsp;|&nbsp; bragsystems@gmail.com</div>
  </td>
  <td style="width:42%;vertical-align:top;text-align:right">
    <div style="font-size:19px;font-weight:bold;color:#E59215;letter-spacing:1px">${docType.toUpperCase()}</div>
    ${docType==="Tax Invoice"?`<div style="font-size:8px;color:#888;margin-bottom:4px">ORIGINAL FOR RECIPIENT</div>`:""}
    <table style="margin-left:auto;width:auto">${docRows}</table>
  </td>
</tr></table>
<div style="border-top:3px solid #E59215;margin-bottom:7px"></div>
<table style="margin-bottom:7px"><tr>
  <td class="bc" style="width:54%;background:#fafafa">
    <div style="font-size:8px;font-weight:bold;color:#E59215;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Bill To</div>
    <div style="font-weight:bold;font-size:11px;margin-bottom:2px">${clientName||"—"}</div>
    <div style="font-size:9px;color:#444;line-height:1.6;white-space:pre-line">${clientAddress||""}</div>
    ${clientExtra?`<div style="font-size:9px;margin-top:2px">${clientExtra}</div>`:""}
    ${clientGstin?`<div style="font-size:9px;margin-top:2px"><strong>GSTIN:</strong> ${clientGstin}</div>`:""}
    ${placeOfSupply?`<div style="font-size:9px"><strong>Place of Supply:</strong> ${placeOfSupply}</div>`:""}
  </td>
  <td class="bc" style="width:46%;border-left:none;background:#fafafa">
    <div style="font-size:8px;font-weight:bold;color:#E59215;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Dispatch / Transport</div>
    <table style="width:100%">${transportRows}</table>
  </td>
</tr></table>
<table style="margin-bottom:7px">
  <thead><tr>
    <th class="th" style="width:28px">Sr.</th>
    <th class="th" style="text-align:left">Description of Goods / Services</th>
    <th class="th">HSN/SAC</th><th class="th">Qty</th><th class="th">Unit</th>
    <th class="th">Rate (INR)</th><th class="th">Amount (INR)</th>
  </tr></thead>
  <tbody>${itemRows}${emptyRows}
    <tr style="background:#efefef">
      <td class="tc" colspan="3" style="text-align:right;font-weight:bold">Total</td>
      <td class="tc" style="text-align:center;font-weight:bold">${totalQty}</td>
      <td class="tc"></td><td class="tc"></td>
      <td class="tc" style="text-align:right;font-weight:bold">${fmtN(taxable)}</td>
    </tr>
  </tbody>
</table>
<table style="margin-bottom:7px"><tr>
  <td class="bc" style="width:54%;vertical-align:top">
    <div style="font-size:8px;font-weight:bold;color:#E59215;margin-bottom:4px">PAYMENT DETAILS</div>
    <table style="width:auto">${bankRows}</table>
  </td>
  <td style="width:46%;vertical-align:top;border-left:1px solid #999;padding:0">
    <table>
      <tr><td class="sc" style="padding:5px 8px">Taxable Amount</td><td class="sc" style="text-align:right;padding:5px 8px">${fmtN(taxable)}</td></tr>
      ${taxRows}
      <tr style="background:#1a1a1a">
        <td style="padding:7px 8px;font-weight:bold;font-size:12px;color:#E59215">GRAND TOTAL</td>
        <td style="padding:7px 8px;text-align:right;font-weight:bold;font-size:12px;color:#fff">INR ${fmtN(grand)}</td>
      </tr>
    </table>
    <div style="padding:5px 8px;font-size:8.5px;color:#555;font-style:italic;border-top:1px solid #ccc">${numberToWords(grand)}</div>
  </td>
</tr></table>
<table style="margin-bottom:7px"><tr>
  <td class="bc" style="width:60%;vertical-align:top">
    <div style="font-size:8px;font-weight:bold;color:#E59215;margin-bottom:3px">TERMS & CONDITIONS</div>
    <div style="font-size:9px;color:#444;line-height:1.7">${termsHtml}</div>
  </td>
  <td class="bc" style="width:40%;border-left:none;text-align:center;vertical-align:top">
    <div style="font-size:8px;font-weight:bold;color:#E59215;margin-bottom:4px">For BRAG SYSTEMS</div>
    <div style="height:48px"></div>
    <div style="border-top:1px solid #999;padding-top:4px;font-size:9px;color:#666">Authorised Signatory</div>
  </td>
</tr></table>
<div style="border-top:1px solid #E59215;padding-top:4px;text-align:center;font-size:7.5px;color:#aaa">
  Computer generated document — no signature required &nbsp;|&nbsp; bragsystems@gmail.com &nbsp;|&nbsp; 7817805947 &nbsp;|&nbsp; www.bragsystems.com
</div>
<script>window.onload=function(){window.print();window.close();}</script>
</body></html>`;
}

// ── MAIN APP ───────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("form");
  const [appTab, setAppTab] = useState("invoice"); // invoice | clients | history

  // Invoice fields
  const [docType, setDocType] = useState("Tax Invoice");
  const [invoiceNo, setInvoiceNo] = useState("BS/2026-27/001");
  const [invoiceDate, setInvoiceDate] = useState(today());
  const [dueDate, setDueDate] = useState(addDays(today(), 30));
  const [poRef, setPoRef] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [lrNo, setLrNo] = useState("");
  const [modeOfTransport, setModeOfTransport] = useState("");
  const [incoterms, setIncoterms] = useState("");
  const [placeOfSupply, setPlaceOfSupply] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientGstin, setClientGstin] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [items, setItems] = useState([emptyItem()]);
  const [taxType, setTaxType] = useState("IGST");
  const [taxRate, setTaxRate] = useState(18);
  const [notes, setNotes] = useState("50% advance, balance after completion.\nGoods once sold will not be taken back.\nSubject to Gurugram jurisdiction.");

  // DB state
  const [savedClients, setSavedClients] = useState([]);
  const [savedInvoices, setSavedInvoices] = useState([]);
  const [showClientDD, setShowClientDD] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  const taxable = items.reduce((s, it) => s + (parseFloat(it.amount) || 0), 0);
  const tax = (taxable * taxRate) / 100;
  const grand = taxable + (taxType === "Nil" ? 0 : tax);

  const printProps = { docType, invoiceNo, invoiceDate, dueDate, poRef, vehicleNo, lrNo, modeOfTransport, incoterms, placeOfSupply, clientName, clientAddress, clientGstin, clientPhone, clientEmail, items, taxType, taxRate, taxable, tax, grand, notes };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  // Load clients from Supabase
  const fetchClients = async () => {
    setLoadingClients(true);
    try {
      const data = await supa("/clients?order=created_at.desc");
      setSavedClients(data || []);
    } catch(e) { showToast("Error loading clients"); }
    setLoadingClients(false);
  };

  // Load invoices from Supabase
  const fetchInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const data = await supa("/invoices?order=created_at.desc&limit=50");
      setSavedInvoices(data || []);
    } catch(e) { showToast("Error loading invoices"); }
    setLoadingInvoices(false);
  };

  useEffect(() => { fetchClients(); }, []);

  // Save client
  const saveClient = async () => {
    if (!clientName.trim()) { showToast("Enter client name first"); return; }
    setSaving(true);
    try {
      const existing = savedClients.find(c => c.name === clientName);
      if (existing) {
        await supa(`/clients?id=eq.${existing.id}`, "PATCH", {
          address: clientAddress, gstin: clientGstin, phone: clientPhone,
          email: clientEmail, place_of_supply: placeOfSupply,
        });
        showToast(`"${clientName}" updated ✓`);
      } else {
        await supa("/clients", "POST", {
          name: clientName, address: clientAddress, gstin: clientGstin,
          phone: clientPhone, email: clientEmail, place_of_supply: placeOfSupply,
        });
        showToast(`"${clientName}" saved ✓`);
      }
      fetchClients();
    } catch(e) { showToast("Error saving client: " + e.message); }
    setSaving(false);
  };

  // Save invoice
  const saveInvoice = async () => {
    setSaving(true);
    try {
      await supa("/invoices", "POST", {
        doc_type: docType, invoice_no: invoiceNo, invoice_date: invoiceDate,
        due_date: dueDate, client_name: clientName, client_gstin: clientGstin,
        taxable, tax, grand_total: grand, data: printProps,
      });
      showToast(`Invoice ${invoiceNo} saved ✓`);
      fetchInvoices();
    } catch(e) { showToast("Error saving invoice: " + e.message); }
    setSaving(false);
  };

  const loadClient = (c) => {
    setClientName(c.name); setClientAddress(c.address||"");
    setClientGstin(c.gstin||""); setClientPhone(c.phone||"");
    setClientEmail(c.email||""); setPlaceOfSupply(c.place_of_supply||"");
    setShowClientDD(false); showToast(`Loaded "${c.name}" ✓`);
  };

  const deleteClient = async (id, name, e) => {
    e.stopPropagation();
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await supa(`/clients?id=eq.${id}`, "DELETE");
      showToast(`"${name}" deleted`);
      fetchClients();
    } catch(e) { showToast("Error deleting"); }
  };

  const loadInvoice = (inv) => {
    const d = inv.data;
    if (!d) return;
    setDocType(d.docType||"Tax Invoice"); setInvoiceNo(d.invoiceNo||"");
    setInvoiceDate(d.invoiceDate||today()); setDueDate(d.dueDate||"");
    setPoRef(d.poRef||""); setVehicleNo(d.vehicleNo||""); setLrNo(d.lrNo||"");
    setModeOfTransport(d.modeOfTransport||""); setIncoterms(d.incoterms||"");
    setPlaceOfSupply(d.placeOfSupply||""); setClientName(d.clientName||"");
    setClientAddress(d.clientAddress||""); setClientGstin(d.clientGstin||"");
    setClientPhone(d.clientPhone||""); setClientEmail(d.clientEmail||"");
    setItems(d.items||[emptyItem()]); setTaxType(d.taxType||"IGST");
    setTaxRate(d.taxRate||18); setNotes(d.notes||"");
    setAppTab("invoice"); setTab("form");
    showToast(`Loaded ${inv.invoice_no} ✓`);
  };

  const deleteInvoice = async (id, no, e) => {
    e.stopPropagation();
    if (!confirm(`Delete invoice ${no}?`)) return;
    try {
      await supa(`/invoices?id=eq.${id}`, "DELETE");
      showToast(`Invoice ${no} deleted`);
      fetchInvoices();
    } catch(e) { showToast("Error deleting"); }
  };

  const handlePrint = () => {
    const html = buildPrintHTML(printProps);
    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
  };

  const updateItem = (id, field, value) => {
    setItems(prev => prev.map(it => {
      if (it.id !== id) return it;
      const u = { ...it, [field]: value };
      if (field === "qty" || field === "rate") {
        const q = parseFloat(field==="qty"?value:it.qty)||0;
        const r = parseFloat(field==="rate"?value:it.rate)||0;
        u.amount = (q*r).toFixed(2);
      }
      return u;
    }));
  };

  const I = "w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-orange-400 bg-white";
  const L = "block text-xs font-semibold text-gray-500 mb-1";

  return (
    <div className="min-h-screen bg-gray-100">
      {/* TOAST */}
      {toast && (
        <div className="fixed top-16 right-4 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-xl z-50 transition-all">
          {toast}
        </div>
      )}

      {/* TOPBAR */}
      <div className="bg-gray-900 text-white px-4 py-2.5 flex items-center justify-between sticky top-0 z-40 shadow-lg">
        <span className="text-orange-400 font-black text-lg tracking-widest">BRAG SYSTEMS</span>
        <div className="flex gap-1.5">
          {[["invoice","Invoice"],["clients","Clients"],["history","History"]].map(([k,v]) => (
            <button key={k} onClick={() => { setAppTab(k); if(k==="clients") fetchClients(); if(k==="history") fetchInvoices(); }}
              className={`text-xs px-3 py-1.5 rounded font-semibold transition-all ${appTab===k?"bg-orange-500 text-white":"bg-gray-700 text-gray-300 hover:bg-gray-600"}`}>
              {v}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {appTab==="invoice" && <>
            {["form","preview"].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`text-xs px-3 py-1.5 rounded capitalize font-semibold transition-all ${tab===t?"bg-orange-500 text-white":"bg-gray-700 text-gray-300 hover:bg-gray-600"}`}>
                {t==="form"?"Edit":"Preview"}
              </button>
            ))}
            <button onClick={saveInvoice} disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded font-bold disabled:opacity-50">
              {saving?"Saving...":"Save"}
            </button>
            <button onClick={handlePrint} className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1.5 rounded font-bold">
              Print/PDF
            </button>
          </>}
        </div>
      </div>

      {/* ── INVOICE TAB ── */}
      {appTab === "invoice" && tab === "form" && (
        <div className="max-w-3xl mx-auto p-4 space-y-4 pb-10">

          <div className="bg-white rounded-lg shadow p-4">
            <p className={L}>Document Type</p>
            <div className="flex gap-2 flex-wrap">
              {DOC_TYPES.map(t => (
                <button key={t} onClick={() => setDocType(t)}
                  className={`px-4 py-1.5 rounded text-sm font-semibold border-2 transition-all ${docType===t?"border-orange-500 bg-orange-50 text-orange-700":"border-gray-200 text-gray-500 hover:border-orange-300"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <p className="font-bold text-gray-700 text-sm mb-3">Document Details</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={L}>Invoice / Doc No.</label><input className={I} value={invoiceNo} onChange={e=>setInvoiceNo(e.target.value)} /></div>
              <div><label className={L}>Date</label><input type="date" className={I} value={invoiceDate} onChange={e=>{setInvoiceDate(e.target.value);setDueDate(addDays(e.target.value,30));}} /></div>
              {docType!=="Quotation" && <div><label className={L}>Due Date</label><input type="date" className={I} value={dueDate} onChange={e=>setDueDate(e.target.value)} /></div>}
              <div><label className={L}>PO / Reference No.</label><input className={I} value={poRef} onChange={e=>setPoRef(e.target.value)} placeholder="e.g. PO/0168/25-26" /></div>
              <div><label className={L}>Place of Supply</label><input className={I} value={placeOfSupply} onChange={e=>setPlaceOfSupply(e.target.value)} placeholder="e.g. Uttar Pradesh" /></div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <p className="font-bold text-gray-700 text-sm mb-3">Transport & Dispatch</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={L}>Mode of Transport</label>
                <select className={I} value={modeOfTransport} onChange={e=>setModeOfTransport(e.target.value)}>
                  <option value="">-- Select --</option>
                  {["Road","Rail","Air","Sea","Courier","N/A (Service)"].map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
              <div><label className={L}>Vehicle No.</label><input className={I} value={vehicleNo} onChange={e=>setVehicleNo(e.target.value)} placeholder="e.g. HR26AT1234" /></div>
              <div><label className={L}>LR / e-Way Bill No.</label><input className={I} value={lrNo} onChange={e=>setLrNo(e.target.value)} /></div>
              <div><label className={L}>Delivery Terms</label>
                <select className={I} value={incoterms} onChange={e=>setIncoterms(e.target.value)}>
                  <option value="">-- Select --</option>
                  {["Ex-Works","FOR Destination","Door Delivery","CIF","FOB","N/A (Service)"].map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-gray-700 text-sm">Bill To</p>
              <div className="flex gap-2 items-center">
                <div className="relative">
                  <button onClick={() => { setShowClientDD(!showClientDD); }}
                    className="text-xs px-3 py-1 rounded border border-gray-300 text-gray-600 hover:border-orange-400 font-semibold">
                    {loadingClients ? "Loading..." : `Saved (${savedClients.length})`}
                  </button>
                  {showClientDD && (
                    <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-xl z-50 w-72 max-h-64 overflow-y-auto">
                      {savedClients.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-500">No saved clients yet</div>
                      ) : savedClients.map(c => (
                        <div key={c.id} onClick={() => loadClient(c)}
                          className="flex items-center justify-between px-3 py-2.5 hover:bg-orange-50 cursor-pointer border-b border-gray-100">
                          <div>
                            <div className="text-sm font-semibold text-gray-800">{c.name}</div>
                            <div className="text-xs text-gray-400">{c.gstin || c.phone || ""}</div>
                          </div>
                          <button onClick={(e) => deleteClient(c.id, c.name, e)} className="text-red-400 hover:text-red-600 text-xs ml-2 px-1">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={saveClient} disabled={saving}
                  className="text-xs px-3 py-1 rounded bg-orange-500 text-white hover:bg-orange-600 font-semibold disabled:opacity-50">
                  {saving ? "..." : "Save Client"}
                </button>
              </div>
            </div>
            <div className="space-y-3">
              <div><label className={L}>Company / Client Name</label><input className={I} value={clientName} onChange={e=>setClientName(e.target.value)} placeholder="e.g. Pasupati Acrylon Ltd" /></div>
              <div><label className={L}>Address</label><textarea className={I} rows={3} value={clientAddress} onChange={e=>setClientAddress(e.target.value)} placeholder="Full address with district, state, PIN" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={L}>Phone</label><input className={I} value={clientPhone} onChange={e=>setClientPhone(e.target.value)} placeholder="+91 98765 43210" /></div>
                <div><label className={L}>Email</label><input className={I} value={clientEmail} onChange={e=>setClientEmail(e.target.value)} placeholder="purchase@client.com" /></div>
              </div>
              <div><label className={L}>GSTIN</label><input className={I} value={clientGstin} onChange={e=>setClientGstin(e.target.value)} placeholder="15-digit GSTIN" /></div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <p className="font-bold text-gray-700 text-sm mb-3">Line Items</p>
            <div className="space-y-3">
              {items.map((it, idx) => (
                <div key={it.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-orange-600">Item {idx+1}</span>
                    {items.length>1 && <button onClick={()=>setItems(p=>p.filter(i=>i.id!==it.id))} className="text-red-400 text-xs">✕ Remove</button>}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2"><label className={L}>Description</label><input className={I} value={it.description} onChange={e=>updateItem(it.id,"description",e.target.value)} placeholder="Product / Service name" /></div>
                    <div><label className={L}>HSN / SAC</label><input className={I} value={it.hsnSac} onChange={e=>updateItem(it.id,"hsnSac",e.target.value)} /></div>
                    <div><label className={L}>Unit</label>
                      <select className={I} value={it.unit} onChange={e=>updateItem(it.id,"unit",e.target.value)}>
                        {["NOS","BOX","KG","MT","LTR","SET","JOB","RMT","SQM","LOT","PCS"].map(u=><option key={u}>{u}</option>)}
                      </select>
                    </div>
                    <div><label className={L}>Qty</label><input type="number" className={I} value={it.qty} onChange={e=>updateItem(it.id,"qty",e.target.value)} /></div>
                    <div><label className={L}>Rate (INR)</label><input type="number" className={I} value={it.rate} onChange={e=>updateItem(it.id,"rate",e.target.value)} /></div>
                    <div className="col-span-2"><label className={L}>Amount (auto)</label><input className={`${I} bg-orange-50 font-semibold text-orange-700`} readOnly value={it.amount?formatINR(it.amount):"0.00"} /></div>
                  </div>
                </div>
              ))}
              <button onClick={()=>setItems(p=>[...p,emptyItem()])} className="text-orange-600 text-sm font-semibold">+ Add Item</button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <p className="font-bold text-gray-700 text-sm mb-3">Tax</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div><label className={L}>Tax Type</label>
                <select className={I} value={taxType} onChange={e=>setTaxType(e.target.value)}>
                  <option value="IGST">IGST — Inter-state</option>
                  <option value="CGST+SGST">CGST + SGST — Intra-state</option>
                  <option value="Nil">Nil / Exempt</option>
                </select>
              </div>
              <div><label className={L}>Rate (%)</label>
                <select className={I} value={taxRate} onChange={e=>setTaxRate(parseFloat(e.target.value))}>
                  {[0,5,12,18,28].map(r=><option key={r} value={r}>{r}%</option>)}
                </select>
              </div>
            </div>
            <div className="bg-gray-50 rounded p-3 text-sm space-y-1.5">
              <div className="flex justify-between"><span className="text-gray-600">Taxable</span><span className="font-semibold">INR {formatINR(taxable)}</span></div>
              {taxType==="IGST" && <div className="flex justify-between"><span className="text-gray-600">IGST @ {taxRate}%</span><span className="font-semibold">INR {formatINR(tax)}</span></div>}
              {taxType==="CGST+SGST" && <>
                <div className="flex justify-between"><span className="text-gray-600">CGST @ {taxRate/2}%</span><span className="font-semibold">INR {formatINR(tax/2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">SGST @ {taxRate/2}%</span><span className="font-semibold">INR {formatINR(tax/2)}</span></div>
              </>}
              <div className="flex justify-between font-bold text-base border-t pt-2 text-orange-700">
                <span>Grand Total</span><span>INR {formatINR(grand)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <p className="font-bold text-gray-700 text-sm mb-3">Terms & Notes</p>
            <textarea className={I} rows={4} value={notes} onChange={e=>setNotes(e.target.value)} />
          </div>
        </div>
      )}

      {appTab === "invoice" && tab === "preview" && (
        <div className="max-w-3xl mx-auto p-4">
          <p className="text-center text-xs text-gray-500 mb-3">Preview — click Print/PDF to save</p>
          <div className="shadow-xl rounded overflow-hidden border border-gray-200 bg-white p-4"
            dangerouslySetInnerHTML={{ __html: buildPrintHTML(printProps)
              .replace(/<!DOCTYPE.*?<body[^>]*>/s,"").replace(/<\/body>.*$/s,"").replace(/<script[\s\S]*?<\/script>/gi,"") }} />
        </div>
      )}

      {/* ── CLIENTS TAB ── */}
      {appTab === "clients" && (
        <div className="max-w-3xl mx-auto p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-gray-700 text-lg">Saved Clients</h2>
            <button onClick={fetchClients} className="text-xs text-orange-600 font-semibold hover:underline">↺ Refresh</button>
          </div>
          {loadingClients ? (
            <div className="text-center text-gray-500 py-10">Loading...</div>
          ) : savedClients.length === 0 ? (
            <div className="text-center text-gray-400 py-10 bg-white rounded-lg shadow">No clients saved yet. Save from the Invoice tab.</div>
          ) : (
            <div className="space-y-2">
              {savedClients.map(c => (
                <div key={c.id} className="bg-white rounded-lg shadow p-4 flex justify-between items-start">
                  <div onClick={() => { loadClient(c); setAppTab("invoice"); }}
                    className="cursor-pointer flex-1">
                    <div className="font-bold text-gray-800">{c.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{c.address}</div>
                    <div className="text-xs text-gray-400 mt-1 flex gap-3">
                      {c.gstin && <span>GSTIN: {c.gstin}</span>}
                      {c.phone && <span>{c.phone}</span>}
                      {c.email && <span>{c.email}</span>}
                    </div>
                  </div>
                  <button onClick={(e) => deleteClient(c.id, c.name, e)}
                    className="text-red-400 hover:text-red-600 text-sm ml-4">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {appTab === "history" && (
        <div className="max-w-3xl mx-auto p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-gray-700 text-lg">Invoice History</h2>
            <button onClick={fetchInvoices} className="text-xs text-orange-600 font-semibold hover:underline">↺ Refresh</button>
          </div>
          {loadingInvoices ? (
            <div className="text-center text-gray-500 py-10">Loading...</div>
          ) : savedInvoices.length === 0 ? (
            <div className="text-center text-gray-400 py-10 bg-white rounded-lg shadow">No invoices saved yet. Use the Save button on the Invoice tab.</div>
          ) : (
            <div className="space-y-2">
              {savedInvoices.map(inv => (
                <div key={inv.id} className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
                  <div onClick={() => loadInvoice(inv)} className="cursor-pointer flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-800">{inv.invoice_no}</span>
                      <span className={`text-xs px-2 py-0.5 rounded font-semibold ${inv.doc_type==="Tax Invoice"?"bg-orange-100 text-orange-700":inv.doc_type==="Proforma Invoice"?"bg-blue-100 text-blue-700":"bg-gray-100 text-gray-600"}`}>
                        {inv.doc_type}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 mt-1">{inv.client_name}</div>
                    <div className="text-xs text-gray-400 mt-1 flex gap-3">
                      <span>{fmtDate(inv.invoice_date)}</span>
                      <span className="font-semibold text-orange-600">INR {parseFloat(inv.grand_total||0).toLocaleString("en-IN",{minimumFractionDigits:2})}</span>
                    </div>
                  </div>
                  <button onClick={(e) => deleteInvoice(inv.id, inv.invoice_no, e)}
                    className="text-red-400 hover:text-red-600 text-sm ml-4">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
