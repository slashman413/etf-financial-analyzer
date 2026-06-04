"use client";

import { useState, useEffect } from "react";
import type { ETFAggregate } from "@/lib/types";
import { getETFAggregate } from "@/lib/api";
import StockDetailModal from "@/components/StockDetailModal";

const navy = "#13243b", blue = "#0386f4", accent = "#2fae90", red = "#e74c3c";
const POPULAR = [
  { t: "SPY", n: "S&P 500" }, { t: "QQQ", n: "Nasdaq 100" },
  { t: "VTI", n: "Total US" }, { t: "VOO", n: "S&P 500" },
  { t: "0050.TW", n: "台灣 50" }, { t: "0056.TW", n: "高股息" },
];
const SC = ["#0386f4","#e74c3c","#2fae90","#f39c12","#9b59b6","#1abc9c","#e91e63","#8bc34a","#00bcd4","#ff5722","#3f51b5"];

export default function MobileHome() {
  const [data, setData] = useState<ETFAggregate | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [active, setActive] = useState("");
  const [detailSymbol, setDetailSymbol] = useState<string | null>(null);
  const [detailName, setDetailName] = useState("");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{symbol:string;name:string}[]>([]);
  const [open, setOpen] = useState(false);

  const load = async (t: string) => {
    setLoading(true); setErr(""); setActive(t); setData(null);
    try { setData(await getETFAggregate(t)); }
    catch (e: any) { setErr(e.message); setData(null); }
    setLoading(false);
  };

  useEffect(() => {
    load("SPY");
    if (q.length < 1) { setResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/etf/autocomplete?q=${encodeURIComponent(q)}`).then(x=>x.json());
        setResults(r);
      } catch { setResults([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const sectors = data ? Object.entries(data.sectorAllocation).map(([k,v])=>({n:k,v})).sort((a,b)=>b.v-a.v) : [];
  const pillsRow = (
    <div style={{display:"flex",gap:4,paddingBottom:10,flexWrap:"nowrap",overflowX:"auto",scrollbarWidth:"none"}}>
      {POPULAR.map(e=>(
        <button key={e.t} onClick={()=>load(e.t)}
          style={{flexShrink:0,padding:"3px 12px",fontSize:12,borderRadius:4,border:0,cursor:"pointer",
            background:active===e.t?blue:"rgba(255,255,255,0.08)",
            color:active===e.t?"#fff":"rgba(255,255,255,0.7)",fontWeight:active===e.t?600:400}}>
          {e.t}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{background:"#f5f5f5",minHeight:"100vh"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      {/* ─── Top Bar ─── */}
      <div style={{background:navy}}>
        <div style={{padding:"10px 14px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",height:40}}>
            <span style={{color:"#fff",fontSize:14,fontWeight:600}}>ETF 財務分析</span>
            <span style={{color:"rgba(255,255,255,0.3)",fontSize:10}}>by yfinance</span>
          </div>
          {/* Search */}
          <div style={{position:"relative",marginBottom:8}}>
            <input placeholder="搜尋 ETF..." value={q}
              onChange={e=>{setQ(e.target.value.toUpperCase());setOpen(true)}}
              onFocus={()=>setOpen(true)}
              style={{width:"100%",height:34,borderRadius:6,border:0,padding:"0 10px 0 32px",fontSize:13,
                background:"rgba(255,255,255,0.15)",color:"#fff",outline:"none",boxSizing:"border-box"}}/>
            <svg style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",width:14,height:14,
              color:"rgba(255,255,255,0.4)",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round"}}
              viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            {open && results.length>0 && (
              <div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:999,marginTop:4,
                background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,boxShadow:"0 4px 20px rgba(0,0,0,0.15)"}}>
                {results.map(r=>(
                  <div key={r.symbol} onClick={()=>{setQ(r.symbol);setOpen(false);load(r.symbol)}}
                    style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",cursor:"pointer",fontSize:13,
                      borderBottom:"1px solid #f1f5f9"}}
                    onMouseEnter={e=>(e.currentTarget.style.background="#eff6ff")}
                    onMouseLeave={e=>(e.currentTarget.style.background="")}>
                    <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",
                      minWidth:52,padding:"2px 8px",borderRadius:4,background:"#2563eb",color:"#fff",fontSize:11,fontWeight:700}}>
                      {r.symbol}
                    </span>
                    <span style={{color:"#334155",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {pillsRow}
        </div>
      </div>

      {/* ─── Content ─── */}
      <div style={{padding:"12px 14px 40px"}}>
        {err && <div style={{background:"#fff0f0",border:"1px solid #ffd4d4",borderRadius:6,padding:"10px 14px",fontSize:12,color:"#c00",marginBottom:12}}>{err}</div>}
        {loading && !data && (
          <div style={{display:"flex",justifyContent:"center",padding:60}}>
            <div style={{width:24,height:24,borderRadius:"50%",border:`3px solid #e0e0e0`,borderTopColor:blue,animation:"spin 0.6s linear infinite"}}/>
          </div>
        )}

        {data && <>
          {/* ─── ETF Header ─── */}
          <div style={{background:"#fff",borderRadius:8,padding:"14px 16px",boxShadow:"0 1px 3px rgba(0,0,0,0.06)",marginBottom:12}}>
            <div style={{display:"flex",alignItems:"baseline",gap:8}}>
              <span style={{fontSize:18,fontWeight:700,color:navy}}>{data.symbol}</span>
              <span style={{fontSize:11,color:"#888"}}>{data.name}</span>
              <span style={{marginLeft:"auto",fontSize:10,color:"#bbb"}}>{data.topHoldings.length}檔</span>
            </div>
            {/* Metrics row — wraps on small screen */}
            <div style={{display:"flex",flexWrap:"wrap",gap:"4px 14px",marginTop:8}}>
              {[
                {l:"PE",v:data.weightedPe,f:(x:number)=>x.toFixed(2)},
                {l:"PB",v:data.weightedPb,f:(x:number)=>x.toFixed(2)},
                {l:"ROE",v:data.weightedRoe!=null?(data.weightedRoe*100).toFixed(1)+"%":"—"},
                {l:"D/E",v:data.weightedDte,f:(x:number)=>x.toFixed(2)},
                {l:"成長",v:data.weightedRevGrowth!=null?(data.weightedRevGrowth*100).toFixed(1)+"%":"—"},
              ].map(m=>(
                <div key={m.l} style={{display:"flex",alignItems:"center",gap:3}}>
                  <span style={{fontSize:10,color:"#999"}}>{m.l}</span>
                  <span style={{fontSize:13,fontWeight:600,color:navy,fontVariantNumeric:"tabular-nums"}}>
                    {m.v!=null?m.v:"—"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ─── Sector (full width, vertical) ─── */}
          <div style={{background:"#fff",borderRadius:8,padding:"16px",boxShadow:"0 1px 3px rgba(0,0,0,0.06)",marginBottom:12}}>
            <h3 style={{fontSize:13,fontWeight:600,color:navy,margin:0}}>產業配置</h3>
            <p style={{fontSize:10,color:"#aaa",margin:"2px 0 12px"}}>依市值加權占比</p>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {sectors.map((s,i)=>(
                <div key={s.n} style={{display:"flex",alignItems:"center",gap:6}}>
                  <div style={{width:7,height:7,borderRadius:2,background:SC[i%SC.length],flexShrink:0}}/>
                  <span style={{fontSize:11,color:"#555",width:70,flexShrink:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.n}</span>
                  <div style={{flex:1,height:5,borderRadius:3,background:"#f0f0f0",overflow:"hidden"}}>
                    <div style={{height:"100%",borderRadius:3,background:SC[i%SC.length],width:`${s.v}%`}}/>
                  </div>
                  <span style={{fontSize:11,fontWeight:600,color:navy,fontVariantNumeric:"tabular-nums",width:34,textAlign:"right"}}>{s.v.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* ─── Metrics Summary (full width, vertical) ─── */}
          <div style={{background:"#fff",borderRadius:8,padding:"16px",boxShadow:"0 1px 3px rgba(0,0,0,0.06)",marginBottom:12}}>
            <h3 style={{fontSize:13,fontWeight:600,color:navy,margin:0}}>指標摘要</h3>
            <p style={{fontSize:10,color:"#aaa",margin:"2px 0 12px"}}>加權平均</p>
            {/* Single column — each item full width */}
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {[
                {l:"加權 PE",v:data.weightedPe,f:(x:number)=>x.toFixed(2)},
                {l:"加權 PB",v:data.weightedPb,f:(x:number)=>x.toFixed(2)},
                {l:"ROE",v:data.weightedRoe!=null?(data.weightedRoe*100).toFixed(1)+"%":"—"},
                {l:"D/E",v:data.weightedDte,f:(x:number)=>x.toFixed(2)},
                {l:"營收成長",v:data.weightedRevGrowth!=null?(data.weightedRevGrowth*100).toFixed(1)+"%":"—"},
                {l:"成分股數",v:data.topHoldings.length},
              ].map(s=>(
                <div key={s.l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                  background:"#fafafa",borderRadius:6,padding:"10px 14px"}}>
                  <span style={{fontSize:12,color:"#888",fontWeight:500}}>{s.l}</span>
                  <span style={{fontSize:15,fontWeight:700,color:navy,fontVariantNumeric:"tabular-nums"}}>
                    {s.v!=null?s.v:"—"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ─── Holdings table (scrollable, all columns) ─── */}
          <div style={{background:"#fff",borderRadius:8,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
            <div style={{padding:"12px 16px",borderBottom:"1px solid #f0f0f0"}}>
              <h3 style={{fontSize:13,fontWeight:600,color:navy,margin:0}}>成分股列表</h3>
            </div>
            <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:520}}>
                <thead>
                  <tr style={{background:"#fafafa"}}>
                    {["#","代號","比重","PE","PB","ROE","D/E","成長","評分"].map(h=>(
                      <th key={h} style={{padding:"8px 10px",textAlign:"right",fontSize:10,fontWeight:600,color:"#999",
                        textTransform:"uppercase",letterSpacing:0.5,borderBottom:"1px solid #eee",
                        ...(h==="代號"?{textAlign:"left"}:{})}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.topHoldings.map((h,i)=>(
                    <tr key={h.symbol} style={{borderBottom:"1px solid #f5f5f5",cursor:"pointer"}}
                      onClick={()=>{setDetailSymbol(h.symbol);setDetailName(h.name)}}>
                      <td style={{padding:"8px 10px",textAlign:"center",color:"#bbb",fontSize:10,fontVariantNumeric:"tabular-nums"}}>{i+1}</td>
                      <td style={{padding:"8px 10px",fontWeight:600,color:navy,fontSize:12}}>{h.symbol}</td>
                      <td style={{padding:"8px 10px",textAlign:"right",fontVariantNumeric:"tabular-nums",color:navy}}>{h.weight.toFixed(2)}</td>
                      <td style={{padding:"8px 10px",textAlign:"right",fontVariantNumeric:"tabular-nums",color:"#555"}}>{h.ratios.pe?.toFixed(1)??"—"}</td>
                      <td style={{padding:"8px 10px",textAlign:"right",fontVariantNumeric:"tabular-nums",color:"#555"}}>{h.ratios.pb?.toFixed(1)??"—"}</td>
                      <td style={{padding:"8px 10px",textAlign:"right",fontVariantNumeric:"tabular-nums",color:"#555"}}>{h.ratios.roe!=null?(h.ratios.roe*100).toFixed(1):"—"}</td>
                      <td style={{padding:"8px 10px",textAlign:"right",fontVariantNumeric:"tabular-nums",color:"#555"}}>{h.ratios.debtToEquity?.toFixed(2)??"—"}</td>
                      <td style={{padding:"8px 10px",textAlign:"right",fontVariantNumeric:"tabular-nums",fontWeight:600,
                        color:h.ratios.revenueGrowth!=null?(h.ratios.revenueGrowth>0?accent:red):"#555"}}>
                        {h.ratios.revenueGrowth!=null?(h.ratios.revenueGrowth*100).toFixed(1):"—"}
                      </td>
                      <td style={{padding:"8px 10px",textAlign:"center",fontWeight:700,fontSize:13,fontVariantNumeric:"tabular-nums",
                        background:h.score!=null?(h.score>=7?"#e8f5e9":h.score>=4?"#fff8e1":"#ffebee"):"transparent",
                        color:h.score!=null?(h.score>=7?"#2e7d32":h.score>=4?"#f57f17":"#c62828"):"#999",borderRadius:4}}>
                        {h.score?.toFixed(1)??"—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{textAlign:"center",paddingTop:12}}>
            <span style={{fontSize:9,color:"#ccc",letterSpacing:1,textTransform:"uppercase"}}>資料來源: yfinance · 即時更新</span>
          </div>
        </>}
      </div>
      <StockDetailModal open={detailSymbol!=null} onClose={()=>{setDetailSymbol(null);setDetailName("")}}
        symbol={detailSymbol??""} name={detailName}/>
    </div>
  );
}
