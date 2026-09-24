import express from 'express';
const app=express(); const PORT=process.env.PORT||3000;
app.use(express.static('public'));
const cache=new Map();
const FG_URL='https://fearandgreedgraph.com/api/fear-greed';
async function fearGreed(){
 const key='fear-greed', hit=cache.get(key); if(hit&&Date.now()-hit.t<3600000)return hit.v;
 const r=await fetch(FG_URL,{headers:{'User-Agent':'Mozilla/5.0 StockDashboard/3.0','Accept':'application/json'}});
 if(!r.ok) throw new Error(`fear greed ${r.status}`); const j=await r.json();
 const values=Array.isArray(j?.values)?j.values:[], dates=Array.isArray(j?.dates)?j.dates:[];
 const value=Number(values.at(-1)), asOf=j?.asOf||dates.at(-1)||null; if(!Number.isFinite(value))throw new Error('fear greed value unavailable');
 const rating=value<20?'Extreme Fear':value<45?'Fear':value<55?'Neutral':value<80?'Greed':'Extreme Greed';
 const out={available:true,value,rating,asOf,source:'Fear & Greed Graph'}; cache.set(key,{t:Date.now(),v:out}); return out;
}
async function chart(symbol,range='2y',interval='1d',prepost=false,ttl=300000){
 const key=`${symbol}:${range}:${interval}:${prepost}`,hit=cache.get(key); if(hit&&Date.now()-hit.t<ttl)return hit.v;
 const u=`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}&includePrePost=${prepost?'true':'false'}&events=div%2Csplits`;
 const r=await fetch(u,{headers:{'User-Agent':'Mozilla/5.0 StockDashboard/3.0','Accept':'application/json'}}); if(!r.ok)throw new Error(`market data ${r.status}`);
 const j=await r.json(),x=j?.chart?.result?.[0]; if(!x)throw new Error('symbol not found'); cache.set(key,{t:Date.now(),v:x}); return x;
}
function vals(x){return (x?.indicators?.adjclose?.[0]?.adjclose||x?.indicators?.quote?.[0]?.close||[]).filter(Number.isFinite)}
function sma(a,n){return a.length>=n?a.slice(-n).reduce((s,v)=>s+v,0)/n:null}
function rsi(a,n=14){if(a.length<n+1)return null;let g=0,l=0;for(let i=a.length-n;i<a.length;i++){const d=a[i]-a[i-1];if(d>=0)g+=d;else l-=d}const ag=g/n,al=l/n;return al===0?100:100-(100/(1+ag/al))}
function dailyMetrics(x){const a=vals(x),dailyClose=a.at(-1),hi=Math.max(...a),s200=sma(a,200),ts=x.timestamp||[],dailyTs=ts.at(-1);return{symbol:x.meta.symbol,name:x.meta.longName||x.meta.shortName||x.meta.symbol,currency:x.meta.currency,rsi:rsi(a),sma200:s200,dailyClose,drawdown:(dailyClose/hi-1)*100,high2y:hi,dailyAsOf:dailyTs?new Date(dailyTs*1000).toISOString():null}}
function etParts(ms){const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'short',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date(ms));return Object.fromEntries(parts.map(p=>[p.type,p.value]))}
function sessionFor(ms){const p=etParts(ms),mins=Number(p.hour)*60+Number(p.minute);if(['Sat','Sun'].includes(p.weekday))return'CLOSED';if(mins>=240&&mins<570)return'PRE-MARKET';if(mins>=570&&mins<960)return'REGULAR';if(mins>=960&&mins<1200)return'AFTER-HOURS';return'CLOSED'}
function liveMetrics(x,fallback){const ts=x.timestamp||[],close=x?.indicators?.quote?.[0]?.close||[];let i=close.length-1;while(i>=0&&!Number.isFinite(close[i]))i--;const price=i>=0?close[i]:fallback.dailyClose,ms=i>=0?ts[i]*1000:null;let prev=Number(x?.meta?.chartPreviousClose);if(!Number.isFinite(prev)||prev<=0)prev=Number(x?.meta?.previousClose);if(!Number.isFinite(prev)||prev<=0)prev=fallback.dailyClose;return{price,priceAsOf:ms?new Date(ms).toISOString():null,session:ms?sessionFor(ms):'CLOSED',previousRegularClose:prev,change:price-prev,changePct:prev?(price/prev-1)*100:null}}
app.get('/api/dashboard/:symbol',async(req,res)=>{try{const sym=req.params.symbol.trim().toUpperCase();if(!/^[A-Z0-9.^=-]{1,15}$/.test(sym))return res.status(400).json({error:'Invalid ticker'});
 const [s,live,sp,v,fgResult]=await Promise.all([chart(sym),chart(sym,'1d','1m',true,30000),chart('^GSPC'),chart('^VIX','1d','1m',true,30000),fearGreed().catch(e=>({available:false,note:e.message}))]);
 const sd=dailyMetrics(s),lm=liveMetrics(live,sd),spm=dailyMetrics(sp),vd=dailyMetrics(v),vl=liveMetrics(v,vd); const distance=sd.sma200?(lm.price/sd.sma200-1)*100:null;
 res.json({stock:{...sd,...lm,above200:Number.isFinite(distance)?distance>=0:null,distance200:distance},market:{vix:vl.price,vixAsOf:vl.priceAsOf,sp500Drawdown:spm.drawdown,sp500Price:spm.dailyClose,sp500DailyClose:spm.dailyClose,sp500Sma200:spm.sma200,sp500Above200:spm.sma200?spm.dailyClose>=spm.sma200:null,sp500Distance200:spm.sma200?(spm.dailyClose/spm.sma200-1)*100:null,sp500DailyAsOf:spm.dailyAsOf},fearGreed:fgResult,sourceNote:'현재 가격은 프리마켓·정규장·애프터마켓을 포함한 최신 제공 가격입니다. 무료 데이터는 지연·중단될 수 있습니다.'});
 }catch(e){res.status(502).json({error:'데이터를 불러오지 못했습니다.',detail:e.message})}});
app.get('/health',(q,r)=>r.json({ok:true})); app.listen(PORT,()=>console.log(`Stock dashboard running on ${PORT}`));
