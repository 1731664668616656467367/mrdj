const { useState, useEffect, useRef, useCallback } = React;

// ========== Utilities ==========
const CATS = [
  { key: "breakfast", name: "早餐", icon: "\ud83c\udf05" },
  { key: "lunch",     name: "午餐", icon: "\ud83c\udf71" },
  { key: "dinner",    name: "晚餐", icon: "\ud83c\udf5c" },
  { key: "snacks",    name: "零食", icon: "\ud83c\udf6a" },
  { key: "drinks",    name: "饮料", icon: "\ud83e\udd64" },
  { key: "commute",   name: "通勤", icon: "\ud83d\ude8c" },
  { key: "other",     name: "其他", icon: "\ud83d\udce6" }
];
const SK = "daily_expense_hk";
const pad2 = n => String(n).padStart(2,"0");
const today = () => { const d=new Date(); return { y:d.getFullYear(), m:d.getMonth()+1, d:d.getDate() }; };
const dateStr = o => o.y+"\u5e74"+pad2(o.m)+"\u6708"+pad2(o.d)+"\u65e5";
const mnthStr = (y,m) => y+"\u5e74"+pad2(m)+"\u6708";
const daysIn = (y,m) => new Date(y,m,0).getDate();

function load(d) {
  try { const r = localStorage.getItem(SK+"_"+dateStr(d)); return r ? JSON.parse(r) : {}; }
  catch(e) { return {}; }
}
function save(d, data) { localStorage.setItem(SK+"_"+dateStr(d), JSON.stringify(data)); }
function catSum(data) {
  let s=0;
  CATS.forEach(c=>{
    const r=data[c.key];
    if(Array.isArray(r)) r.forEach(v=>{const n=parseFloat(v);if(!isNaN(n))s+=n;});
    else{const n=parseFloat(r);if(!isNaN(n))s+=n;}
  });
  return s;
}

// ========== AddModal Component ==========
function AddModal({ show, icon, name, onClose, onConfirm }) {
  const [amt, setAmt] = useState("");
  const inpRef = useRef(null);

  useEffect(() => { if (show && inpRef.current) setTimeout(() => inpRef.current.focus(), 100); }, [show]);

  if (!show) return null;
  return (
    React.createElement("div", { className: "modal-overlay show", onClick: onClose },
      React.createElement("div", { className: "modal-card", onClick: e => e.stopPropagation() },
        React.createElement("div", { className: "modal-icon" }, icon),
        React.createElement("div", { className: "modal-name" }, name),
        React.createElement("input", { ref: inpRef, className: "modal-input", type: "text",
          inputMode: "decimal", placeholder: "\u8f93\u5165\u91d1\u989d",
          value: amt, onChange: e => setAmt(e.target.value),
          onKeyDown: e => { if (e.key === "Enter") onConfirm(amt); }
        }),
        React.createElement("div", { className: "modal-btns" },
          React.createElement("button", { className: "modal-btn modal-btn-cancel", onClick: onClose }, "\u53d6\u6d88"),
          React.createElement("button", { className: "modal-btn modal-btn-confirm",
            onClick: () => onConfirm(amt) }, "\u5b8c\u6210")
        )
      )
    )
  );
}

// ========== DailyTab Component ==========
function DailyTab() {
  const [data, setData] = useState({});
  const [modal, setModal] = useState({ show: false, key: "", icon: "", name: "" });
  const o = today();

  useEffect(() => { setData(load(o)); }, []);

  const refresh = useCallback(() => { setData({...load(o)}); }, [o]);

  const openModal = (key) => {
    const c = CATS.find(x => x.key === key);
    setModal({ show: true, key, icon: c.icon, name: c.name });
  };

  const confirmAdd = (amtStr) => {
    const num = parseFloat(amtStr);
    if (isNaN(num) || num <= 0) return;
    const d = load(o);
    let arr = [];
    const raw = d[modal.key];
    if (Array.isArray(raw)) arr = raw.slice();
    else if (raw && raw !== "") arr = [raw];
    arr.push(num.toFixed(2));
    d[modal.key] = arr;
    save(o, d);
    setModal({ show: false, key: "", icon: "", name: "" });
    refresh();
  };

  const total = CATS.reduce((s, c) => {
    const raw = data[c.key];
    let sum = 0;
    if (Array.isArray(raw)) raw.forEach(v => { const n = parseFloat(v); if (!isNaN(n)) sum += n; });
    else { const n = parseFloat(raw); if (!isNaN(n)) sum += n; }
    return s + sum;
  }, 0);

  return React.createElement("div", { className: "tab-content" },
    React.createElement("div", { className: "header" },
      React.createElement("div", { className: "date" }, dateStr(o))
    ),
    React.createElement("div", { className: "card" },
      React.createElement("div", { className: "section-title" }, "\u652f\u51fa\u660e\u7ec6"),
      CATS.map(cat => {
        const raw = data[cat.key];
        let arr = [];
        if (Array.isArray(raw)) arr = raw.slice();
        else if (raw && raw !== "") arr = [raw];
        const sum = arr.reduce((s, v) => { const n = parseFloat(v); return s + (isNaN(n) ? 0 : n); }, 0);
        return React.createElement("div", { key: cat.key, className: "input-row" },
          React.createElement("div", { className: "label-wrap" },
            React.createElement("span", { className: "label-icon" }, cat.icon),
            React.createElement("span", { className: "label-text" }, cat.name)
          ),
          React.createElement("div", { className: "cat-total" },
            React.createElement("span", { className: "cat-sum" }, "\u00a5 " + sum.toFixed(2)),
            React.createElement("button", { className: "bear-add", onClick: () => openModal(cat.key) },
              React.createElement("span", { className: "paw-icon" }, "\ud83d\udc3e"),
              React.createElement("span", { className: "paw-label" }, "ADD")
            )
          )
        );
      })
    ),
    React.createElement("div", { className: "total-card" },
      React.createElement("div", { className: "total-row" },
        React.createElement("span", { className: "total-label" }, "\u2654 \u4eca\u65e5\u603b\u82b1\u8d39"),
        React.createElement("span", { className: "total-amount" }, "\u00a5 " + total.toFixed(2))
      )
    ),
    React.createElement("button", { className: "clear-btn", onClick: () => {
      if (!confirm("\u6e05\u7a7a\u6240\u6709\u91d1\u989d\uff1f")) return;
      const empty = {}; CATS.forEach(c => { empty[c.key] = []; });
      save(o, empty); refresh();
    } }, "\u2654 \u6e05\u7a7a\u6240\u6709\u91d1\u989d"),
    React.createElement("div", { className: "footer" }, "\u6bcf\u6b21\u4fee\u6539\u81ea\u52a8\u4fdd\u5b58\u5230\u672c\u5730"),
    React.createElement(AddModal, {
      show: modal.show,
      icon: modal.icon,
      name: modal.name,
      onClose: () => setModal({ ...modal, show: false }),
      onConfirm: confirmAdd
    })
  );
}

// ========== MonthlyTab Component ==========
function MonthlyTab() {
  const [ym, setYm] = useState(today());

  const { y, m } = ym;
  const days = daysIn(y, m);
  const rows = [];
  let total = 0;
  for (let d = 1; d <= days; d++) {
    const o = { y, m, d };
    const data = load(o);
    const dayTotal = catSum(data);
    rows.push({ date: pad2(d) + "\u65e5", total: dayTotal });
    total += dayTotal;
  }
  const hasDays = rows.filter(r => r.total > 0).length;

  return React.createElement("div", { className: "tab-content" },
    React.createElement("div", { className: "month-header" },
      React.createElement("div", { className: "month-nav" },
        React.createElement("button", { className: "nav-btn", onClick: () => {
          let nm = m - 1; let ny = y;
          if (nm < 1) { nm = 12; ny--; }
          setYm({ y: ny, m: nm });
        } }, "\u2039"),
        React.createElement("span", { className: "month-label" }, mnthStr(y, m)),
        React.createElement("button", { className: "nav-btn", onClick: () => {
          let nm = m + 1; let ny = y;
          if (nm > 12) { nm = 1; ny++; }
          setYm({ y: ny, m: nm });
        } }, "\u203a")
      ),
      React.createElement("div", { className: "summary" }, "\u5171 " + days + " \u5929 \u00b7 \u6709\u652f\u51fa " + hasDays + " \u5929")
    ),
    React.createElement("div", { className: "card" },
      React.createElement("div", { className: "section-title" }, "\u6bcf\u65e5\u652f\u51fa\u660e\u7ec6"),
      React.createElement("div", { style: { maxHeight: "220px", overflowY: "auto" } },
        React.createElement("table", { className: "data-table" },
          React.createElement("thead", null, React.createElement("tr", null,
            React.createElement("th", null, "\u65e5\u671f"),
            React.createElement("th", null, "\u603b\u82b1\u8d39")
          )),
          React.createElement("tbody", null,
            rows.map((r, i) =>
              React.createElement("tr", { key: i },
                React.createElement("td", null, r.date),
                React.createElement("td", null, r.total > 0 ? "\u00a5 " + r.total.toFixed(2) : "-")
              )
            )
          )
        )
      )
    ),
    React.createElement("div", { className: "total-card" },
      React.createElement("div", { className: "total-row" },
        React.createElement("span", { className: "total-label" }, "\u2654 \u6708\u5ea6\u603b\u652f\u51fa"),
        React.createElement("span", { className: "total-amount" }, "\u00a5 " + total.toFixed(2))
      )
    )
  );
}

// ========== YearlyTab Component ==========
function YearlyTab() {
  const [year, setYear] = useState(today().y);
  const canvasRef = useRef(null);

  const months = [];
  let total = 0;
  for (let m = 1; m <= 12; m++) {
    const days = daysIn(year, m);
    let mt = 0;
    for (let d = 1; d <= days; d++) {
      const o = { y: year, m, d };
      mt += catSum(load(o));
    }
    months.push({ month: m, total: mt });
    total += mt;
  }

  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    const w = Math.max(rect.width - 40, 280);
    const h = 180;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.scale(dpr, dpr);

    const values = months.map(m => m.total);
    const labels = months.map(m => m.month + "\u6708");
    const maxVal = Math.max(...values, 1);
    const pad = { top: 20, bottom: 28, left: 40, right: 16 };
    const cw = w - pad.left - pad.right;
    const ch = h - pad.top - pad.bottom;

    // Grid
    ctx.strokeStyle = "#e8d5c0"; ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y2 = pad.top + ch * (1 - i / 4);
      ctx.beginPath(); ctx.moveTo(pad.left, y2); ctx.lineTo(w - pad.right, y2); ctx.stroke();
      ctx.fillStyle = "#a67b5b"; ctx.font = "10px sans-serif"; ctx.textAlign = "right";
      ctx.fillText((maxVal * i / 4).toFixed(0), pad.left - 4, y2 + 3);
    }
    ctx.fillStyle = "#a67b5b"; ctx.font = "10px sans-serif"; ctx.textAlign = "center";
    labels.forEach((l, i) => {
      ctx.fillText(l, pad.left + cw * i / (labels.length - 1 || 1), h - pad.bottom + 14);
    });

    const pts = values.map((v, i) => ({
      x: pad.left + cw * i / (labels.length - 1 || 1),
      y: pad.top + ch * (1 - (maxVal > 0 ? v / maxVal : 0))
    }));

    ctx.beginPath();
    pts.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, pad.top + ch); ctx.lineTo(p.x, p.y); });
    pts.slice().reverse().forEach(p => ctx.lineTo(p.x, pad.top + ch));
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + ch);
    grad.addColorStop(0, "rgba(0,212,170,0.2)"); grad.addColorStop(1, "rgba(0,212,170,0.02)");
    ctx.fillStyle = grad; ctx.fill();

    ctx.beginPath();
    pts.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
    ctx.strokeStyle = "#00d4aa"; ctx.lineWidth = 2; ctx.lineJoin = "round"; ctx.stroke();

    pts.forEach(p => {
      ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#fff"; ctx.fill();
      ctx.strokeStyle = "#00d4aa"; ctx.lineWidth = 1.5; ctx.stroke();
    });
  }, [year, months]);

  useEffect(() => { setTimeout(() => drawChart(), 200); }, [year]);

  return React.createElement("div", { className: "tab-content" },
    React.createElement("div", { className: "month-header" },
      React.createElement("div", { className: "month-nav" },
        React.createElement("button", { className: "nav-btn", onClick: () => setYear(year - 1) }, "\u2039"),
        React.createElement("span", { className: "month-label" }, year + "\u5e74"),
        React.createElement("button", { className: "nav-btn", onClick: () => setYear(year + 1) }, "\u203a")
      ),
      React.createElement("div", { className: "summary" }, "\u5e74\u5ea6\u5171\u652f\u51fa " + total.toFixed(2) + " \u5143")
    ),
    React.createElement("div", { className: "card" },
      React.createElement("div", { className: "section-title" }, "\u6bcf\u6708\u652f\u51fa\u6c47\u603b"),
      React.createElement("div", { style: { maxHeight: "222px", overflowY: "auto" } },
        React.createElement("table", { className: "data-table" },
          React.createElement("thead", null, React.createElement("tr", null,
            React.createElement("th", null, "\u6708\u4efd"),
            React.createElement("th", null, "\u603b\u82b1\u8d39")
          )),
          React.createElement("tbody", null,
            months.map((m, i) =>
              React.createElement("tr", { key: i },
                React.createElement("td", null, m.month + "\u6708"),
                React.createElement("td", null, m.total > 0 ? "\u00a5 " + m.total.toFixed(2) : "-")
              )
            )
          )
        )
      )
    ),
    React.createElement("div", { className: "total-card" },
      React.createElement("div", { className: "total-row" },
        React.createElement("span", { className: "total-label" }, "\u2654 \u5e74\u5ea6\u603b\u652f\u51fa"),
        React.createElement("span", { className: "total-amount" }, "\u00a5 " + total.toFixed(2))
      )
    ),
    React.createElement("div", { className: "chart-wrap" },
      React.createElement("div", { className: "chart-title" }, "\u6bcf\u6708\u652f\u51fa\u6298\u7ebf\u56fe"),
      React.createElement("canvas", { ref: canvasRef, className: "chart-canvas", style: { width: "100%", height: "180px" } })
    )
  );
}

// ========== Main App Component ==========
function App() {
  const [tab, setTab] = useState("daily");

  const tabs = [
    { key: "daily", icon: "\ud83d\udccb", label: "\u4eca\u65e5" },
    { key: "monthly", icon: "\ud83d\udcc5", label: "\u6708\u5ea6" },
    { key: "yearly", icon: "\ud83d\udcca", label: "\u5e74\u5ea6" }
  ];

  return React.createElement("div", { className: "container" },
    React.createElement("div", { className: "tab-bar" },
      tabs.map(t =>
        React.createElement("div", {
          key: t.key,
          className: "tab-item" + (tab === t.key ? " active" : ""),
          onClick: () => setTab(t.key)
        },
          React.createElement("span", { className: "tab-icon" }, t.icon),
          React.createElement("span", null, t.label)
        )
      )
    ),
    tab === "daily" && React.createElement(DailyTab),
    tab === "monthly" && React.createElement(MonthlyTab),
    tab === "yearly" && React.createElement(YearlyTab)
  );
}

// ========== Mount ==========
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(App));
