import express from 'express';
const app=express(); const PORT=process.env.PORT||3000;
app.use(express.static('public'));
const cache=new Map();
async function chart(symbol, range='2y', interval='1d'){
 const key=`${symbol}:${range}:${interval}`, hit=cache.get(key); if(hit&&Date.now()-hit.t<300000)return hit.v;
 const u=`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}&includePrePost=false&events=div%2Csplits`;
 const r=await fetch(u,{headers:{'User-Agent':'Mozilla/5.0 StockDashboard/2.0','Accept':'application/json'}}); if(!r.ok) throw new Error(`market data ${r.status}`);
 const j=await r.json(), x=j?.chart?.result?.[0]; if(!x) throw new Error('symbol not found'); cache.set(key,{t:Date.now(),v:x}); return x;
}
function vals(x){return (x?.indicators?.adjclose?.[0]?.adjclose||x?.indicators?.quote?.[0]?.close||[]).filter(Number.isFinite)}
function sma(a,n){return a.length>=n?a.slice(-n).reduce((s,v)=>s+v,0)/n:null}
function rsi(a,n=14){if(a.length<n+1)return null; let g=0,l=0; for(let i=a.length-n;i<a.length;i++){const d=a[i]-a[i-1]; if(d>=0)g+=d; else l-=d} const ag=g/n, al=l/n; return al===0?100:100-(100/(1+ag/al))}
function metrics(x){const a=vals(x), dailyClose=a.at(-1), prevDaily=a.at(-2), live=Number.isFinite(x?.meta?.regularMarketPrice)?x.meta.regularMarketPrice:dailyClose, prevClose=Number.isFinite(x?.meta?.chartPreviousClose)?x.meta.chartPreviousClose:prevDaily, hi=Math.max(...a), s200=sma(a,200), ts=x.timestamp||[], dailyTs=ts.at(-1); return {symbol:x.meta.symbol,name:x.meta.longName||x.meta.shortName||x.meta.symbol,currency:x.meta.currency,price:live,change:live-prevClose,changePct:prevClose?(live/prevClose-1)*100:null,rsi:rsi(a),sma200:s200,above200:s200?dailyClose>=s200:null,distance200:s200?(dailyClose/s200-1)*100:null,drawdown:(dailyClose/hi-1)*100,high2y:hi,priceAsOf:x.meta.regularMarketTime?new Date(x.meta.regularMarketTime*1000).toISOString():null,dailyAsOf:dailyTs?new Date(dailyTs*1000).toISOString():null,dailyClose}}
function series(x){const ts=x.timestamp||[], close=x?.indicators?.adjclose?.[0]?.adjclose||x?.indicators?.quote?.[0]?.close||[]; return ts.map((t,i)=>Number.isFinite(close[i])?{t:t*1000,p:close[i]}:null).filter(Boolean)}
app.get('/api/dashboard/:symbol',async(req,res)=>{try{const sym=req.params.symbol.trim().toUpperCase(); if(!/^[A-Z0-9.^=-]{1,15}$/.test(sym))return res.status(400).json({error:'Invalid ticker'}); const [s,sp,v]=await Promise.all([chart(sym),chart('^GSPC'),chart('^VIX','1y')]); const sm=metrics(s), spm=metrics(sp), vm=metrics(v); res.json({stock:sm,market:{vix:vm.price,vixAsOf:vm.priceAsOf,sp500Drawdown:spm.drawdown,sp500Price:spm.price,sp500Sma200:spm.sma200,sp500Above200:spm.above200,sp500Distance200:spm.distance200,sp500DailyAsOf:spm.dailyAsOf},fearGreed:{available:false,note:'무료·무키 방식의 안정적인 공식 데이터 소스가 없어 초기 버전에서는 제외했습니다.'},sourceNote:'가격/기술지표는 무료 시장 데이터로 계산되며 지연·중단될 수 있습니다.'});}catch(e){res.status(502).json({error:'데이터를 불러오지 못했습니다.',detail:e.message})}});
app.get('/api/history/:symbol',async(req,res)=>{try{const sym=req.params.symbol.trim().toUpperCase(); const allowed={ '1m':['1mo','1d'],'6m':['6mo','1d'],'1y':['1y','1d'],'5y':['5y','1wk']}; const period=req.query.period||'6m', cfg=allowed[period]||allowed['6m']; const x=await chart(sym,cfg[0],cfg[1]); res.json({symbol:sym,period,series:series(x)});}catch(e){res.status(502).json({error:'차트 데이터를 불러오지 못했습니다.',detail:e.message})}});
app.get('/health',(q,r)=>r.json({ok:true}));
app.listen(PORT,()=>console.log(`Stock dashboard running on ${PORT}`));
