import { useState, useEffect, useRef, useCallback } from "react";

// ─── SHARED STYLES (module level) ─────────────────────────────────────────────
const inpSt = {width:"100%",border:"1px solid #d1d5db",borderRadius:"6px",padding:"7px 10px",fontSize:"13px",fontWeight:"normal",color:"#1f2937",background:"#fff",outline:"none",boxSizing:"border-box",fontFamily:"Arial,sans-serif"};
const lblSt = {display:"block",fontSize:"11px",fontWeight:500,color:"#6b7280",marginBottom:"4px"};

// ─── INPUT COMPONENTS ─────────────────────────────────────────────────────────
// Uses local ref + local state so parent re-renders never steal focus.
// Parent value is synced on mount and when it changes externally (loadClient etc)
function Input({label, value, onChange, placeholder, type}) {
  const [local, setLocal] = useState(value||"");
  const prev = useRef(value);
  // Only sync from parent when value changes externally (e.g. loadClient)
  if (prev.current !== value) { prev.current = value; setLocal(value||""); }
  return (
    <div>
      <div style={lblSt}>{label}</div>
      <input
        style={inpSt}
        type={type||"text"}
        value={local}
        placeholder={placeholder||""}
        onChange={e => { setLocal(e.target.value); onChange(e.target.value); }}
      />
    </div>
  );
}
function Textarea({label, value, onChange, placeholder, rows}) {
  const [local, setLocal] = useState(value||"");
  const prev = useRef(value);
  if (prev.current !== value) { prev.current = value; setLocal(value||""); }
  return (
    <div>
      <div style={lblSt}>{label}</div>
      <textarea
        style={{...inpSt, resize:"vertical"}}
        rows={rows||3}
        value={local}
        placeholder={placeholder||""}
        onChange={e => { setLocal(e.target.value); onChange(e.target.value); }}
      />
    </div>
  );
}
function Select({label, value, onChange, children}) {
  return (
    <div>
      <div style={lblSt}>{label}</div>
      <select style={inpSt} value={value} onChange={e=>onChange(e.target.value)}>{children}</select>
    </div>
  );
}

const SUPA_URL = "https://asfdgwvgvgnngjqmimgi.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzZmRnd3ZndmdubmdqcW1pbWdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNDM3NzIsImV4cCI6MjA5NzYxOTc3Mn0.Kwjw30sZSM6PAJdFjg65gWYfj96DAtk-NA1Gkzjym7A";

const supa = async (path, method="GET", body=null) => {
  const res = await fetch(`${SUPA_URL}/rest/v1${path}`, {
    method,
    headers: { "apikey":SUPA_KEY, "Authorization":`Bearer ${SUPA_KEY}`, "Content-Type":"application/json", "Prefer":method==="POST"?"return=representation":"" },
    ...(body?{body:JSON.stringify(body)}:{}),
  });
  if (!res.ok) { const e=await res.text(); throw new Error(e); }
  if (res.status===204) return null;
  return res.json();
};

const BANK_KEY = "bs_bank_v2";
const DEFAULT_BANK = { bank:"Kotak Mahindra Bank, Gurgaon", accountName:"Brag Systems", accountNo:"1907202009", ifsc:"KKBK0000287", upi:"bragsystems@kotak" };
const loadBank = () => { try { return JSON.parse(localStorage.getItem(BANK_KEY)||"null")||DEFAULT_BANK; } catch { return DEFAULT_BANK; } };

const CO_KEY = "bs_company_v1";
const DEFAULT_CO = { name:"BRAG SYSTEMS", tagline:"India's Grain Storage Execution Partner", address:"Eco Tower, Cyberwalk Tech Park, IMT Manesar, Gurugram — 122051, Haryana", gstin:"06CUEPS5377Q1ZN", pan:"CUEPS5377Q", phone:"7817805947", email:"bragsystems@gmail.com", website:"www.bragsystems.com" };
const loadCo = () => { try { return JSON.parse(localStorage.getItem(CO_KEY)||"null")||DEFAULT_CO; } catch { return DEFAULT_CO; } };

const SIG_KEY = "bs_signature_v1";
const loadSig = () => { try { return localStorage.getItem(SIG_KEY)||""; } catch { return ""; } };

const DOC_TYPES = ["Tax Invoice","Proforma Invoice","Quotation"];
const UNITS = ["NOS","BOX","KG","MT","LTR","SET","JOB","RMT","SQM","LOT","PCS"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const uid = () => Date.now()+Math.random();
const emptyItem = () => ({ id:uid(), description:"", hsnSac:"", qty:"", unit:"NOS", rate:"", amount:"" });
const toINR = (v) => (parseFloat(v)||0).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2});
const todayStr = () => new Date().toISOString().split("T")[0];
const addDays = (d,n) => { const dt=new Date(d); dt.setDate(dt.getDate()+n); return dt.toISOString().split("T")[0]; };
const fmtDate = (d) => { if(!d)return""; const [y,m,day]=d.split("-"); return `${parseInt(day)}-${MONTHS[parseInt(m)-1]}-${y}`; };

const toWords = (num) => {
  const o=["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const t=["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  const c=(n)=>{
    if(n<20)return o[n]; if(n<100)return t[Math.floor(n/10)]+(n%10?" "+o[n%10]:"");
    if(n<1000)return o[Math.floor(n/100)]+" Hundred"+(n%100?" "+c(n%100):"");
    if(n<100000)return c(Math.floor(n/1000))+" Thousand"+(n%1000?" "+c(n%1000):"");
    if(n<10000000)return c(Math.floor(n/100000))+" Lakh"+(n%100000?" "+c(n%100000):"");
    return c(Math.floor(n/10000000))+" Crore"+(n%10000000?" "+c(n%10000000):"");
  };
  const r=Math.floor(num), p=Math.round((num-r)*100);
  return c(r)+" Rupees"+(p>0?" and "+c(p)+" Paise":"")+" Only";
};

// ─── PRINT HTML ────────────────────────────────────────────────────────────────
function buildPrintHTML(p, bank, co, sig) {
  const B = bank||DEFAULT_BANK;
  const C = co||DEFAULT_CO;
  const SIG = sig||"";
  const {docType,invoiceNo,invoiceDate,dueDate,poRef,vehicleNo,lrNo,modeOfTransport,incoterms,placeOfSupply,clientName,clientContact,clientAddress,clientGstin,clientPhone,clientEmail,items,taxType,taxRate,taxable,tax,grand,notes}=p;
  const n=(v)=>(parseFloat(v)||0).toLocaleString("en-IN",{minimumFractionDigits:2});

  const metaRows=[["No.",invoiceNo],["Date",fmtDate(invoiceDate)],...(docType!=="Quotation"?[["Due Date",fmtDate(dueDate)]]:[]),...(poRef?[["PO/Ref",poRef]]:[])];
  const transportRows=[["Mode of Transport",modeOfTransport||"—"],["Vehicle No.",vehicleNo||"—"],["LR / Way Bill No.",lrNo||"—"],["Delivery Terms",incoterms||"—"]];
  const bankRows=[["Bank",B.bank],["Account Name",B.accountName],["A/c No.",B.accountNo],["IFSC",B.ifsc],["UPI",B.upi]];
  const clientExtra=[clientPhone,clientEmail].filter(Boolean).join(" | ");

  let taxRows="";
  if(taxType==="IGST") taxRows=`<tr><td style="border-bottom:1px solid #ddd;padding:5px 8px">IGST @ ${taxRate}%</td><td style="border-bottom:1px solid #ddd;padding:5px 8px;text-align:right">${n(tax)}</td></tr>`;
  else if(taxType==="CGST+SGST") taxRows=`<tr><td style="border-bottom:1px solid #ddd;padding:5px 8px">CGST @ ${taxRate/2}%</td><td style="border-bottom:1px solid #ddd;padding:5px 8px;text-align:right">${n(tax/2)}</td></tr><tr><td style="border-bottom:1px solid #ddd;padding:5px 8px">SGST @ ${taxRate/2}%</td><td style="border-bottom:1px solid #ddd;padding:5px 8px;text-align:right">${n(tax/2)}</td></tr>`;
  else taxRows=`<tr><td style="border-bottom:1px solid #ddd;padding:5px 8px">Tax (Nil/Exempt)</td><td style="border-bottom:1px solid #ddd;padding:5px 8px;text-align:right">0.00</td></tr>`;

  const itemRows=items.map((it,i)=>`<tr style="background:${i%2===0?"#fff":"#f9f9f9"}">
    <td style="border:1px solid #aaa;padding:5px 7px;text-align:center">${i+1}</td>
    <td style="border:1px solid #aaa;padding:5px 7px">${it.description||""}</td>
    <td style="border:1px solid #aaa;padding:5px 7px;text-align:center">${it.hsnSac||""}</td>
    <td style="border:1px solid #aaa;padding:5px 7px;text-align:center">${it.qty||""}</td>
    <td style="border:1px solid #aaa;padding:5px 7px;text-align:center">${it.unit||""}</td>
    <td style="border:1px solid #aaa;padding:5px 7px;text-align:right">${it.rate?n(it.rate):""}</td>
    <td style="border:1px solid #aaa;padding:5px 7px;text-align:right;font-weight:bold">${it.amount?n(it.amount):""}</td>
  </tr>`).join("");
  const emptyRows=items.length<5?Array(5-items.length).fill(0).map(()=>`<tr>${Array(7).fill(0).map(()=>`<td style="border:1px solid #aaa;padding:13px 7px">&nbsp;</td>`).join("")}</tr>`).join(""):"";

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>${docType} - ${invoiceNo}</title>
<style>
  @page{size:A4;margin:10mm 12mm}
  *{margin:0;padding:0;box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact;font-family:Arial,sans-serif}
  html,body{font-size:10px;color:#111;background:#fff;font-weight:normal;line-height:1.4}
  table{width:100%;border-collapse:collapse}
  td,th,div,span,p{font-weight:normal}
  b,strong{font-weight:bold}
</style>
</head><body>

<table style="margin-bottom:6px"><tr>
<td style="width:58%;vertical-align:top;padding-right:10px">
  <div style="font-size:22px;font-weight:900;letter-spacing:2px;line-height:1;color:#111">${C.name}</div>
  <div style="font-size:8.5px;color:#E59215;font-weight:bold;margin:3px 0 5px">${C.tagline}</div>
  <div style="font-size:8.5px;color:#555;line-height:1.7">${C.address}<br/>GSTIN: <b>${C.gstin}</b> | PAN: <b>${C.pan}</b><br/>Ph: ${C.phone} | ${C.email}</div>
</td>
<td style="width:42%;vertical-align:top;text-align:right">
  <div style="font-size:19px;font-weight:bold;color:#E59215;letter-spacing:1px">${docType.toUpperCase()}</div>
  ${docType==="Tax Invoice"?`<div style="font-size:8px;color:#888;margin-bottom:4px">ORIGINAL FOR RECIPIENT</div>`:""}
  <table style="width:auto;margin-left:auto;border-collapse:collapse">
    ${metaRows.map(([k,v])=>`<tr><td style="color:#888;padding-right:8px;padding-bottom:2px;text-align:right;font-size:9px;border:none">${k}</td><td style="font-weight:bold;text-align:right;font-size:9px;border:none">${v}</td></tr>`).join("")}
  </table>
</td>
</tr></table>

<div style="border-top:3px solid #E59215;margin-bottom:7px"></div>

<table style="margin-bottom:7px"><tr>
<td style="width:54%;border:1px solid #aaa;padding:6px 8px;vertical-align:top;background:#fafafa">
  <div style="font-size:8px;font-weight:bold;color:#E59215;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Bill To</div>
  <div style="font-weight:bold;font-size:11px;margin-bottom:2px">${clientName||"—"}</div>
  ${clientContact?`<div style="font-size:9px;color:#555;margin-bottom:2px">Attn: ${clientContact}</div>`:""}
  <div style="font-size:9px;color:#444;line-height:1.6;white-space:pre-line">${clientAddress||""}</div>
  ${clientExtra?`<div style="font-size:9px;margin-top:2px">${clientExtra}</div>`:""}
  ${clientGstin?`<div style="font-size:9px;margin-top:2px"><b>GSTIN:</b> ${clientGstin}</div>`:""}
  ${placeOfSupply?`<div style="font-size:9px"><b>Place of Supply:</b> ${placeOfSupply}</div>`:""}
</td>
<td style="width:46%;border:1px solid #aaa;border-left:none;padding:6px 8px;vertical-align:top;background:#fafafa">
  <div style="font-size:8px;font-weight:bold;color:#E59215;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Dispatch / Transport</div>
  <table style="border-collapse:collapse">
    ${transportRows.map(([k,v])=>`<tr><td style="color:#777;width:48%;padding-bottom:3px;font-size:9px;border:none">${k}</td><td style="font-weight:bold;font-size:9px;border:none">${v}</td></tr>`).join("")}
  </table>
</td>
</tr></table>

<table style="margin-bottom:7px">
<thead><tr>
  <th style="border:1px solid #555;padding:5px 7px;font-size:9px;background:#1a1a1a;color:#fff;width:28px;font-weight:bold">Sr.</th>
  <th style="border:1px solid #555;padding:5px 7px;font-size:9px;background:#1a1a1a;color:#fff;text-align:left;font-weight:bold">Description of Goods / Services</th>
  <th style="border:1px solid #555;padding:5px 7px;font-size:9px;background:#1a1a1a;color:#fff;font-weight:bold">HSN/SAC</th>
  <th style="border:1px solid #555;padding:5px 7px;font-size:9px;background:#1a1a1a;color:#fff;font-weight:bold">Qty</th>
  <th style="border:1px solid #555;padding:5px 7px;font-size:9px;background:#1a1a1a;color:#fff;font-weight:bold">Unit</th>
  <th style="border:1px solid #555;padding:5px 7px;font-size:9px;background:#1a1a1a;color:#fff;font-weight:bold">Rate (INR)</th>
  <th style="border:1px solid #555;padding:5px 7px;font-size:9px;background:#1a1a1a;color:#fff;font-weight:bold">Amount (INR)</th>
</tr></thead>
<tbody>
  ${itemRows}${emptyRows}
  <tr style="background:#efefef">
    <td style="border:1px solid #aaa;padding:5px 7px;text-align:right;font-weight:bold" colspan="3">Total</td>
    <td style="border:1px solid #aaa;padding:5px 7px;text-align:center;font-weight:bold">${items.reduce((s,it)=>s+(parseFloat(it.qty)||0),0)}</td>
    <td style="border:1px solid #aaa;padding:5px 7px"></td><td style="border:1px solid #aaa;padding:5px 7px"></td>
    <td style="border:1px solid #aaa;padding:5px 7px;text-align:right;font-weight:bold">${n(taxable)}</td>
  </tr>
</tbody>
</table>

<table style="margin-bottom:7px"><tr>
<td style="width:54%;border:1px solid #aaa;padding:6px 8px;vertical-align:top">
  <div style="font-size:8px;font-weight:bold;color:#E59215;margin-bottom:4px">PAYMENT DETAILS</div>
  <table style="width:auto;border-collapse:collapse">
    ${bankRows.map(([k,v])=>`<tr><td style="color:#777;padding-right:12px;padding-bottom:3px;width:90px;font-size:9px;border:none">${k}</td><td style="font-weight:bold;font-size:9px;border:none">${v}</td></tr>`).join("")}
  </table>
</td>
<td style="width:46%;vertical-align:top;border-left:1px solid #aaa;padding:0">
  <table style="border-collapse:collapse">
    <tr><td style="border-bottom:1px solid #ddd;padding:5px 8px">Taxable Amount</td><td style="border-bottom:1px solid #ddd;padding:5px 8px;text-align:right">${n(taxable)}</td></tr>
    ${taxRows}
    <tr style="background:#1a1a1a">
      <td style="padding:7px 8px;font-weight:bold;font-size:12px;color:#E59215">GRAND TOTAL</td>
      <td style="padding:7px 8px;text-align:right;font-weight:bold;font-size:12px;color:#fff">INR ${n(grand)}</td>
    </tr>
  </table>
  <div style="padding:5px 8px;font-size:8.5px;color:#555;font-style:italic;border-top:1px solid #ddd">${toWords(grand)}</div>
</td>
</tr></table>

<table style="margin-bottom:7px"><tr>
<td style="width:60%;border:1px solid #aaa;padding:6px 8px;vertical-align:top">
  <div style="font-size:8px;font-weight:bold;color:#E59215;margin-bottom:3px">TERMS &amp; CONDITIONS</div>
  <div style="font-size:9px;color:#444;line-height:1.8;font-weight:normal">${(notes||"").split("\n").join("<br/>")}</div>
</td>
<td style="width:40%;border:1px solid #aaa;border-left:none;padding:6px 8px;text-align:center;vertical-align:top">
  <div style="font-size:8px;font-weight:bold;color:#E59215;margin-bottom:4px">For ${C.name}</div>
  <div style="height:60px;display:flex;align-items:center;justify-content:center">
    ${SIG ? `<img src="${SIG}" style="max-height:55px;max-width:140px;object-fit:contain"/>` : `<div style="font-size:8px;color:#ccc;font-style:italic">(Signature)</div>`}
  </div>
  <div style="border-top:1px solid #999;padding-top:4px;font-size:9px;color:#666">Authorised Signatory</div>
</td>
</tr></table>

<div style="border-top:1px solid #E59215;padding-top:4px;text-align:center;font-size:7.5px;color:#aaa">
  ${C.email} | ${C.phone} | ${C.website}
</div>
<script>window.onload=function(){window.print();}</script>
</body></html>`;
}

// ─── UNCONTROLLED TEXT INPUT (fixes typing lag) ────────────────────────────────
    </div>
  );
}


// ─── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [appTab, setAppTab] = useState("invoice");
  const [formTab, setFormTab] = useState("edit");

  // Invoice state
  const [docType, setDocType] = useState("Tax Invoice");
  const [invoiceNo, setInvoiceNo] = useState("BS/2026-27/001");
  const [invoiceDate, setInvoiceDate] = useState(todayStr());
  const [dueDate, setDueDate] = useState(addDays(todayStr(),30));
  const [poRef, setPoRef] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [lrNo, setLrNo] = useState("");
  const [modeOfTransport, setModeOfTransport] = useState("");
  const [incoterms, setIncoterms] = useState("");
  const [placeOfSupply, setPlaceOfSupply] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientContact, setClientContact] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientGstin, setClientGstin] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [items, setItems] = useState([emptyItem()]);
  const [taxType, setTaxType] = useState("IGST");
  const [taxRate, setTaxRate] = useState(18);
  const [notes, setNotes] = useState("50% advance, balance after completion.\nGoods once sold will not be taken back.\nSubject to Gurugram jurisdiction.");

  // Settings
  const [bank, setBank] = useState(loadBank());
  const [editBank, setEditBank] = useState(false);
  const [bankDraft, setBankDraft] = useState(loadBank());
  const [co, setCo] = useState(loadCo());
  const [editCo, setEditCo] = useState(false);
  const [coDraft, setCoDraft] = useState(loadCo());
  const [sig, setSig] = useState(loadSig());

  // DB
  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [showDD, setShowDD] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);

  const taxable = items.reduce((s,it)=>s+(parseFloat(it.amount)||0),0);
  const tax = taxType==="Nil"?0:(taxable*taxRate)/100;
  const grand = taxable+tax;

  const notify = (msg,dur=3000) => { setToast(msg); setTimeout(()=>setToast(""),dur); };

  const fetchClients = async () => {
    try { const d=await supa("/clients?order=name.asc"); setClients(d||[]); } catch(e){ notify("Error: "+e.message); }
  };
  const fetchInvoices = async () => {
    setLoading(true);
    try { const d=await supa("/invoices?order=created_at.desc&limit=100"); setInvoices(d||[]); } catch(e){ notify("Error: "+e.message); }
    setLoading(false);
  };

  useEffect(()=>{ fetchClients(); },[]);

  const saveClient = async () => {
    if(!clientName.trim()){notify("Enter client name first");return;}
    setSaving(true);
    try {
      const ex=clients.find(c=>c.name===clientName);
      const payload={name:clientName,address:clientAddress,gstin:clientGstin,phone:clientPhone,email:clientEmail,place_of_supply:placeOfSupply,contact_person:clientContact};
      if(ex){ await supa(`/clients?id=eq.${ex.id}`,"PATCH",payload); notify(`"${clientName}" updated ✓`); }
      else { await supa("/clients","POST",payload); notify(`"${clientName}" saved ✓`); }
      fetchClients();
    } catch(e){ notify("Error: "+e.message); }
    setSaving(false);
  };

  const saveInvoice = async () => {
    setSaving(true);
    try {
      const props={docType,invoiceNo,invoiceDate,dueDate,poRef,vehicleNo,lrNo,modeOfTransport,incoterms,placeOfSupply,clientName,clientContact,clientAddress,clientGstin,clientPhone,clientEmail,items,taxType,taxRate,taxable,tax,grand,notes};
      await supa("/invoices","POST",{doc_type:docType,invoice_no:invoiceNo,invoice_date:invoiceDate,due_date:dueDate,client_name:clientName,client_gstin:clientGstin,taxable,tax,grand_total:grand,data:props});
      notify(`Invoice ${invoiceNo} saved ✓`);
      fetchInvoices();
    } catch(e){ notify("Error: "+e.message); }
    setSaving(false);
  };

  const loadClient = (c) => {
    setClientName(c.name||""); setClientContact(c.contact_person||"");
    setClientAddress(c.address||""); setClientGstin(c.gstin||"");
    setClientPhone(c.phone||""); setClientEmail(c.email||"");
    setPlaceOfSupply(c.place_of_supply||"");
    setShowDD(false); notify(`Loaded "${c.name}" ✓`);
  };

  const deleteClient = async (id,name,e) => {
    e.stopPropagation();
    if(!confirm(`Delete "${name}"?`))return;
    try { await supa(`/clients?id=eq.${id}`,"DELETE"); notify("Deleted"); fetchClients(); } catch{ notify("Error"); }
  };

  const loadInvoice = (inv) => {
    const d=inv.data; if(!d)return;
    setDocType(d.docType||"Tax Invoice"); setInvoiceNo(d.invoiceNo||"");
    setInvoiceDate(d.invoiceDate||todayStr()); setDueDate(d.dueDate||"");
    setPoRef(d.poRef||""); setVehicleNo(d.vehicleNo||""); setLrNo(d.lrNo||"");
    setModeOfTransport(d.modeOfTransport||""); setIncoterms(d.incoterms||"");
    setPlaceOfSupply(d.placeOfSupply||""); setClientName(d.clientName||"");
    setClientContact(d.clientContact||""); setClientAddress(d.clientAddress||"");
    setClientGstin(d.clientGstin||""); setClientPhone(d.clientPhone||"");
    setClientEmail(d.clientEmail||""); setItems(d.items||[emptyItem()]);
    setTaxType(d.taxType||"IGST"); setTaxRate(d.taxRate||18); setNotes(d.notes||"");
    setAppTab("invoice"); setFormTab("edit"); notify(`Loaded ${inv.invoice_no} ✓`);
  };

  const printInvoice = (inv) => {
    const d=inv.data; if(!d)return;
    const html=buildPrintHTML(d,bank,co,sig);
    const blob=new Blob([html],{type:"text/html"});
    const url=URL.createObjectURL(blob);
    const win=window.open(url,"_blank");
    if(!win){alert("Allow popups");return;}
    setTimeout(()=>URL.revokeObjectURL(url),10000);
  };

  const deleteInvoice = async (id,no,e) => {
    e.stopPropagation();
    if(!confirm(`Delete ${no}?`))return;
    try { await supa(`/invoices?id=eq.${id}`,"DELETE"); notify("Deleted"); fetchInvoices(); } catch{ notify("Error"); }
  };



  const updateItem = (id,field,value) => {
    setItems(prev=>prev.map(it=>{
      if(it.id!==id)return it;
      const u={...it,[field]:value};
      if(field==="qty"||field==="rate"){
        u.amount=((parseFloat(field==="qty"?value:it.qty)||0)*(parseFloat(field==="rate"?value:it.rate)||0)).toFixed(2);
      }
      return u;
    }));
  };

  // ── STYLES ──
  const card = {background:"#fff",borderRadius:"8px",boxShadow:"0 1px 4px rgba(0,0,0,0.08)",padding:"16px"};
  const cardTitle = {fontSize:"13px",fontWeight:700,color:"#374151",marginBottom:"12px",display:"block"};
  const grid2 = {display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"};
  const tabBtn = (a) => ({fontSize:"12px",padding:"5px 12px",borderRadius:"6px",fontWeight:600,border:"none",cursor:"pointer",background:a?"#f97316":"#374151",color:a?"#fff":"#d1d5db"});
  const actionBtn = (color,sm) => ({fontSize:sm?"11px":"12px",padding:sm?"3px 10px":"5px 12px",borderRadius:"6px",fontWeight:700,border:"none",cursor:"pointer",background:color,color:"#fff"});

  const printProps = {docType,invoiceNo,invoiceDate,dueDate,poRef,vehicleNo,lrNo,modeOfTransport,incoterms,placeOfSupply,clientName,clientContact,clientAddress,clientGstin,clientPhone,clientEmail,items,taxType,taxRate,taxable,tax,grand,notes};

  const handlePrintCurrent = () => {
    const html=buildPrintHTML(printProps,bank,co,sig);
    const blob=new Blob([html],{type:"text/html"});
    const url=URL.createObjectURL(blob);
    const win=window.open(url,"_blank");
    if(!win){alert("Allow popups for this site");return;}
    setTimeout(()=>URL.revokeObjectURL(url),10000);
  };

  return (
    <div style={{minHeight:"100vh",background:"#f3f4f6",fontFamily:"Arial,sans-serif",fontSize:"14px",fontWeight:"normal",color:"#111"}}>

      {toast&&<div style={{position:"fixed",top:"60px",right:"16px",background:"#1f2937",color:"#fff",fontSize:"13px",padding:"8px 16px",borderRadius:"8px",zIndex:9999,boxShadow:"0 4px 12px rgba(0,0,0,0.3)",maxWidth:"400px"}}>{toast}</div>}

      {/* TOPBAR */}
      <div style={{background:"#111827",color:"#fff",padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:40,boxShadow:"0 2px 8px rgba(0,0,0,0.4)"}}>
        <span style={{color:"#f97316",fontWeight:900,fontSize:"18px",letterSpacing:"3px"}}>BRAG SYSTEMS</span>
        <div style={{display:"flex",gap:"6px"}}>
          {[["invoice","Invoice"],["clients","Clients"],["history","History"],["settings","Settings"]].map(([k,v])=>(
            <button key={k} onClick={()=>{setAppTab(k);if(k==="clients")fetchClients();if(k==="history")fetchInvoices();}} style={tabBtn(appTab===k)}>{v}</button>
          ))}
        </div>
        <div style={{display:"flex",gap:"6px"}}>
          {appTab==="invoice"&&<>
            {[["edit","Edit"],["preview","Preview"]].map(([k,v])=>(
              <button key={k} onClick={()=>setFormTab(k)} style={tabBtn(formTab===k)}>{v}</button>
            ))}
            <button onClick={saveInvoice} disabled={saving} style={{...actionBtn("#16a34a"),opacity:saving?0.6:1}}>{saving?"Saving...":"Save"}</button>
            <button onClick={handlePrintCurrent} style={actionBtn("#f97316")}>Print/PDF</button>
          </>}
        </div>
      </div>

      {/* ── INVOICE FORM ── */}
      {appTab==="invoice"&&formTab==="edit"&&(
        <div style={{maxWidth:"720px",margin:"0 auto",padding:"16px",display:"flex",flexDirection:"column",gap:"14px",paddingBottom:"40px"}}>

          <div style={card}>
            <span style={cardTitle}>Document Type</span>
            <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
              {DOC_TYPES.map(t=>(
                <button key={t} onClick={()=>setDocType(t)} style={{padding:"6px 16px",borderRadius:"6px",fontSize:"13px",fontWeight:600,cursor:"pointer",border:`2px solid ${docType===t?"#f97316":"#e5e7eb"}`,background:docType===t?"#fff7ed":"#fff",color:docType===t?"#c2410c":"#6b7280"}}>{t}</button>
              ))}
            </div>
          </div>

          <div style={card}>
            <span style={cardTitle}>Document Details</span>
            <div style={grid2}>
              <Input label="Invoice / Doc No." value={invoiceNo} onChange={setInvoiceNo}/>
              <Input label="Date" type="date" value={invoiceDate} onChange={v=>{setInvoiceDate(v);setDueDate(addDays(v,30));}}/>
              {docType!=="Quotation"&&<Input label="Due Date" type="date" value={dueDate} onChange={setDueDate}/>}
              <Input label="PO / Reference No." value={poRef} onChange={setPoRef} placeholder="e.g. PO/0168/25-26"/>
              <Input label="Place of Supply" value={placeOfSupply} onChange={setPlaceOfSupply} placeholder="e.g. Uttar Pradesh"/>
            </div>
          </div>

          <div style={card}>
            <span style={cardTitle}>Transport & Dispatch</span>
            <div style={grid2}>
              <Select label="Mode of Transport" value={modeOfTransport} onChange={setModeOfTransport}>
                <option value="">-- Select --</option>
                {["Road","Rail","Air","Sea","Courier","N/A (Service)"].map(o=><option key={o}>{o}</option>)}
              </Select>
              <Input label="Vehicle No." value={vehicleNo} onChange={setVehicleNo} placeholder="e.g. HR26AT1234"/>
              <Input label="LR / e-Way Bill No." value={lrNo} onChange={setLrNo}/>
              <Select label="Delivery Terms" value={incoterms} onChange={setIncoterms}>
                <option value="">-- Select --</option>
                {["Ex-Works","FOR Destination","Door Delivery","CIF","FOB","N/A (Service)"].map(o=><option key={o}>{o}</option>)}
              </Select>
            </div>
          </div>

          <div style={card}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
              <span style={cardTitle}>Bill To</span>
              <div style={{display:"flex",gap:"8px",alignItems:"center",position:"relative"}}>
                <button onClick={()=>setShowDD(!showDD)} style={{fontSize:"12px",padding:"4px 12px",borderRadius:"6px",border:"1px solid #d1d5db",background:"#fff",color:"#374151",cursor:"pointer",fontWeight:600}}>
                  Saved ({clients.length}) ▾
                </button>
                {showDD&&(
                  <div style={{position:"absolute",right:0,top:"34px",background:"#fff",border:"1px solid #e5e7eb",borderRadius:"8px",boxShadow:"0 8px 24px rgba(0,0,0,0.15)",zIndex:50,width:"300px",maxHeight:"260px",overflowY:"auto"}}>
                    {clients.length===0
                      ?<div style={{padding:"12px 16px",fontSize:"13px",color:"#9ca3af"}}>No saved clients yet</div>
                      :clients.map(c=>(
                        <div key={c.id} onClick={()=>loadClient(c)}
                          style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",cursor:"pointer",borderBottom:"1px solid #f3f4f6",background:"#fff"}}
                          onMouseEnter={e=>e.currentTarget.style.background="#fff7ed"}
                          onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                          <div>
                            <div style={{fontSize:"13px",fontWeight:600,color:"#1f2937"}}>{c.name}</div>
                            <div style={{fontSize:"11px",color:"#9ca3af",fontWeight:"normal"}}>{c.contact_person||c.gstin||c.phone||""}</div>
                          </div>
                          <button onClick={e=>deleteClient(c.id,c.name,e)} style={{color:"#f87171",fontSize:"14px",border:"none",background:"none",cursor:"pointer",padding:"0 4px"}}>✕</button>
                        </div>
                      ))
                    }
                  </div>
                )}
                <button onClick={saveClient} disabled={saving} style={{...actionBtn("#f97316"),fontSize:"12px",padding:"4px 12px",opacity:saving?0.6:1}}>{saving?"...":"Save Client"}</button>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
              <Input label="Company / Client Name" value={clientName} onChange={setClientName} placeholder="e.g. Pasupati Acrylon Ltd"/>
              <Input label="Contact Person" value={clientContact} onChange={setClientContact} placeholder="e.g. Mr. Rajesh Kumar (Purchase Manager)"/>
              <Textarea label="Address" value={clientAddress} onChange={setClientAddress} placeholder="Full address with district, state, PIN"/>
              <div style={grid2}>
                <Input label="Phone" value={clientPhone} onChange={setClientPhone} placeholder="+91 98765 43210"/>
                <Input label="Email" value={clientEmail} onChange={setClientEmail} placeholder="purchase@client.com"/>
              </div>
              <Input label="GSTIN" value={clientGstin} onChange={setClientGstin} placeholder="15-digit GSTIN"/>
            </div>
          </div>

          <div style={card}>
            <span style={cardTitle}>Line Items</span>
            <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
              {items.map((it,idx)=>(
                <div key={it.id} style={{border:"1px solid #e5e7eb",borderRadius:"8px",padding:"12px",background:"#f9fafb"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
                    <span style={{fontSize:"12px",fontWeight:700,color:"#f97316"}}>Item {idx+1}</span>
                    {items.length>1&&<button onClick={()=>setItems(p=>p.filter(i=>i.id!==it.id))} style={{color:"#f87171",fontSize:"12px",border:"none",background:"none",cursor:"pointer",fontWeight:600}}>✕ Remove</button>}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
                    <div style={{gridColumn:"1/-1"}}>
                      <div style={lblSt}>Description</div>
                      <input style={inpSt} value={it.description} onChange={e=>updateItem(it.id,"description",e.target.value)} placeholder="Product / Service name"/>
                    </div>
                    <div>
                      <div style={lblSt}>HSN / SAC</div>
                      <input style={inpSt} value={it.hsnSac} onChange={e=>updateItem(it.id,"hsnSac",e.target.value)}/>
                    </div>
                    <div>
                      <div style={lblSt}>Unit</div>
                      <select style={inpSt} value={it.unit} onChange={e=>updateItem(it.id,"unit",e.target.value)}>
                        {UNITS.map(u=><option key={u}>{u}</option>)}
                      </select>
                    </div>
                    <div>
                      <div style={lblSt}>Qty</div>
                      <input type="number" style={inpSt} value={it.qty} onChange={e=>updateItem(it.id,"qty",e.target.value)}/>
                    </div>
                    <div>
                      <div style={lblSt}>Rate (INR)</div>
                      <input type="number" style={inpSt} value={it.rate} onChange={e=>updateItem(it.id,"rate",e.target.value)}/>
                    </div>
                    <div style={{gridColumn:"1/-1"}}>
                      <div style={lblSt}>Amount (auto)</div>
                      <input style={{...inpSt,background:"#fff7ed",fontWeight:600,color:"#c2410c"}} readOnly value={it.amount?toINR(it.amount):"0.00"}/>
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={()=>setItems(p=>[...p,emptyItem()])} style={{color:"#f97316",fontSize:"13px",fontWeight:600,border:"none",background:"none",cursor:"pointer",textAlign:"left"}}>+ Add Item</button>
            </div>
          </div>

          <div style={card}>
            <span style={cardTitle}>Tax</span>
            <div style={{...grid2,marginBottom:"12px"}}>
              <Select label="Tax Type" value={taxType} onChange={setTaxType}>
                <option value="IGST">IGST — Inter-state</option>
                <option value="CGST+SGST">CGST + SGST — Intra-state</option>
                <option value="Nil">Nil / Exempt</option>
              </Select>
              <Select label="Rate (%)" value={String(taxRate)} onChange={v=>setTaxRate(parseFloat(v))}>
                {[0,5,12,18,28].map(r=><option key={r} value={r}>{r}%</option>)}
              </Select>
            </div>
            <div style={{background:"#f9fafb",borderRadius:"6px",padding:"12px",fontSize:"13px"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}><span style={{color:"#6b7280",fontWeight:"normal"}}>Taxable Amount</span><span style={{fontWeight:600}}>INR {toINR(taxable)}</span></div>
              {taxType==="IGST"&&<div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}><span style={{color:"#6b7280",fontWeight:"normal"}}>IGST @ {taxRate}%</span><span style={{fontWeight:600}}>INR {toINR(tax)}</span></div>}
              {taxType==="CGST+SGST"&&<>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}><span style={{color:"#6b7280",fontWeight:"normal"}}>CGST @ {taxRate/2}%</span><span style={{fontWeight:600}}>INR {toINR(tax/2)}</span></div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}><span style={{color:"#6b7280",fontWeight:"normal"}}>SGST @ {taxRate/2}%</span><span style={{fontWeight:600}}>INR {toINR(tax/2)}</span></div>
              </>}
              <div style={{display:"flex",justifyContent:"space-between",borderTop:"1px solid #e5e7eb",paddingTop:"8px",marginTop:"4px",fontWeight:700,fontSize:"15px",color:"#c2410c"}}>
                <span>Grand Total</span><span>INR {toINR(grand)}</span>
              </div>
            </div>
          </div>

          <div style={card}>
            <span style={cardTitle}>Terms & Notes</span>
            <Textarea value={notes} onChange={setNotes} rows={4}/>
          </div>
        </div>
      )}

      {/* PREVIEW */}
      {appTab==="invoice"&&formTab==="preview"&&(
        <div style={{maxWidth:"760px",margin:"0 auto",padding:"16px"}}>
          <p style={{textAlign:"center",fontSize:"12px",color:"#9ca3af",marginBottom:"12px"}}>Preview — click Print/PDF to save</p>
          <div style={{boxShadow:"0 4px 24px rgba(0,0,0,0.12)",border:"1px solid #e5e7eb",background:"#fff",padding:"16px",overflowX:"auto"}}
            dangerouslySetInnerHTML={{__html:buildPrintHTML(printProps,bank).replace(/<!DOCTYPE[\s\S]*?<body[^>]*>/i,"").replace(/<\/body>[\s\S]*/i,"").replace(/<script[\s\S]*?<\/script>/gi,"")}}/>
        </div>
      )}

      {/* CLIENTS */}
      {appTab==="clients"&&(
        <div style={{maxWidth:"720px",margin:"0 auto",padding:"16px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
            <span style={{fontSize:"16px",fontWeight:700,color:"#374151"}}>Saved Clients</span>
            <div style={{display:"flex",gap:"8px"}}>
              <button onClick={()=>{
                setClientName(""); setClientContact(""); setClientAddress("");
                setClientGstin(""); setClientPhone(""); setClientEmail(""); setPlaceOfSupply("");
                setAppTab("invoice"); setFormTab("edit");
                setTimeout(()=>notify("Fill details and click Save Client ↑"),100);
              }} style={actionBtn("#f97316")}>+ Add New Client</button>
              <button onClick={fetchClients} style={{fontSize:"12px",color:"#f97316",fontWeight:600,border:"none",background:"none",cursor:"pointer"}}>↺ Refresh</button>
            </div>
          </div>
          {clients.length===0
            ?<div style={{textAlign:"center",color:"#9ca3af",padding:"40px",background:"#fff",borderRadius:"8px",boxShadow:"0 1px 4px rgba(0,0,0,0.08)"}}>No clients yet. Click "+ Add New Client".</div>
            :<div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
              {clients.map(c=>(
                <div key={c.id} style={{background:"#fff",borderRadius:"8px",boxShadow:"0 1px 4px rgba(0,0,0,0.08)",padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,color:"#1f2937",fontSize:"14px"}}>{c.name}</div>
                    {c.contact_person&&<div style={{fontSize:"12px",color:"#f97316",marginTop:"2px",fontWeight:500}}>Attn: {c.contact_person}</div>}
                    <div style={{fontSize:"12px",color:"#6b7280",marginTop:"2px",fontWeight:"normal"}}>{c.address}</div>
                    <div style={{fontSize:"11px",color:"#9ca3af",marginTop:"4px",display:"flex",gap:"12px",flexWrap:"wrap",fontWeight:"normal"}}>
                      {c.gstin&&<span>GSTIN: {c.gstin}</span>}
                      {c.phone&&<span>{c.phone}</span>}
                      {c.email&&<span>{c.email}</span>}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:"6px",marginLeft:"12px",flexShrink:0}}>
                    <button onClick={()=>{loadClient(c);setAppTab("invoice");}} style={actionBtn("#374151",true)}>Load</button>
                    <button onClick={e=>deleteClient(c.id,c.name,e)} style={{color:"#f87171",fontSize:"14px",border:"none",background:"none",cursor:"pointer",padding:"0 4px"}}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          }
        </div>
      )}

      {/* HISTORY */}
      {appTab==="history"&&(
        <div style={{maxWidth:"720px",margin:"0 auto",padding:"16px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
            <span style={{fontSize:"16px",fontWeight:700,color:"#374151"}}>Invoice History</span>
            <button onClick={fetchInvoices} style={{fontSize:"12px",color:"#f97316",fontWeight:600,border:"none",background:"none",cursor:"pointer"}}>↺ Refresh</button>
          </div>
          {loading?<div style={{textAlign:"center",color:"#9ca3af",padding:"40px"}}>Loading...</div>
          :invoices.length===0
            ?<div style={{textAlign:"center",color:"#9ca3af",padding:"40px",background:"#fff",borderRadius:"8px"}}>No invoices saved yet.</div>
            :<div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
              {invoices.map(inv=>(
                <div key={inv.id} style={{background:"#fff",borderRadius:"8px",boxShadow:"0 1px 4px rgba(0,0,0,0.08)",padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{flex:1,cursor:"pointer"}} onClick={()=>loadInvoice(inv)}>
                    <div style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap"}}>
                      <span style={{fontWeight:700,color:"#1f2937",fontSize:"14px"}}>{inv.invoice_no}</span>
                      <span style={{fontSize:"11px",padding:"2px 8px",borderRadius:"4px",fontWeight:600,background:inv.doc_type==="Tax Invoice"?"#fff7ed":inv.doc_type==="Proforma Invoice"?"#eff6ff":"#f3f4f6",color:inv.doc_type==="Tax Invoice"?"#c2410c":inv.doc_type==="Proforma Invoice"?"#1d4ed8":"#4b5563"}}>{inv.doc_type}</span>
                    </div>
                    <div style={{fontSize:"13px",color:"#6b7280",marginTop:"2px",fontWeight:"normal"}}>{inv.client_name}</div>
                    <div style={{fontSize:"12px",color:"#9ca3af",marginTop:"2px",display:"flex",gap:"12px",fontWeight:"normal"}}>
                      <span>{fmtDate(inv.invoice_date)}</span>
                      <span style={{fontWeight:600,color:"#f97316"}}>INR {(parseFloat(inv.grand_total)||0).toLocaleString("en-IN",{minimumFractionDigits:2})}</span>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:"6px",marginLeft:"12px",flexShrink:0}}>
                    <button onClick={()=>printInvoice(inv)} style={actionBtn("#f97316",true)} title="Print / Download PDF">⎙ Print</button>
                    <button onClick={()=>loadInvoice(inv)} style={actionBtn("#374151",true)} title="Load to edit">Edit</button>
                    <button onClick={e=>deleteInvoice(inv.id,inv.invoice_no,e)} style={{color:"#f87171",fontSize:"14px",border:"none",background:"none",cursor:"pointer",padding:"0 4px"}}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          }
        </div>
      )}

      {/* SETTINGS */}
      {appTab==="settings"&&(
        <div style={{maxWidth:"720px",margin:"0 auto",padding:"16px",display:"flex",flexDirection:"column",gap:"14px",paddingBottom:"40px"}}>

          {/* COMPANY HEADER */}
          <div style={card}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
              <span style={cardTitle}>Company / Header Details</span>
              <button onClick={()=>{setEditCo(!editCo);setCoDraft({...co});}} style={{fontSize:"12px",padding:"4px 12px",borderRadius:"6px",border:"1px solid #d1d5db",background:"#fff",color:"#374151",cursor:"pointer",fontWeight:600}}>
                {editCo?"Cancel":"Edit"}
              </button>
            </div>
            {!editCo?(
              <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                {[["Company Name",co.name],["Tagline",co.tagline],["Address",co.address],["GSTIN",co.gstin],["PAN",co.pan],["Phone",co.phone],["Email",co.email],["Website",co.website]].map(([k,v])=>(
                  <div key={k} style={{display:"flex",gap:"12px",fontSize:"13px"}}>
                    <span style={{color:"#9ca3af",width:"120px",flexShrink:0,fontWeight:"normal"}}>{k}</span>
                    <span style={{fontWeight:k==="Company Name"?700:400,color:"#1f2937"}}>{v}</span>
                  </div>
                ))}
              </div>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
                {[["name","Company Name"],["tagline","Tagline"],["address","Address"],["gstin","GSTIN"],["pan","PAN"],["phone","Phone"],["email","Email"],["website","Website"]].map(([k,label])=>(
                  <div key={k}>
                    <div style={lblSt}>{label}</div>
                    <input style={inpSt} value={coDraft[k]||""} onChange={e=>setCoDraft(c=>({...c,[k]:e.target.value}))}/>
                  </div>
                ))}
                <button onClick={()=>{
                  setCo(coDraft);
                  localStorage.setItem(CO_KEY,JSON.stringify(coDraft));
                  setEditCo(false); notify("Company details saved ✓");
                }} style={{...actionBtn("#16a34a"),padding:"8px 20px",fontSize:"13px",borderRadius:"6px",alignSelf:"flex-start"}}>
                  Save Company Details
                </button>
              </div>
            )}
          </div>

          {/* SIGNATURE */}
          <div style={card}>
            <span style={cardTitle}>Signature & Stamp</span>
            <p style={{fontSize:"12px",color:"#6b7280",marginBottom:"12px",fontWeight:"normal"}}>Upload your signature/stamp PNG. It will appear on every printed invoice automatically.</p>
            <div style={{display:"flex",gap:"16px",alignItems:"flex-start",flexWrap:"wrap"}}>
              <div style={{flex:1,minWidth:"200px"}}>
                <div style={lblSt}>Upload Signature / Stamp (PNG/JPG)</div>
                <input type="file" accept="image/*" style={{...inpSt,padding:"4px"}}
                  onChange={e=>{
                    const file=e.target.files[0]; if(!file)return;
                    const reader=new FileReader();
                    reader.onload=ev=>{
                      const b64=ev.target.result;
                      setSig(b64);
                      localStorage.setItem(SIG_KEY,b64);
                      notify("Signature saved ✓");
                    };
                    reader.readAsDataURL(file);
                  }}
                />
                {sig&&<button onClick={()=>{setSig("");localStorage.removeItem(SIG_KEY);notify("Signature removed");}} style={{marginTop:"8px",fontSize:"11px",color:"#f87171",border:"none",background:"none",cursor:"pointer",fontWeight:600}}>✕ Remove signature</button>}
              </div>
              <div style={{width:"160px",height:"80px",border:"1px dashed #d1d5db",borderRadius:"6px",display:"flex",alignItems:"center",justifyContent:"center",background:"#f9fafb",flexShrink:0}}>
                {sig
                  ?<img src={sig} style={{maxWidth:"150px",maxHeight:"70px",objectFit:"contain"}} alt="signature"/>
                  :<span style={{fontSize:"11px",color:"#d1d5db"}}>No signature</span>
                }
              </div>
            </div>
          </div>

          {/* BANK */}
          <div style={card}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
              <span style={cardTitle}>Bank & Payment Details</span>
              <button onClick={()=>{setEditBank(!editBank);setBankDraft({...bank});}} style={{fontSize:"12px",padding:"4px 12px",borderRadius:"6px",border:"1px solid #d1d5db",background:"#fff",color:"#374151",cursor:"pointer",fontWeight:600}}>
                {editBank?"Cancel":"Edit"}
              </button>
            </div>
            {!editBank?(
              <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                {[["Bank",bank.bank],["Account Name",bank.accountName],["A/c No.",bank.accountNo],["IFSC",bank.ifsc],["UPI",bank.upi]].map(([k,v])=>(
                  <div key={k} style={{display:"flex",gap:"12px",fontSize:"13px"}}>
                    <span style={{color:"#9ca3af",width:"110px",flexShrink:0,fontWeight:"normal"}}>{k}</span>
                    <span style={{fontWeight:600,color:"#1f2937"}}>{v}</span>
                  </div>
                ))}
              </div>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
                {[["bank","Bank Name"],["accountName","Account Name"],["accountNo","Account No."],["ifsc","IFSC Code"],["upi","UPI ID"]].map(([k,label])=>(
                  <div key={k}>
                    <div style={lblSt}>{label}</div>
                    <input style={inpSt} value={bankDraft[k]||""} onChange={e=>setBankDraft(b=>({...b,[k]:e.target.value}))}/>
                  </div>
                ))}
                <button onClick={()=>{
                  setBank(bankDraft);
                  localStorage.setItem(BANK_KEY,JSON.stringify(bankDraft));
                  setEditBank(false); notify("Bank details saved ✓");
                }} style={{...actionBtn("#16a34a"),padding:"8px 20px",fontSize:"13px",borderRadius:"6px",alignSelf:"flex-start"}}>
                  Save Bank Details
                </button>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
