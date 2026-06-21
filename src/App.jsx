import { useState, useEffect } from "react";

const SUPA_URL = "https://asfdgwvgvgnngjqmimgi.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzZmRnd3ZndmdubmdqcW1pbWdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNDM3NzIsImV4cCI6MjA5NzYxOTc3Mn0.Kwjw30sZSM6PAJdFjg65gWYfj96DAtk-NA1Gkzjym7A";

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

const BRAG = {
  bank: "Kotak Mahindra Bank, Gurgaon",
  accountName: "Brag Systems",
  accountNo: "1907202009",
  ifsc: "KKBK0000287",
  upi: "bragsystems@kotak",
};

const DOC_TYPES = ["Tax Invoice", "Proforma Invoice", "Quotation"];
const UNITS = ["NOS","BOX","KG","MT","LTR","SET","JOB","RMT","SQM","LOT","PCS"];
const TAX_RATES = [0,5,12,18,28];

const emptyItem = () => ({ id: Date.now()+Math.random(), description:"", hsnSac:"", qty:"", unit:"NOS", rate:"", amount:"" });

const toINR = (val) => (parseFloat(val)||0).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2});

const toWords = (num) => {
  const o=["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const t=["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  const c=(n)=>{
    if(n<20)return o[n];
    if(n<100)return t[Math.floor(n/10)]+(n%10?" "+o[n%10]:"");
    if(n<1000)return o[Math.floor(n/100)]+" Hundred"+(n%100?" "+c(n%100):"");
    if(n<100000)return c(Math.floor(n/1000))+" Thousand"+(n%1000?" "+c(n%1000):"");
    if(n<10000000)return c(Math.floor(n/100000))+" Lakh"+(n%100000?" "+c(n%100000):"");
    return c(Math.floor(n/10000000))+" Crore"+(n%10000000?" "+c(n%10000000):"");
  };
  const r=Math.floor(num), p=Math.round((num-r)*100);
  return c(r)+" Rupees"+(p>0?" and "+c(p)+" Paise":"")+" Only";
};

const todayStr = () => new Date().toISOString().split("T")[0];
const addDays = (d,n) => { const dt=new Date(d); dt.setDate(dt.getDate()+n); return dt.toISOString().split("T")[0]; };
const fmtDate = (d) => {
  if(!d)return"";
  const [y,m,day]=d.split("-");
  return `${parseInt(day)}-${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(m)-1]}-${y}`;
};

function buildPrintHTML(p) {
  const {docType,invoiceNo,invoiceDate,dueDate,poRef,vehicleNo,lrNo,modeOfTransport,incoterms,placeOfSupply,clientName,clientAddress,clientGstin,clientPhone,clientEmail,items,taxType,taxRate,taxable,tax,grand,notes}=p;
  const n=(v)=>(parseFloat(v)||0).toLocaleString("en-IN",{minimumFractionDigits:2});

  const docMeta=[["No.",invoiceNo],["Date",fmtDate(invoiceDate)],...(docType!=="Quotation"?[["Due Date",fmtDate(dueDate)]]:[]),...(poRef?[["PO/Ref",poRef]]:[])];
  const transport=[["Mode of Transport",modeOfTransport||"—"],["Vehicle No.",vehicleNo||"—"],["LR / Way Bill No.",lrNo||"—"],["Delivery Terms",incoterms||"—"]];
  const bank=[["Bank",BRAG.bank],["Account Name",BRAG.accountName],["A/c No.",BRAG.accountNo],["IFSC",BRAG.ifsc],["UPI",BRAG.upi]];
  const clientExtra=[clientPhone,clientEmail].filter(Boolean).join(" | ");

  let taxRows="";
  if(taxType==="IGST") taxRows=`<tr><td style="border-bottom:1px solid #ccc;padding:5px 8px;font-size:10px">IGST @ ${taxRate}%</td><td style="border-bottom:1px solid #ccc;padding:5px 8px;text-align:right;font-size:10px">${n(tax)}</td></tr>`;
  else if(taxType==="CGST+SGST") taxRows=`<tr><td style="border-bottom:1px solid #ccc;padding:5px 8px;font-size:10px">CGST @ ${taxRate/2}%</td><td style="border-bottom:1px solid #ccc;padding:5px 8px;text-align:right;font-size:10px">${n(tax/2)}</td></tr><tr><td style="border-bottom:1px solid #ccc;padding:5px 8px;font-size:10px">SGST @ ${taxRate/2}%</td><td style="border-bottom:1px solid #ccc;padding:5px 8px;text-align:right;font-size:10px">${n(tax/2)}</td></tr>`;
  else taxRows=`<tr><td style="border-bottom:1px solid #ccc;padding:5px 8px;font-size:10px">Tax (Nil/Exempt)</td><td style="border-bottom:1px solid #ccc;padding:5px 8px;text-align:right;font-size:10px">0.00</td></tr>`;

  const itemRows=items.map((it,i)=>`<tr style="background:${i%2===0?"#fff":"#f9f9f9"}">
    <td style="border:1px solid #999;padding:5px 7px;text-align:center;font-size:10px">${i+1}</td>
    <td style="border:1px solid #999;padding:5px 7px;font-size:10px">${it.description||""}</td>
    <td style="border:1px solid #999;padding:5px 7px;text-align:center;font-size:10px">${it.hsnSac||""}</td>
    <td style="border:1px solid #999;padding:5px 7px;text-align:center;font-size:10px">${it.qty||""}</td>
    <td style="border:1px solid #999;padding:5px 7px;text-align:center;font-size:10px">${it.unit||""}</td>
    <td style="border:1px solid #999;padding:5px 7px;text-align:right;font-size:10px">${it.rate?n(it.rate):""}</td>
    <td style="border:1px solid #999;padding:5px 7px;text-align:right;font-weight:bold;font-size:10px">${it.amount?n(it.amount):""}</td>
  </tr>`).join("");

  const emptyRows=items.length<5?Array(5-items.length).fill(0).map(()=>`<tr>${Array(7).fill(0).map(()=>`<td style="border:1px solid #999;padding:13px 7px">&nbsp;</td>`).join("")}</tr>`).join(""):"";

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>${docType} - ${invoiceNo}</title>
<style>
  @page{size:A4;margin:10mm 12mm}
  *{margin:0;padding:0;box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  body{font-family:Arial,sans-serif;font-size:10px;color:#111;background:#fff}
  table{width:100%;border-collapse:collapse}
</style></head><body>

<table style="margin-bottom:6px"><tr>
  <td style="width:58%;vertical-align:top;padding-right:10px">
    <div style="font-size:22px;font-weight:900;letter-spacing:2px;line-height:1;color:#111">BRAG SYSTEMS</div>
    <div style="font-size:8.5px;color:#E59215;font-weight:bold;margin:3px 0 5px">India's Grain Storage Execution Partner</div>
    <div style="font-size:8.5px;color:#555;line-height:1.7">Eco Tower, Cyberwalk Tech Park, IMT Manesar, Gurugram — 122051, Haryana<br/>GSTIN: <b>06CUEPS5377Q1ZN</b> &nbsp;|&nbsp; PAN: <b>CUEPS5377Q</b><br/>Ph: 7817805947 &nbsp;|&nbsp; bragsystems@gmail.com</div>
  </td>
  <td style="width:42%;vertical-align:top;text-align:right">
    <div style="font-size:19px;font-weight:bold;color:#E59215;letter-spacing:1px">${docType.toUpperCase()}</div>
    ${docType==="Tax Invoice"?`<div style="font-size:8px;color:#888;margin-bottom:4px">ORIGINAL FOR RECIPIENT</div>`:""}
    <table style="width:auto;margin-left:auto;border-collapse:collapse">
      ${docMeta.map(([k,v])=>`<tr><td style="color:#888;padding-right:8px;padding-bottom:2px;text-align:right;font-size:9px;border:none">${k}</td><td style="font-weight:bold;text-align:right;font-size:9px;border:none">${v}</td></tr>`).join("")}
    </table>
  </td>
</tr></table>

<div style="border-top:3px solid #E59215;margin-bottom:7px"></div>

<table style="margin-bottom:7px"><tr>
  <td style="width:54%;border:1px solid #999;padding:6px 8px;vertical-align:top;background:#fafafa">
    <div style="font-size:8px;font-weight:bold;color:#E59215;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Bill To</div>
    <div style="font-weight:bold;font-size:11px;margin-bottom:2px">${clientName||"—"}</div>
    <div style="font-size:9px;color:#444;line-height:1.6;white-space:pre-line">${clientAddress||""}</div>
    ${clientExtra?`<div style="font-size:9px;margin-top:2px">${clientExtra}</div>`:""}
    ${clientGstin?`<div style="font-size:9px;margin-top:2px"><b>GSTIN:</b> ${clientGstin}</div>`:""}
    ${placeOfSupply?`<div style="font-size:9px"><b>Place of Supply:</b> ${placeOfSupply}</div>`:""}
  </td>
  <td style="width:46%;border:1px solid #999;border-left:none;padding:6px 8px;vertical-align:top;background:#fafafa">
    <div style="font-size:8px;font-weight:bold;color:#E59215;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Dispatch / Transport</div>
    <table style="border-collapse:collapse">
      ${transport.map(([k,v])=>`<tr><td style="color:#777;width:48%;padding-bottom:3px;font-size:9px;border:none">${k}</td><td style="font-weight:bold;font-size:9px;border:none">${v}</td></tr>`).join("")}
    </table>
  </td>
</tr></table>

<table style="margin-bottom:7px">
  <thead><tr>
    <th style="border:1px solid #444;padding:5px 7px;font-size:9px;background:#1a1a1a;color:#fff;width:28px">Sr.</th>
    <th style="border:1px solid #444;padding:5px 7px;font-size:9px;background:#1a1a1a;color:#fff;text-align:left">Description of Goods / Services</th>
    <th style="border:1px solid #444;padding:5px 7px;font-size:9px;background:#1a1a1a;color:#fff">HSN/SAC</th>
    <th style="border:1px solid #444;padding:5px 7px;font-size:9px;background:#1a1a1a;color:#fff">Qty</th>
    <th style="border:1px solid #444;padding:5px 7px;font-size:9px;background:#1a1a1a;color:#fff">Unit</th>
    <th style="border:1px solid #444;padding:5px 7px;font-size:9px;background:#1a1a1a;color:#fff">Rate (INR)</th>
    <th style="border:1px solid #444;padding:5px 7px;font-size:9px;background:#1a1a1a;color:#fff">Amount (INR)</th>
  </tr></thead>
  <tbody>
    ${itemRows}${emptyRows}
    <tr style="background:#efefef">
      <td style="border:1px solid #999;padding:5px 7px;text-align:right;font-weight:bold;font-size:10px" colspan="3">Total</td>
      <td style="border:1px solid #999;padding:5px 7px;text-align:center;font-weight:bold;font-size:10px">${items.reduce((s,it)=>s+(parseFloat(it.qty)||0),0)}</td>
      <td style="border:1px solid #999;padding:5px 7px"></td>
      <td style="border:1px solid #999;padding:5px 7px"></td>
      <td style="border:1px solid #999;padding:5px 7px;text-align:right;font-weight:bold;font-size:10px">${n(taxable)}</td>
    </tr>
  </tbody>
</table>

<table style="margin-bottom:7px"><tr>
  <td style="width:54%;border:1px solid #999;padding:6px 8px;vertical-align:top">
    <div style="font-size:8px;font-weight:bold;color:#E59215;margin-bottom:4px">PAYMENT DETAILS</div>
    <table style="width:auto;border-collapse:collapse">
      ${bank.map(([k,v])=>`<tr><td style="color:#777;padding-right:12px;padding-bottom:3px;width:90px;font-size:9px;border:none">${k}</td><td style="font-weight:bold;font-size:9px;border:none">${v}</td></tr>`).join("")}
    </table>
  </td>
  <td style="width:46%;vertical-align:top;border-left:1px solid #999;padding:0">
    <table style="border-collapse:collapse">
      <tr><td style="border-bottom:1px solid #ccc;padding:5px 8px;font-size:10px">Taxable Amount</td><td style="border-bottom:1px solid #ccc;padding:5px 8px;text-align:right;font-size:10px">${n(taxable)}</td></tr>
      ${taxRows}
      <tr style="background:#1a1a1a">
        <td style="padding:7px 8px;font-weight:bold;font-size:12px;color:#E59215">GRAND TOTAL</td>
        <td style="padding:7px 8px;text-align:right;font-weight:bold;font-size:12px;color:#fff">INR ${n(grand)}</td>
      </tr>
    </table>
    <div style="padding:5px 8px;font-size:8.5px;color:#555;font-style:italic;border-top:1px solid #ccc">${toWords(grand)}</div>
  </td>
</tr></table>

<table style="margin-bottom:7px"><tr>
  <td style="width:60%;border:1px solid #999;padding:6px 8px;vertical-align:top">
    <div style="font-size:8px;font-weight:bold;color:#E59215;margin-bottom:3px">TERMS &amp; CONDITIONS</div>
    <div style="font-size:9px;color:#444;line-height:1.7">${(notes||"").replace(/\n/g,"<br/>")}</div>
  </td>
  <td style="width:40%;border:1px solid #999;border-left:none;padding:6px 8px;text-align:center;vertical-align:top">
    <div style="font-size:8px;font-weight:bold;color:#E59215;margin-bottom:4px">For BRAG SYSTEMS</div>
    <div style="height:48px"></div>
    <div style="border-top:1px solid #999;padding-top:4px;font-size:9px;color:#666">Authorised Signatory</div>
  </td>
</tr></table>

<div style="border-top:1px solid #E59215;padding-top:4px;text-align:center;font-size:7.5px;color:#aaa">
  Computer generated document — no signature required &nbsp;|&nbsp; bragsystems@gmail.com &nbsp;|&nbsp; 7817805947 &nbsp;|&nbsp; www.bragsystems.com
</div>
<script>window.onload=function(){window.print();}</script>
</body></html>`;
}

export default function App() {
  const [appTab, setAppTab] = useState("invoice");
  const [formTab, setFormTab] = useState("edit");
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
  const [clientAddress, setClientAddress] = useState("");
  const [clientGstin, setClientGstin] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [items, setItems] = useState([emptyItem()]);
  const [taxType, setTaxType] = useState("IGST");
  const [taxRate, setTaxRate] = useState(18);
  const [notes, setNotes] = useState("50% advance, balance after completion.\nGoods once sold will not be taken back.\nSubject to Gurugram jurisdiction.");

  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [showDD, setShowDD] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);

  const taxable = items.reduce((s,it)=>s+(parseFloat(it.amount)||0),0);
  const tax = taxType==="Nil"?0:(taxable*taxRate)/100;
  const grand = taxable+tax;

  const notify = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3000); };

  const fetchClients = async () => {
    try { const d=await supa("/clients?order=name.asc"); setClients(d||[]); } catch(e){ notify("Error: "+e.message); }
  };
  const fetchInvoices = async () => {
    setLoading(true);
    try { const d=await supa("/invoices?order=created_at.desc&limit=50"); setInvoices(d||[]); } catch(e){ notify("Error: "+e.message); }
    setLoading(false);
  };

  useEffect(()=>{ fetchClients(); },[]);

  const saveClient = async () => {
    if(!clientName.trim()){notify("Enter client name");return;}
    setSaving(true);
    try {
      const ex=clients.find(c=>c.name===clientName);
      if(ex){
        await supa(`/clients?id=eq.${ex.id}`,"PATCH",{address:clientAddress,gstin:clientGstin,phone:clientPhone,email:clientEmail,place_of_supply:placeOfSupply});
        notify(`"${clientName}" updated ✓`);
      } else {
        await supa("/clients","POST",{name:clientName,address:clientAddress,gstin:clientGstin,phone:clientPhone,email:clientEmail,place_of_supply:placeOfSupply});
        notify(`"${clientName}" saved ✓`);
      }
      fetchClients();
    } catch(e){ notify("Error: "+e.message); }
    setSaving(false);
  };

  const saveInvoice = async () => {
    setSaving(true);
    try {
      const props={docType,invoiceNo,invoiceDate,dueDate,poRef,vehicleNo,lrNo,modeOfTransport,incoterms,placeOfSupply,clientName,clientAddress,clientGstin,clientPhone,clientEmail,items,taxType,taxRate,taxable,tax,grand,notes};
      await supa("/invoices","POST",{doc_type:docType,invoice_no:invoiceNo,invoice_date:invoiceDate,due_date:dueDate,client_name:clientName,client_gstin:clientGstin,taxable,tax,grand_total:grand,data:props});
      notify(`Invoice ${invoiceNo} saved ✓`);
    } catch(e){ notify("Error: "+e.message); }
    setSaving(false);
  };

  const loadClient = (c) => {
    setClientName(c.name); setClientAddress(c.address||""); setClientGstin(c.gstin||"");
    setClientPhone(c.phone||""); setClientEmail(c.email||""); setPlaceOfSupply(c.place_of_supply||"");
    setShowDD(false); notify(`Loaded "${c.name}" ✓`);
  };

  const deleteClient = async (id,name,e) => {
    e.stopPropagation();
    if(!confirm(`Delete "${name}"?`))return;
    try { await supa(`/clients?id=eq.${id}`,"DELETE"); notify("Deleted"); fetchClients(); } catch(e){ notify("Error"); }
  };

  const loadInvoice = (inv) => {
    const d=inv.data; if(!d)return;
    setDocType(d.docType||"Tax Invoice"); setInvoiceNo(d.invoiceNo||"");
    setInvoiceDate(d.invoiceDate||todayStr()); setDueDate(d.dueDate||"");
    setPoRef(d.poRef||""); setVehicleNo(d.vehicleNo||""); setLrNo(d.lrNo||"");
    setModeOfTransport(d.modeOfTransport||""); setIncoterms(d.incoterms||"");
    setPlaceOfSupply(d.placeOfSupply||""); setClientName(d.clientName||"");
    setClientAddress(d.clientAddress||""); setClientGstin(d.clientGstin||"");
    setClientPhone(d.clientPhone||""); setClientEmail(d.clientEmail||"");
    setItems(d.items||[emptyItem()]); setTaxType(d.taxType||"IGST");
    setTaxRate(d.taxRate||18); setNotes(d.notes||"");
    setAppTab("invoice"); setFormTab("edit"); notify(`Loaded ${inv.invoice_no} ✓`);
  };

  const deleteInvoice = async (id,no,e) => {
    e.stopPropagation();
    if(!confirm(`Delete ${no}?`))return;
    try { await supa(`/invoices?id=eq.${id}`,"DELETE"); notify("Deleted"); fetchInvoices(); } catch(e){ notify("Error"); }
  };

  const handlePrint = () => {
    const props={docType,invoiceNo,invoiceDate,dueDate,poRef,vehicleNo,lrNo,modeOfTransport,incoterms,placeOfSupply,clientName,clientAddress,clientGstin,clientPhone,clientEmail,items,taxType,taxRate,taxable,tax,grand,notes};
    const html=buildPrintHTML(props);
    const win=window.open("","_blank","width=900,height=700");
    if(!win){alert("Allow popups for this site.");return;}
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
  };

  const updateItem = (id,field,value) => {
    setItems(prev=>prev.map(it=>{
      if(it.id!==id)return it;
      const u={...it,[field]:value};
      if(field==="qty"||field==="rate"){
        const q=parseFloat(field==="qty"?value:it.qty)||0;
        const r=parseFloat(field==="rate"?value:it.rate)||0;
        u.amount=(q*r).toFixed(2);
      }
      return u;
    }));
  };

  const inp = "w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-orange-400 bg-white text-gray-800 font-normal";
  const lbl = "block text-xs font-medium text-gray-500 mb-1";
  const card = "bg-white rounded-lg shadow p-4";

  return (
    <div style={{minHeight:"100vh",background:"#f3f4f6",fontFamily:"Arial,sans-serif"}}>

      {toast && (
        <div style={{position:"fixed",top:"60px",right:"16px",background:"#1f2937",color:"#fff",fontSize:"13px",padding:"8px 16px",borderRadius:"8px",zIndex:9999,boxShadow:"0 4px 12px rgba(0,0,0,0.3)"}}>
          {toast}
        </div>
      )}

      {/* TOPBAR */}
      <div style={{background:"#111827",color:"#fff",padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:40,boxShadow:"0 2px 8px rgba(0,0,0,0.4)"}}>
        <span style={{color:"#f97316",fontWeight:900,fontSize:"18px",letterSpacing:"3px"}}>BRAG SYSTEMS</span>
        <div style={{display:"flex",gap:"6px"}}>
          {[["invoice","Invoice"],["clients","Clients"],["history","History"]].map(([k,v])=>(
            <button key={k} onClick={()=>{setAppTab(k);if(k==="clients")fetchClients();if(k==="history")fetchInvoices();}}
              style={{fontSize:"12px",padding:"5px 12px",borderRadius:"6px",fontWeight:600,border:"none",cursor:"pointer",background:appTab===k?"#f97316":"#374151",color:appTab===k?"#fff":"#d1d5db"}}>
              {v}
            </button>
          ))}
        </div>
        <div style={{display:"flex",gap:"6px"}}>
          {appTab==="invoice" && <>
            {[["edit","Edit"],["preview","Preview"]].map(([k,v])=>(
              <button key={k} onClick={()=>setFormTab(k)}
                style={{fontSize:"12px",padding:"5px 12px",borderRadius:"6px",fontWeight:600,border:"none",cursor:"pointer",background:formTab===k?"#f97316":"#374151",color:formTab===k?"#fff":"#d1d5db"}}>
                {v}
              </button>
            ))}
            <button onClick={saveInvoice} disabled={saving}
              style={{fontSize:"12px",padding:"5px 12px",borderRadius:"6px",fontWeight:700,border:"none",cursor:"pointer",background:"#16a34a",color:"#fff",opacity:saving?0.6:1}}>
              {saving?"Saving...":"Save"}
            </button>
            <button onClick={handlePrint}
              style={{fontSize:"12px",padding:"5px 12px",borderRadius:"6px",fontWeight:700,border:"none",cursor:"pointer",background:"#f97316",color:"#fff"}}>
              Print/PDF
            </button>
          </>}
        </div>
      </div>

      {/* INVOICE FORM */}
      {appTab==="invoice" && formTab==="edit" && (
        <div style={{maxWidth:"720px",margin:"0 auto",padding:"16px",display:"flex",flexDirection:"column",gap:"16px",paddingBottom:"40px"}}>

          {/* Doc Type */}
          <div className={card}>
            <p style={{fontSize:"11px",fontWeight:600,color:"#6b7280",marginBottom:"8px"}}>Document Type</p>
            <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
              {DOC_TYPES.map(t=>(
                <button key={t} onClick={()=>setDocType(t)}
                  style={{padding:"6px 16px",borderRadius:"6px",fontSize:"13px",fontWeight:600,cursor:"pointer",border:`2px solid ${docType===t?"#f97316":"#e5e7eb"}`,background:docType===t?"#fff7ed":"#fff",color:docType===t?"#c2410c":"#6b7280"}}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Doc Details */}
          <div className={card}>
            <p style={{fontSize:"13px",fontWeight:700,color:"#374151",marginBottom:"12px"}}>Document Details</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
              <div><label className={lbl}>Invoice / Doc No.</label><input className={inp} value={invoiceNo} onChange={e=>setInvoiceNo(e.target.value)}/></div>
              <div><label className={lbl}>Date</label><input type="date" className={inp} value={invoiceDate} onChange={e=>{setInvoiceDate(e.target.value);setDueDate(addDays(e.target.value,30));}}/></div>
              {docType!=="Quotation"&&<div><label className={lbl}>Due Date</label><input type="date" className={inp} value={dueDate} onChange={e=>setDueDate(e.target.value)}/></div>}
              <div><label className={lbl}>PO / Reference No.</label><input className={inp} value={poRef} onChange={e=>setPoRef(e.target.value)} placeholder="e.g. PO/0168/25-26"/></div>
              <div><label className={lbl}>Place of Supply</label><input className={inp} value={placeOfSupply} onChange={e=>setPlaceOfSupply(e.target.value)} placeholder="e.g. Uttar Pradesh"/></div>
            </div>
          </div>

          {/* Transport */}
          <div className={card}>
            <p style={{fontSize:"13px",fontWeight:700,color:"#374151",marginBottom:"12px"}}>Transport & Dispatch</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
              <div><label className={lbl}>Mode of Transport</label>
                <select className={inp} value={modeOfTransport} onChange={e=>setModeOfTransport(e.target.value)}>
                  <option value="">-- Select --</option>
                  {["Road","Rail","Air","Sea","Courier","N/A (Service)"].map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
              <div><label className={lbl}>Vehicle No.</label><input className={inp} value={vehicleNo} onChange={e=>setVehicleNo(e.target.value)} placeholder="e.g. HR26AT1234"/></div>
              <div><label className={lbl}>LR / e-Way Bill No.</label><input className={inp} value={lrNo} onChange={e=>setLrNo(e.target.value)}/></div>
              <div><label className={lbl}>Delivery Terms</label>
                <select className={inp} value={incoterms} onChange={e=>setIncoterms(e.target.value)}>
                  <option value="">-- Select --</option>
                  {["Ex-Works","FOR Destination","Door Delivery","CIF","FOB","N/A (Service)"].map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div className={card}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
              <p style={{fontSize:"13px",fontWeight:700,color:"#374151"}}>Bill To</p>
              <div style={{display:"flex",gap:"8px",alignItems:"center",position:"relative"}}>
                <button onClick={()=>setShowDD(!showDD)}
                  style={{fontSize:"12px",padding:"4px 12px",borderRadius:"6px",border:"1px solid #d1d5db",background:"#fff",color:"#374151",cursor:"pointer",fontWeight:600}}>
                  Saved ({clients.length})
                </button>
                {showDD&&(
                  <div style={{position:"absolute",right:0,top:"32px",background:"#fff",border:"1px solid #e5e7eb",borderRadius:"8px",boxShadow:"0 8px 24px rgba(0,0,0,0.15)",zIndex:50,width:"280px",maxHeight:"240px",overflowY:"auto"}}>
                    {clients.length===0?<div style={{padding:"12px 16px",fontSize:"13px",color:"#9ca3af"}}>No saved clients</div>
                    :clients.map(c=>(
                      <div key={c.id} onClick={()=>loadClient(c)}
                        style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",cursor:"pointer",borderBottom:"1px solid #f3f4f6"}}
                        onMouseEnter={e=>e.currentTarget.style.background="#fff7ed"}
                        onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                        <div>
                          <div style={{fontSize:"13px",fontWeight:600,color:"#1f2937"}}>{c.name}</div>
                          <div style={{fontSize:"11px",color:"#9ca3af"}}>{c.gstin||c.phone||""}</div>
                        </div>
                        <button onClick={e=>deleteClient(c.id,c.name,e)} style={{color:"#f87171",fontSize:"13px",border:"none",background:"none",cursor:"pointer",padding:"0 4px"}}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={saveClient} disabled={saving}
                  style={{fontSize:"12px",padding:"4px 12px",borderRadius:"6px",background:"#f97316",color:"#fff",border:"none",cursor:"pointer",fontWeight:600,opacity:saving?0.6:1}}>
                  {saving?"...":"Save Client"}
                </button>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
              <div><label className={lbl}>Company / Client Name</label><input className={inp} value={clientName} onChange={e=>setClientName(e.target.value)} placeholder="e.g. Pasupati Acrylon Ltd"/></div>
              <div><label className={lbl}>Address</label><textarea className={inp} rows={3} value={clientAddress} onChange={e=>setClientAddress(e.target.value)} placeholder="Full address with district, state, PIN" style={{resize:"vertical"}}/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
                <div><label className={lbl}>Phone</label><input className={inp} value={clientPhone} onChange={e=>setClientPhone(e.target.value)} placeholder="+91 98765 43210"/></div>
                <div><label className={lbl}>Email</label><input className={inp} value={clientEmail} onChange={e=>setClientEmail(e.target.value)} placeholder="purchase@client.com"/></div>
              </div>
              <div><label className={lbl}>GSTIN</label><input className={inp} value={clientGstin} onChange={e=>setClientGstin(e.target.value)} placeholder="15-digit GSTIN"/></div>
            </div>
          </div>

          {/* Line Items */}
          <div className={card}>
            <p style={{fontSize:"13px",fontWeight:700,color:"#374151",marginBottom:"12px"}}>Line Items</p>
            <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
              {items.map((it,idx)=>(
                <div key={it.id} style={{border:"1px solid #e5e7eb",borderRadius:"8px",padding:"12px",background:"#f9fafb"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
                    <span style={{fontSize:"12px",fontWeight:700,color:"#f97316"}}>Item {idx+1}</span>
                    {items.length>1&&<button onClick={()=>setItems(p=>p.filter(i=>i.id!==it.id))} style={{color:"#f87171",fontSize:"12px",border:"none",background:"none",cursor:"pointer"}}>✕ Remove</button>}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
                    <div style={{gridColumn:"1/-1"}}><label className={lbl}>Description</label><input className={inp} value={it.description} onChange={e=>updateItem(it.id,"description",e.target.value)} placeholder="Product / Service name"/></div>
                    <div><label className={lbl}>HSN / SAC</label><input className={inp} value={it.hsnSac} onChange={e=>updateItem(it.id,"hsnSac",e.target.value)}/></div>
                    <div><label className={lbl}>Unit</label>
                      <select className={inp} value={it.unit} onChange={e=>updateItem(it.id,"unit",e.target.value)}>
                        {UNITS.map(u=><option key={u}>{u}</option>)}
                      </select>
                    </div>
                    <div><label className={lbl}>Qty</label><input type="number" className={inp} value={it.qty} onChange={e=>updateItem(it.id,"qty",e.target.value)}/></div>
                    <div><label className={lbl}>Rate (INR)</label><input type="number" className={inp} value={it.rate} onChange={e=>updateItem(it.id,"rate",e.target.value)}/></div>
                    <div style={{gridColumn:"1/-1"}}><label className={lbl}>Amount (auto)</label>
                      <input className={inp} readOnly value={it.amount?toINR(it.amount):"0.00"} style={{background:"#fff7ed",fontWeight:600,color:"#c2410c"}}/>
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={()=>setItems(p=>[...p,emptyItem()])} style={{color:"#f97316",fontSize:"13px",fontWeight:600,border:"none",background:"none",cursor:"pointer",textAlign:"left"}}>+ Add Item</button>
            </div>
          </div>

          {/* Tax */}
          <div className={card}>
            <p style={{fontSize:"13px",fontWeight:700,color:"#374151",marginBottom:"12px"}}>Tax</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"12px"}}>
              <div><label className={lbl}>Tax Type</label>
                <select className={inp} value={taxType} onChange={e=>setTaxType(e.target.value)}>
                  <option value="IGST">IGST — Inter-state</option>
                  <option value="CGST+SGST">CGST + SGST — Intra-state</option>
                  <option value="Nil">Nil / Exempt</option>
                </select>
              </div>
              <div><label className={lbl}>Rate (%)</label>
                <select className={inp} value={taxRate} onChange={e=>setTaxRate(parseFloat(e.target.value))}>
                  {TAX_RATES.map(r=><option key={r} value={r}>{r}%</option>)}
                </select>
              </div>
            </div>
            <div style={{background:"#f9fafb",borderRadius:"6px",padding:"12px",fontSize:"13px"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}><span style={{color:"#6b7280"}}>Taxable Amount</span><span style={{fontWeight:600}}>INR {toINR(taxable)}</span></div>
              {taxType==="IGST"&&<div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}><span style={{color:"#6b7280"}}>IGST @ {taxRate}%</span><span style={{fontWeight:600}}>INR {toINR(tax)}</span></div>}
              {taxType==="CGST+SGST"&&<>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}><span style={{color:"#6b7280"}}>CGST @ {taxRate/2}%</span><span style={{fontWeight:600}}>INR {toINR(tax/2)}</span></div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}><span style={{color:"#6b7280"}}>SGST @ {taxRate/2}%</span><span style={{fontWeight:600}}>INR {toINR(tax/2)}</span></div>
              </>}
              <div style={{display:"flex",justifyContent:"space-between",borderTop:"1px solid #e5e7eb",paddingTop:"8px",marginTop:"4px",fontWeight:700,fontSize:"15px",color:"#c2410c"}}>
                <span>Grand Total</span><span>INR {toINR(grand)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className={card}>
            <p style={{fontSize:"13px",fontWeight:700,color:"#374151",marginBottom:"12px"}}>Terms & Notes</p>
            <textarea className={inp} rows={4} value={notes} onChange={e=>setNotes(e.target.value)} style={{resize:"vertical"}}/>
          </div>
        </div>
      )}

      {/* PREVIEW */}
      {appTab==="invoice" && formTab==="preview" && (
        <div style={{maxWidth:"760px",margin:"0 auto",padding:"16px"}}>
          <p style={{textAlign:"center",fontSize:"12px",color:"#9ca3af",marginBottom:"12px"}}>Preview — click Print/PDF to save</p>
          <div style={{boxShadow:"0 4px 24px rgba(0,0,0,0.12)",borderRadius:"4px",overflow:"hidden",border:"1px solid #e5e7eb",background:"#fff",padding:"16px"}}
            dangerouslySetInnerHTML={{__html:buildPrintHTML({docType,invoiceNo,invoiceDate,dueDate,poRef,vehicleNo,lrNo,modeOfTransport,incoterms,placeOfSupply,clientName,clientAddress,clientGstin,clientPhone,clientEmail,items,taxType,taxRate,taxable,tax,grand,notes})
              .replace(/<!DOCTYPE[\s\S]*?<body[^>]*>/i,"").replace(/<\/body>[\s\S]*/i,"").replace(/<script[\s\S]*?<\/script>/gi,"")}}/>
        </div>
      )}

      {/* CLIENTS */}
      {appTab==="clients" && (
        <div style={{maxWidth:"720px",margin:"0 auto",padding:"16px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
            <h2 style={{fontSize:"16px",fontWeight:700,color:"#374151"}}>Saved Clients</h2>
            <button onClick={fetchClients} style={{fontSize:"12px",color:"#f97316",fontWeight:600,border:"none",background:"none",cursor:"pointer"}}>↺ Refresh</button>
          </div>
          {clients.length===0
            ?<div style={{textAlign:"center",color:"#9ca3af",padding:"40px",background:"#fff",borderRadius:"8px",boxShadow:"0 1px 4px rgba(0,0,0,0.08)"}}>No clients saved yet.</div>
            :<div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
              {clients.map(c=>(
                <div key={c.id} style={{background:"#fff",borderRadius:"8px",boxShadow:"0 1px 4px rgba(0,0,0,0.08)",padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",cursor:"pointer"}}
                  onClick={()=>{loadClient(c);setAppTab("invoice");}}>
                  <div>
                    <div style={{fontWeight:700,color:"#1f2937",fontSize:"14px"}}>{c.name}</div>
                    <div style={{fontSize:"12px",color:"#6b7280",marginTop:"2px"}}>{c.address}</div>
                    <div style={{fontSize:"11px",color:"#9ca3af",marginTop:"4px",display:"flex",gap:"12px"}}>
                      {c.gstin&&<span>GSTIN: {c.gstin}</span>}
                      {c.phone&&<span>{c.phone}</span>}
                      {c.email&&<span>{c.email}</span>}
                    </div>
                  </div>
                  <button onClick={e=>deleteClient(c.id,c.name,e)} style={{color:"#f87171",fontSize:"14px",border:"none",background:"none",cursor:"pointer",marginLeft:"16px"}}>✕</button>
                </div>
              ))}
            </div>
          }
        </div>
      )}

      {/* HISTORY */}
      {appTab==="history" && (
        <div style={{maxWidth:"720px",margin:"0 auto",padding:"16px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
            <h2 style={{fontSize:"16px",fontWeight:700,color:"#374151"}}>Invoice History</h2>
            <button onClick={fetchInvoices} style={{fontSize:"12px",color:"#f97316",fontWeight:600,border:"none",background:"none",cursor:"pointer"}}>↺ Refresh</button>
          </div>
          {loading?<div style={{textAlign:"center",color:"#9ca3af",padding:"40px"}}>Loading...</div>
          :invoices.length===0
            ?<div style={{textAlign:"center",color:"#9ca3af",padding:"40px",background:"#fff",borderRadius:"8px",boxShadow:"0 1px 4px rgba(0,0,0,0.08)"}}>No invoices saved yet.</div>
            :<div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
              {invoices.map(inv=>(
                <div key={inv.id} style={{background:"#fff",borderRadius:"8px",boxShadow:"0 1px 4px rgba(0,0,0,0.08)",padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}
                  onClick={()=>loadInvoice(inv)}>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                      <span style={{fontWeight:700,color:"#1f2937",fontSize:"14px"}}>{inv.invoice_no}</span>
                      <span style={{fontSize:"11px",padding:"2px 8px",borderRadius:"4px",fontWeight:600,background:inv.doc_type==="Tax Invoice"?"#fff7ed":inv.doc_type==="Proforma Invoice"?"#eff6ff":"#f3f4f6",color:inv.doc_type==="Tax Invoice"?"#c2410c":inv.doc_type==="Proforma Invoice"?"#1d4ed8":"#4b5563"}}>
                        {inv.doc_type}
                      </span>
                    </div>
                    <div style={{fontSize:"13px",color:"#6b7280",marginTop:"2px"}}>{inv.client_name}</div>
                    <div style={{fontSize:"12px",color:"#9ca3af",marginTop:"2px",display:"flex",gap:"12px"}}>
                      <span>{fmtDate(inv.invoice_date)}</span>
                      <span style={{fontWeight:600,color:"#f97316"}}>INR {(parseFloat(inv.grand_total)||0).toLocaleString("en-IN",{minimumFractionDigits:2})}</span>
                    </div>
                  </div>
                  <button onClick={e=>deleteInvoice(inv.id,inv.invoice_no,e)} style={{color:"#f87171",fontSize:"14px",border:"none",background:"none",cursor:"pointer",marginLeft:"16px"}}>✕</button>
                </div>
              ))}
            </div>
          }
        </div>
      )}
    </div>
  );
}
