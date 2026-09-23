import express from 'express';
const app=express(); const PORT=process.env.PORT||3000;
app.use(express.static('public'));
const cache=new Map();
async function chart(symbol, range='2y'){
 const key=`${symbol}:${range}`, hit=cache.get(key); if(hit&&Date.now()-hit.t<300000)return hit.v;
 const u=`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=${range}&includePrePost=false&events=div%2Csplits`;
 const r=await fetch(u,{headers:{'User-Agent':'Mozilla/5.0 StockDashboard/1.0','Accept':'application/json'}}); if(!r.ok) throw new Error(`market data ${r.status}`);
 const j=await r.json(), x=j?.chart?.result?.[0]; if(!x) throw new Error('symbol not found'); cache.set(key,{t:Date.now(),v:x}); return x;
}
function vals(x){return (x?.indicators?.adjclose?.[0]?.adjclose||x?.indicators?.quote?.[0]?.close||[]).filter(Number.isFinite)}
function sma(a,n){return a.length>=n?a.slice(-n).reduce((s,v)=>s+v,0)/n:null}
function rsi(a,n=14){if(a.length<n+1)return null; let g=0,l=0; for(let i=a.length-n;i<a.length;i++){const d=a[i]-a[i-1]; if(d>=0)g+=d; else l-=d} const ag=g/n, al=l/n; return al===0?100:100-(100/(1+ag/al))}
function metrics(x){const a=vals(x), price=a.at(-1), prev=a.at(-2), hi=Math.max(...a); return {symbol:x.meta.symbol,name:x.meta.longName||x.meta.shortName||x.meta.symbol,currency:x.meta.currency,price,change:price-prev,changePct:(price/prev-1)*100,rsi:rsi(a),sma200:sma(a,200),above200:sma(a,200)?price>=sma(a,200):null,drawdown:(price/hi-1)*100,high2y:hi,asOf:x.meta.regularMarketTime?new Date(x.meta.regularMarketTime*1000).toISOString():null}}
app.get('/api/dashboard/:symbol',async(req,res)=>{try{const sym=req.params.symbol.trim().toUpperCase(); if(!/^[A-Z0-9.^=-]{1,15}$/.test(sym))return res.status(400).json({error:'Invalid ticker'}); const [s,sp,v]=await Promise.all([chart(sym),chart('^GSPC'),chart('^VIX','1y')]); const sm=metrics(s), spm=metrics(sp), vm=metrics(v); res.json({stock:sm,market:{vix:vm.price,sp500Drawdown:spm.drawdown,sp500Price:spm.price,sp500Sma200:spm.sma200,sp500Above200:spm.above200},fearGreed:{available:false,note:'무료·무키 방식의 안정적인 공식 데이터 소스가 없어 초기 버전에서는 제외했습니다.'},sourceNote:'가격/기술지표는 무료 시장 데이터로 계산되며 지연·중단될 수 있습니다.'});}catch(e){res.status(502).json({error:'데이터를 불러오지 못했습니다.',detail:e.message})}});
app.get('/health',(q,r)=>r.json({ok:true}));
app.listen(PORT,()=>console.log(`Stock dashboard running on ${PORT}`));
