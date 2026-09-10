(()=>{"use strict";
const D=window.AUDITORIA_DATA;
if(!D||!Array.isArray(D.records))return;
const T=D.metadata?.targetLabelsPerStore||6000,$=id=>document.getElementById(id);
const rec=new Map(D.records.map(r=>[`${r.storeId}|${r.month}`,r])),storeMap=new Map(D.stores.map(s=>[s.id,s]));
const nf=new Intl.NumberFormat("pt-BR"),cf=new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}),pf=new Intl.NumberFormat("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1});
const monthFmt=new Intl.DateTimeFormat("pt-BR",{month:"long",year:"numeric",timeZone:"UTC"});
const state={view:"dashboard",month:D.metadata.latestMonth,scope:"network",id:"",metric:"labels",q:"",storeRegion:"ALL",storeStatus:"ALL",dbRegion:"ALL",dbStatus:"ALL"};
const titles={
 dashboard:["Visão Executiva","Síntese executiva para reunião e tomada de decisão."],
 comparison:["Análise Comparativa","Comparações temporais e benchmark do período selecionado."],
 stores:["Lojas","Leitura operacional detalhada por unidade."],
 regions:["Regionais","Consolidação gerencial por regional."],
 evolution:["Evolução Mensal","Série histórica e outras óticas dos principais indicadores."],
 recommendations:["Recomendações","Orientações diretas para o período selecionado."],
 database:["Base de Dados","Leitura analítica, semáforos e tendências por loja."]
};
const metrics={
 labels:{label:"Etiquetas auditadas",type:"integer",dir:"up",color:"#5aa99e"},
 divergences:{label:"Divergências encontradas",type:"integer",dir:"down",color:"#dd6b7f"},
 noPrice:{label:"Produtos sem preço",type:"integer",dir:"down",color:"#d4a65b"},
 discountCount:{label:"Quantidade de descontos",type:"integer",dir:"down",color:"#897eb8"},
 discountValue:{label:"Valor de descontos",type:"currency",dir:"down",color:"#668bd5"}
};
const regionColors={"GUARDIÕES DA CHAMA":"#b97943","GUARDIÕES DA LUZ":"#5aa99e","OCEANO MARA":"#668bd5","RAIO BRAVO":"#c29d52","RAÍZES DO LAR":"#72a65e","VENTO DOURADO":"#897eb8"};
const safe=v=>v==null?"":String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const attr=v=>safe(v).replace(/`/g,"&#96;");
const fmt=(v,t="integer")=>v==null||Number.isNaN(v)?"—":t==="currency"?cf.format(v):t==="percent"?pf.format(v)+"%":t==="decimal"?pf.format(v):nf.format(Math.round(v));
const mt=m=>{if(!m)return"—";let s=monthFmt.format(new Date(`${m}-01T00:00:00Z`));return s.charAt(0).toUpperCase()+s.slice(1)};
const sum=a=>a.reduce((x,y)=>x+(Number.isFinite(y)?y:0),0);
const avg=a=>{const b=a.filter(Number.isFinite);return b.length?sum(b)/b.length:null};
const get=(id,m=state.month)=>rec.get(`${id}|${m}`)||null;
const shiftMonth=(m,d)=>{const[y,mo]=m.split("-").map(Number),x=new Date(Date.UTC(y,mo-1+d,1));return`${x.getUTCFullYear()}-${String(x.getUTCMonth()+1).padStart(2,"0")}`};
const prevMonth=m=>shiftMonth(m,-1),yearAgo=m=>shiftMonth(m,-12);
const pct=(a,b)=>a==null||b==null||b===0?null:(a-b)/Math.abs(b)*100;

function scopeStores(scope=state.scope,id=state.id){
 if(scope==="region")return D.stores.filter(s=>s.region===id);
 if(scope==="store")return D.stores.filter(s=>String(s.id)===String(id));
 return D.stores;
}
function summary(m=state.month,scope=state.scope,id=state.id){
 const ss=scopeStores(scope,id),rr=ss.map(s=>get(s.id,m)).filter(Boolean),op=rr.filter(r=>r.labels!=null);
 const labels=sum(rr.map(r=>r.labels)),div=sum(rr.map(r=>r.divergences)),np=sum(rr.map(r=>r.noPrice)),dc=sum(rr.map(r=>r.discountCount)),dv=sum(rr.map(r=>r.discountValue));
 const target=op.length*T,hit=op.filter(r=>r.labels>=T).length;
 return{ss,rr,op,labels,div,np,dc,dv,target,hit,att:target?labels/target*100:null,hitRate:op.length?hit/op.length*100:null,dr:labels?div/labels*1000:null,npr:labels?np/labels*1000:null};
}
function currentName(){
 if(state.scope==="region")return state.id||"Regional";
 if(state.scope==="store"){const s=storeMap.get(+state.id);return s?`${s.code} · ${s.name}`:"Loja"}
 return"Total Rede";
}
function networkBench(m=state.month){
 const rows=D.stores.map(s=>get(s.id,m)).filter(r=>r&&r.labels!=null);
 return{discountCount:avg(rows.map(r=>r.discountCount)),discountValue:avg(rows.map(r=>r.discountValue))};
}
function storeStatus(store,m=state.month){
 const r=get(store.id,m);
 if(!r||r.labels==null)return{cls:"neutral",label:"Sem base",reasons:["Sem registro de etiquetas na competência selecionada."]};
 const b=networkBench(m),reasons=[];
 if(r.labels<T)reasons.push(`Etiquetas abaixo da meta: ${fmt(r.labels)} de ${fmt(T)}.`);
 if(r.discountCount!=null&&b.discountCount!=null&&r.discountCount>b.discountCount)reasons.push(`Quantidade de descontos acima da média da rede: ${fmt(r.discountCount)} vs ${fmt(b.discountCount,"decimal")}.`);
 if(r.discountValue!=null&&b.discountValue!=null&&r.discountValue>b.discountValue)reasons.push(`Valor de descontos acima da média da rede: ${fmt(r.discountValue,"currency")} vs ${fmt(b.discountValue,"currency")}.`);
 if(reasons.length)return{cls:"bad",label:"Crítico",reasons};
 const attention=[];
 if(r.discountCount!=null&&b.discountCount!=null&&r.discountCount>=b.discountCount*.8)attention.push("Quantidade de descontos na faixa de atenção.");
 if(r.discountValue!=null&&b.discountValue!=null&&r.discountValue>=b.discountValue*.8)attention.push("Valor de descontos na faixa de atenção.");
 return attention.length?{cls:"warn",label:"Atenção",reasons:attention}:{cls:"good",label:"Saudável",reasons:[`Meta atingida (${fmt(r.labels)} etiquetas) e descontos abaixo da faixa de atenção.`]};
}
function trend(cur,prev,dir,label,type="integer"){
 const d=pct(cur,prev);
 if(d==null)return'<span class="trend neutral has-tip" data-tip="Sem base comparável no mês anterior.">• sem base</span>';
 const good=dir==="up"?d>=0:d<=0,cls=d===0?"neutral":good?"good":"bad",arrow=d>0?"▲":d<0?"▼":"•";
 const tip=`${label}: ${fmt(prev,type)} em ${mt(prevMonth(state.month))} → ${fmt(cur,type)} em ${mt(state.month)}. ${good?"Movimento favorável":"Movimento desfavorável"} para o indicador.`;
 return`<span class="trend ${cls} has-tip" data-tip="${attr(tip)}">${arrow} ${fmt(Math.abs(d),"percent")}</span>`;
}
function hero(title,desc){
 const s=summary(),pm=summary(prevMonth(state.month),state.scope,state.id),d=pct(s.att,pm.att);
 return`<div class="hero"><div class="hero-top"><div><span class="eyebrow">AUDITORIA DE PREÇOS • ${safe(mt(state.month).toUpperCase())}</span><h2>${safe(title)}</h2><p>${safe(desc)}</p></div><div class="hero-badges"><span class="pill live">● ${s.op.length} lojas com dados operacionais</span><span class="pill">M-1: ${fmt(pm.att,"percent")}</span></div></div><div class="hero-stats"><div class="hero-stat"><span>Escopo</span><strong>${safe(currentName())}</strong></div><div class="hero-stat"><span>Atingimento</span><strong>${fmt(s.att,"percent")}</strong></div><div class="hero-stat"><span>Δ mês anterior</span><strong>${d==null?"—":`${d>=0?"▲":"▼"} ${fmt(Math.abs(d),"percent")}`}</strong></div><div class="hero-stat"><span>Lojas na meta</span><strong>${s.hit}/${s.op.length}</strong></div></div></div>`;
}
function metricCard(label,value,sub,color="#668bd5"){return`<article class="metric-card" style="--accent:${color}"><span class="label">${safe(label)}</span><strong>${value}</strong><small>${sub}</small></article>`}
function scopeStatus(){
 if(state.scope==="store"){const s=storeMap.get(+state.id);return s?storeStatus(s):{cls:"neutral",label:"Sem base",reasons:["Sem loja selecionada."]}}
 const stats=scopeStores().map(s=>storeStatus(s)),bad=stats.filter(x=>x.cls==="bad").length,warn=stats.filter(x=>x.cls==="warn").length;
 return bad?{cls:"bad",label:"Crítico",reasons:[`${bad} unidade(s) críticas no escopo atual.`]}:warn?{cls:"warn",label:"Atenção",reasons:[`${warn} unidade(s) em atenção no escopo atual.`]}:{cls:"good",label:"Saudável",reasons:["Nenhuma unidade crítica no escopo atual."]};
}
function renderDashboard(){
 const s=summary(),pm=summary(prevMonth(state.month),state.scope,state.id),status=scopeStatus();
 const prior=scopeStores().map(x=>({s:x,st:storeStatus(x)})).filter(x=>x.st.cls==="bad").slice(0,6);
 const regs=D.regions.map(r=>[r,summary(state.month,"region",r)]).sort((a,b)=>(b[1].att||0)-(a[1].att||0));
 $("view-dashboard").innerHTML=hero(currentName(),"Leitura consolidada de cobertura, qualidade e descontos do período.")+
 `<div class="grid-6">${metricCard("Etiquetas auditadas",fmt(s.labels),`${trend(s.labels,pm.labels,"up","Etiquetas auditadas")} • meta ${fmt(s.target)}`,"#5aa99e")}${metricCard("Atingimento",fmt(s.att,"percent"),`${trend(s.att,pm.att,"up","Atingimento","percent")} • ${s.hit}/${s.op.length} lojas na meta`,"#70bd88")}${metricCard("Divergências / mil",fmt(s.dr,"decimal"),`${trend(s.dr,pm.dr,"down","Divergências por mil","decimal")} • ${fmt(s.div)} ocorrências`,"#dd6b7f")}${metricCard("Sem preço / mil",fmt(s.npr,"decimal"),`${trend(s.npr,pm.npr,"down","Sem preço por mil","decimal")} • ${fmt(s.np)} produtos`,"#d4a65b")}${metricCard("Qtd. descontos",fmt(s.dc),`${trend(s.dc,pm.dc,"down","Quantidade de descontos")} • período atual`,"#897eb8")}${metricCard("Valor descontos",fmt(s.dv,"currency"),`${trend(s.dv,pm.dv,"down","Valor de descontos","currency")} • período atual`,"#668bd5")}</div>
 <div class="two-col"><article class="panel"><div class="panel-head"><div><h3>Cenário em 10 segundos</h3><p>Indicadores essenciais do escopo selecionado.</p></div><span class="semaphore ${status.cls} has-tip" data-tip="${attr(status.reasons.join(" "))}"><i></i>${status.label}</span></div><div class="gauge-wrap"><div class="gauge" style="--p:${Math.min(100,s.att||0)};--gauge:${s.att>=100?"#70bd88":s.att>=85?"#d4a65b":"#dd6b7f"}"><div><strong>${fmt(s.att,"percent")}</strong><span>atingimento</span></div></div><div class="bar-list"><div class="bar-row"><span>Etiquetas</span><div class="track"><i style="width:${Math.min(100,s.att||0)}%;--bar:#5aa99e"></i></div><strong>${fmt(s.labels)}</strong></div><div class="bar-row"><span>Lojas na meta</span><div class="track"><i style="width:${s.hitRate||0}%;--bar:#668bd5"></i></div><strong>${fmt(s.hitRate,"percent")}</strong></div><div class="bar-row"><span>Divergências/mil</span><div class="track"><i style="width:${Math.min(100,(s.dr||0)*6)}%;--bar:#dd6b7f"></i></div><strong>${fmt(s.dr,"decimal")}</strong></div><div class="bar-row"><span>Sem preço/mil</span><div class="track"><i style="width:${Math.min(100,(s.npr||0)*2)}%;--bar:#d4a65b"></i></div><strong>${fmt(s.npr,"decimal")}</strong></div></div></div></article>
 <article class="panel"><div class="panel-head"><div><h3>Prioridades do período</h3><p>Meta de etiquetas e descontos comparados à média da rede.</p></div></div><div class="priority-list">${prior.map(x=>`<div class="priority-item"><div><strong>${x.s.code} · ${safe(x.s.name)}</strong><span>${safe(x.s.region)}</span></div><span class="semaphore bad has-tip" data-tip="${attr(x.st.reasons.join(" "))}"><i></i>Crítico</span></div>`).join("")||'<div class="priority-item">Nenhuma unidade crítica no escopo.</div>'}</div></article></div>
 <div class="two-col"><article class="panel"><div class="panel-head"><div><h3>Benchmark por regional</h3><p>Atingimento na competência selecionada.</p></div></div><div class="bar-list">${regs.map(([r,x])=>`<div class="bar-row"><span>${safe(r)}</span><div class="track"><i style="width:${Math.min(100,x.att||0)}%;--bar:${regionColors[r]||"#668bd5"}"></i></div><strong>${fmt(x.att,"percent")}</strong></div>`).join("")}</div></article><article class="panel"><div class="panel-head"><div><h3>Leitura gerencial</h3><p>Pontos de controle para a reunião.</p></div></div><div class="bar-list"><div class="bar-row"><span>Valor descontos</span><div class="track"><i style="width:${Math.min(100,Math.abs(pct(s.dv,pm.dv)||0)*3)}%;--bar:#668bd5"></i></div><strong>${fmt(s.dv,"currency")}</strong></div><div class="bar-row"><span>Qtd. descontos</span><div class="track"><i style="width:${Math.min(100,Math.abs(pct(s.dc,pm.dc)||0)*3)}%;--bar:#897eb8"></i></div><strong>${fmt(s.dc)}</strong></div></div></article></div>`;
}
function compareBars(label,cur,prev,ya,type,dir){
 const vals=[cur,prev,ya].filter(v=>v!=null),max=Math.max(1,...vals.map(v=>Math.abs(v))),rows=[["Atual",mt(state.month),cur,"#668bd5"],["Mês anterior",mt(prevMonth(state.month)),prev,"#7d8ca0"],["Ano anterior",mt(yearAgo(state.month)),ya,"#897eb8"]];
 const dm=pct(cur,prev),dy=pct(cur,ya),good=v=>dir==="up"?v>=0:v<=0;
 return`<article class="compare-card"><h3>${safe(label)}</h3>${rows.map(([n,m,v,c])=>`<div class="compare-line"><span>${n}<br><small>${safe(m)}</small></span><div class="track"><i style="width:${Math.max(2,Math.abs(v||0)/max*100)}%;--bar:${c}"></i></div><strong>${fmt(v,type)}</strong></div>`).join("")}<p style="margin:7px 0 0;font-size:8px;color:#8899ac">vs M-1: <span class="trend ${dm==null?"neutral":good(dm)?"good":"bad"}">${dm==null?"—":`${dm>0?"▲":"▼"} ${fmt(Math.abs(dm),"percent")}`}</span> • vs AA: <span class="trend ${dy==null?"neutral":good(dy)?"good":"bad"}">${dy==null?"—":`${dy>0?"▲":"▼"} ${fmt(Math.abs(dy),"percent")}`}</span></p></article>`;
}
function renderComparison(){
 const cur=summary(),pm=summary(prevMonth(state.month),state.scope,state.id),ya=summary(yearAgo(state.month),state.scope,state.id);
 let bench=[];
 if(state.scope==="network")bench=D.regions.map(r=>({title:r,s:summary(state.month,"region",r)})).sort((a,b)=>(b.s.att||0)-(a.s.att||0));
 else if(state.scope==="region")bench=scopeStores().map(s=>({title:`${s.code} · ${s.name}`,s:{att:get(s.id)?.labels!=null?get(s.id).labels/T*100:null}})).sort((a,b)=>(b.s.att||0)-(a.s.att||0));
 else{const st=storeMap.get(+state.id);bench=[{title:st?.name||currentName(),s:cur},{title:st?.region||"Regional",s:summary(state.month,"region",st?.region)},{title:"Total Rede",s:summary(state.month,"network","")}]}
 $("view-comparison").innerHTML=hero("Análise Comparativa · "+currentName(),"Comparação clara entre a competência atual, o mês anterior e o mesmo mês do ano anterior.")+
 `<div class="compare-explain"><div><strong>O que está sendo comparado</strong><p>Atual: ${safe(mt(state.month))} • M-1: ${safe(mt(prevMonth(state.month)))} • Ano anterior: ${safe(mt(yearAgo(state.month)))}.</p></div><div class="legend-swatches"><span><i style="background:#668bd5"></i>Atual</span><span><i style="background:#7d8ca0"></i>M-1</span><span><i style="background:#897eb8"></i>Ano anterior</span></div></div>
 <div class="compare-grid">${compareBars("Etiquetas auditadas",cur.labels,pm.labels,ya.labels,"integer","up")}${compareBars("Atingimento",cur.att,pm.att,ya.att,"percent","up")}${compareBars("Divergências / mil",cur.dr,pm.dr,ya.dr,"decimal","down")}${compareBars("Sem preço / mil",cur.npr,pm.npr,ya.npr,"decimal","down")}${compareBars("Qtd. descontos",cur.dc,pm.dc,ya.dc,"integer","down")}${compareBars("Valor descontos",cur.dv,pm.dv,ya.dv,"currency","down")}</div>
 <div class="panel" style="margin-top:8px"><div class="panel-head"><div><h3>Benchmark da competência atual</h3><p>Comparação dentro do escopo selecionado.</p></div></div><div class="bar-list">${bench.map(x=>`<div class="bar-row"><span>${safe(x.title)}</span><div class="track"><i style="width:${Math.min(100,x.s.att||0)}%;--bar:#668bd5"></i></div><strong>${fmt(x.s.att,"percent")}</strong></div>`).join("")}</div></div>`;
}
function renderStores(){
 const q=state.q.toLocaleLowerCase("pt-BR"),list=D.stores.filter(s=>state.storeRegion==="ALL"||s.region===state.storeRegion).filter(s=>state.storeStatus==="ALL"||storeStatus(s).cls===state.storeStatus).filter(s=>!q||`${s.code} ${s.name} ${s.region}`.toLocaleLowerCase("pt-BR").includes(q));
 $("view-stores").innerHTML=hero("Visão por Lojas","Cards compactos com semáforo e indicadores do período selecionado.")+
 `<div class="toolbar"><input id="store-q" placeholder="Buscar loja, código ou regional..." value="${safe(state.q)}"><select id="store-region"><option value="ALL">Todas as regionais</option>${D.regions.map(r=>`<option value="${safe(r)}" ${state.storeRegion===r?"selected":""}>${safe(r)}</option>`).join("")}</select><select id="store-status"><option value="ALL">Todos os status</option><option value="good" ${state.storeStatus==="good"?"selected":""}>Saudável</option><option value="warn" ${state.storeStatus==="warn"?"selected":""}>Atenção</option><option value="bad" ${state.storeStatus==="bad"?"selected":""}>Crítico</option><option value="neutral" ${state.storeStatus==="neutral"?"selected":""}>Sem base</option></select><button class="btn" id="store-clear">Limpar</button><span class="count">${list.length} lojas</span></div>
 <div class="store-grid">${list.map(s=>{const r=get(s.id),st=storeStatus(s),p=get(s.id,prevMonth(state.month)),att=r?.labels!=null?r.labels/T*100:null;return`<article class="store-card"><div class="card-head"><div><div class="code">${s.code}</div><div class="name">${safe(s.name)}</div><div class="sub">${safe(s.region)}</div></div><span class="semaphore ${st.cls} has-tip" data-tip="${attr(st.reasons.join(" "))}"><i></i>${st.label}</span></div><div class="dense"><div><span>Atingimento</span><strong>${fmt(att,"percent")}</strong></div><div><span>Etiquetas</span><strong>${fmt(r?.labels)}</strong>${trend(r?.labels,p?.labels,"up","Etiquetas auditadas")}</div><div><span>Div./mil</span><strong>${fmt(r?.labels?(r.divergences||0)/r.labels*1000:null,"decimal")}</strong></div><div><span>Sem preço/mil</span><strong>${fmt(r?.labels?(r.noPrice||0)/r.labels*1000:null,"decimal")}</strong></div></div><div class="card-foot"><button class="btn open-store" data-id="${s.id}">Abrir</button><button class="btn open-scenario" data-kind="store" data-id="${s.id}">Cenário</button><button class="btn rec-store" data-id="${s.id}">Recomendação</button></div></article>`}).join("")}</div>`;
}
function renderRegions(){
 const regs=D.regions.map(r=>[r,summary(state.month,"region",r)]).sort((a,b)=>(b[1].att||0)-(a[1].att||0));
 $("view-regions").innerHTML=hero("Visão por Regionais","Regionais compactas com semáforo, cobertura e descontos.")+
 `<div class="region-grid">${regs.map(([r,s])=>{const stats=D.stores.filter(x=>x.region===r).map(storeStatus),bad=stats.filter(x=>x.cls==="bad").length,warn=stats.filter(x=>x.cls==="warn").length,st=bad?{cls:"bad",label:"Crítico"}:warn?{cls:"warn",label:"Atenção"}:{cls:"good",label:"Saudável"};const pm=summary(prevMonth(state.month),"region",r);return`<article class="region-card" style="--region:${regionColors[r]||"#668bd5"}"><div class="region-accent"></div><div class="card-head"><div><div class="code">${safe(r)}</div><div class="sub">${s.ss.length} lojas</div></div><span class="semaphore ${st.cls}"><i></i>${st.label}</span></div><div class="dense"><div><span>Atingimento</span><strong>${fmt(s.att,"percent")}</strong>${trend(s.att,pm.att,"up","Atingimento regional","percent")}</div><div><span>Lojas na meta</span><strong>${s.hit}/${s.op.length}</strong></div><div><span>Div./mil</span><strong>${fmt(s.dr,"decimal")}</strong></div><div><span>Sem preço/mil</span><strong>${fmt(s.npr,"decimal")}</strong></div></div><div class="card-foot"><button class="btn open-region" data-id="${safe(r)}">Abrir</button><button class="btn open-scenario" data-kind="region" data-id="${safe(r)}">Cenário</button><button class="btn rec-region" data-id="${safe(r)}">Recomendação</button></div></article>`}).join("")}</div>`;
}
function pointValue(m,k){const v=scopeStores().map(s=>get(s.id,m)?.[k]).filter(x=>x!=null);return v.length?sum(v):null}
function lineChart(points,color,type,uid="chart"){
 const v=points.filter(p=>p.v!=null);if(v.length<2)return'<div style="padding:20px;color:#8092a8">Histórico insuficiente.</div>';
 const W=1120,H=360,L=80,R=28,T3=22,B=54,min0=Math.min(...v.map(p=>p.v)),max0=Math.max(...v.map(p=>p.v)),range=Math.max(1,max0-min0),lo=Math.max(0,min0-range*.08),hi=max0+range*.12;
 const X=i=>L+i/(v.length-1)*(W-L-R),Y=n=>T3+(1-(n-lo)/(hi-lo))*(H-T3-B),poly=v.map((p,i)=>`${X(i)},${Y(p.v)}`).join(" "),ticks=[0,1,2,3,4].map(i=>lo+(hi-lo)*i/4),step=Math.max(1,Math.ceil(v.length/8)),clip=`clip-${uid.replace(/[^a-zA-Z0-9_-]/g,"")}`;
 return`<svg class="chart-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet"><defs><clipPath id="${clip}"><rect x="${L}" y="${T3}" width="${W-L-R}" height="${H-T3-B}"/></clipPath><linearGradient id="grad-${clip}" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="${color}" stop-opacity=".18"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/></linearGradient></defs><g class="chart-grid">${ticks.map(t=>`<line x1="${L}" x2="${W-R}" y1="${Y(t)}" y2="${Y(t)}"/>`).join("")}</g><g class="chart-axis">${ticks.map(t=>`<text x="${L-12}" y="${Y(t)+4}" text-anchor="end">${fmt(t,type==="currency"?"integer":type)}</text>`).join("")}${v.map((p,i)=>i%step===0||i===v.length-1?`<text x="${X(i)}" y="${H-20}" text-anchor="middle">${p.m.slice(5)}/${p.m.slice(2,4)}</text>`:"").join("")}</g><g clip-path="url(#${clip})"><polygon class="chart-area" style="--fill-color:url(#grad-${clip})" points="${L},${H-B} ${poly} ${W-R},${H-B}"/><polyline class="chart-line" style="--line-color:${color}" points="${poly}"/>${v.map((p,i)=>`<circle class="chart-dot ${i===v.length-1?"latest":""}" style="--line-color:${color}" cx="${X(i)}" cy="${Y(p.v)}" r="${i===v.length-1?5.4:4}"><title>${mt(p.m)}: ${fmt(p.v,type)}</title></circle>`).join("")}</g></svg>`;
}
function columnChart(points,color,type){const v=points.filter(p=>p.v!=null).slice(-12);if(!v.length)return"—";const max=Math.max(1,...v.map(p=>Math.abs(p.v)));return`<div class="columns">${v.map(p=>`<div class="col-item has-tip" data-tip="${attr(`${mt(p.m)}: ${fmt(p.v,type)}`)}"><i style="height:${Math.max(3,Math.abs(p.v)/max*100)}%;--col:${color}"></i><span>${p.m.slice(5)}</span></div>`).join("")}</div>`}
function deltaChart(points,dir){const v=points.filter(p=>p.v!=null),d=[];for(let i=1;i<v.length;i++){const x=pct(v[i].v,v[i-1].v);if(x!=null)d.push({m:v[i].m,v:x})}const show=d.slice(-12),max=Math.max(1,...show.map(x=>Math.abs(x.v)));return`<div class="delta-bars">${show.map(x=>{const good=dir==="up"?x.v>=0:x.v<=0;return`<div class="delta-row"><span>${x.m.slice(5)}</span><div class="track"><i style="width:${Math.max(2,Math.abs(x.v)/max*100)}%;--bar:${good?"#70bd88":"#dd6b7f"}"></i></div><strong class="${good?"good":"bad"}">${x.v>0?"+":""}${fmt(x.v,"percent")}</strong></div>`}).join("")}</div>`}
function renderEvolution(){
 const met=metrics[state.metric],points=D.months.filter(m=>m<=state.month).map(m=>({m,v:pointValue(m,state.metric)})).filter(p=>p.v!=null),first=points[0],last=points.at(-1),max=points.length?points.reduce((a,b)=>b.v>a.v?b:a):null,avg6=avg(points.slice(-6).map(p=>p.v));
 $("view-evolution").innerHTML=hero("Evolução · "+currentName(),"Histórico consolidado até a competência selecionada.")+
 `<article class="panel chart-panel"><div class="panel-head"><div><h3>${met.label}</h3><p>Linha = trajetória histórica. O gráfico é confinado à área de plotagem. Passe o mouse para consultar.</p></div><div class="chart-toolbar">${Object.entries(metrics).map(([k,x])=>`<button class="metric-btn ${state.metric===k?"active":""}" data-metric="${k}">${x.label}</button>`).join("")}</div></div><div class="chart-box">${lineChart(points,met.color,met.type,"evolution")}</div><div class="chart-summary"><div><span>Primeiro registro</span><strong>${first?mt(first.m)+" · "+fmt(first.v,met.type):"—"}</strong></div><div><span>Último registro</span><strong>${last?mt(last.m)+" · "+fmt(last.v,met.type):"—"}</strong></div><div><span>Maior valor</span><strong>${max?fmt(max.v,met.type)+" · "+mt(max.m):"—"}</strong></div><div><span>Média últimos 6 meses</span><strong>${fmt(avg6,met.type)}</strong></div></div></article><div class="secondary-charts"><article class="panel mini-chart"><h3>Últimos 12 meses</h3><p>Leitura por colunas com os mesmos dados do gráfico principal.</p>${columnChart(points,met.color,met.type)}</article><article class="panel mini-chart"><h3>Variação mês a mês</h3><p>Comparação com a competência imediatamente anterior.</p>${deltaChart(points,met.dir)}</article></div>`;
}
function directRecs(){
 const out=[],bench=networkBench();
 if(state.scope==="store"){
  const s=storeMap.get(+state.id),r=get(s?.id),st=s?storeStatus(s):null;
  if(r&&st&&st.cls==="bad")st.reasons.slice(0,3).forEach(reason=>out.push({cls:"bad",title:reason,action:r.labels<T?`Completar ${fmt(T-r.labels)} etiquetas até o fechamento do ciclo.`:"Revisar as causas e corrigir a recorrência no próximo acompanhamento.",owner:"Gerência da Loja"}));
 }else{
  const crit=scopeStores().map(s=>({s,st:storeStatus(s)})).filter(x=>x.st.cls==="bad").slice(0,6);
  crit.forEach(x=>out.push({cls:"bad",title:`${x.s.code} · ${x.s.name}`,action:x.st.reasons[0]||"Tratar causa crítica da competência.",owner:state.scope==="region"?"Regional / Loja":"Operações / Regional"}));
 }
 if(!out.length)out.push({cls:"good",title:"Sem ação crítica identificada",action:"Manter a rotina atual e acompanhar a próxima competência.",owner:"Operações"});
 return out.slice(0,6);
}
function renderRecommendations(){
 const items=directRecs();
 $("view-recommendations").innerHTML=hero("Recomendações · "+currentName(),"Orientações diretas para a competência selecionada.")+
 `<div class="rec-grid">${items.map(x=>`<article class="rec-card ${x.cls}"><span class="semaphore ${x.cls}"><i></i>${x.cls==="good"?"Controle":"Prioridade"}</span><h3>${safe(x.title)}</h3><p>Competência: ${safe(mt(state.month))}.</p><div class="rec-action"><strong>Recomendação</strong><span>${safe(x.action)}</span></div><small>Responsável sugerido: ${safe(x.owner)}</small></article>`).join("")}</div>`;
}
function renderDatabase(){
 const q=state.q.toLocaleLowerCase("pt-BR"),base=scopeStores(),regionFilter=state.scope==="network"?state.dbRegion:(base[0]?.region||"ALL");
 const list=base.filter(s=>regionFilter==="ALL"||s.region===regionFilter).filter(s=>state.dbStatus==="ALL"||storeStatus(s).cls===state.dbStatus).filter(s=>!q||`${s.code} ${s.name} ${s.region}`.toLocaleLowerCase("pt-BR").includes(q));
 const bench=networkBench(),regionDisabled=state.scope!=="network";
 $("view-database").innerHTML=hero("Base consolidada · "+currentName(),"Leitura analítica por loja na competência selecionada, com semáforo atual e tendência versus o mês anterior.")+
 `<div class="legend-grid"><div class="legend-box"><strong>Semáforo = situação em ${safe(mt(state.month))}</strong><p><b>Crítico:</b> abaixo de ${fmt(T)} etiquetas ou quantidade/valor de descontos acima da média da rede. <b>Atenção:</b> meta atingida e descontos entre 80% e 100% da média. <b>Saudável:</b> meta atingida e descontos abaixo de 80% da média. Média da rede: ${fmt(bench.discountCount,"decimal")} descontos/loja e ${fmt(bench.discountValue,"currency")}/loja.</p></div><div class="legend-box"><strong>Setas = variação versus ${safe(mt(prevMonth(state.month)))}</strong><p>▲/▼ = direção matemática. Verde = favorável; vermelho = desfavorável. Passe o mouse para consultar a leitura.</p></div></div>
 <div class="toolbar"><input id="db-q" placeholder="Buscar loja..." value="${safe(state.q)}"><select id="db-region" ${regionDisabled?"disabled":""}><option value="ALL">Todas as regionais</option>${D.regions.map(r=>`<option value="${safe(r)}" ${regionFilter===r?"selected":""}>${safe(r)}</option>`).join("")}</select><select id="db-status"><option value="ALL">Todos os semáforos</option><option value="good" ${state.dbStatus==="good"?"selected":""}>Saudável</option><option value="warn" ${state.dbStatus==="warn"?"selected":""}>Atenção</option><option value="bad" ${state.dbStatus==="bad"?"selected":""}>Crítico</option><option value="neutral" ${state.dbStatus==="neutral"?"selected":""}>Sem base</option></select><button class="btn" id="db-clear">Limpar</button><button class="btn" id="db-csv">Exportar CSV</button><span class="count">${list.length} lojas</span></div>
 <div class="table-shell"><table class="data-table"><thead><tr><th>Status</th><th>Loja</th><th>Regional</th><th>Etiquetas</th><th>Atingimento</th><th>Divergências</th><th>Sem preço</th><th>Qtd descontos</th><th>Qtd descontos AA</th><th>Valor descontos</th><th>Valor descontos AA</th></tr></thead><tbody>${list.map(s=>{const r=get(s.id),p=get(s.id,prevMonth(state.month)),y=get(s.id,yearAgo(state.month)),st=storeStatus(s),att=r?.labels!=null?r.labels/T*100:null;return`<tr><td><span class="semaphore ${st.cls} has-tip" data-tip="${attr(st.reasons.join(" "))}"><i></i>${st.label}</span></td><td><strong>${s.code} · ${safe(s.name)}</strong></td><td>${safe(s.region)}</td><td class="num"><div class="cell-metric"><strong>${fmt(r?.labels)}</strong><small>${trend(r?.labels,p?.labels,"up","Etiquetas")}</small></div></td><td class="num"><strong>${fmt(att,"percent")}</strong></td><td class="num"><div class="cell-metric"><strong>${fmt(r?.divergences)}</strong><small>${trend(r?.divergences,p?.divergences,"down","Divergências")}</small></div></td><td class="num"><div class="cell-metric"><strong>${fmt(r?.noPrice)}</strong><small>${trend(r?.noPrice,p?.noPrice,"down","Sem preço")}</small></div></td><td class="num"><div class="cell-metric"><strong>${fmt(r?.discountCount)}</strong><small>${trend(r?.discountCount,p?.discountCount,"down","Quantidade de descontos")}</small></div></td><td class="num">${fmt(y?.discountCount)}</td><td class="num"><div class="cell-metric"><strong>${fmt(r?.discountValue,"currency")}</strong><small>${trend(r?.discountValue,p?.discountValue,"down","Valor de descontos","currency")}</small></div></td><td class="num">${fmt(y?.discountValue,"currency")}</td></tr>`}).join("")}</tbody></table></div>`;
}
function exportCSV(){
 const rows=[["Competência","Loja","Nome","Regional","Etiquetas","Atingimento","Divergências","Sem preço","Qtd descontos","Qtd descontos AA","Valor descontos","Valor descontos AA","Status"]];
 scopeStores().forEach(s=>{const r=get(s.id),y=get(s.id,yearAgo(state.month)),st=storeStatus(s);rows.push([state.month,s.code,s.name,s.region,r?.labels??"",r?.labels!=null?r.labels/T*100:"",r?.divergences??"",r?.noPrice??"",r?.discountCount??"",y?.discountCount??"",r?.discountValue??"",y?.discountValue??"",st.label])});
 const text="\uFEFF"+rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(";")).join("\r\n"),blob=new Blob([text],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download=`auditoria-precos-${state.month}-${state.scope}.csv`;a.click();URL.revokeObjectURL(url);toast("CSV exportado com sucesso.");
}
function openScenario(kind,id){
 const scope=kind==="store"?"store":"region",s=kind==="store"?storeMap.get(+id):null,title=kind==="store"?`${s?.code||""} · ${s?.name||""}`:id,cur=summary(state.month,scope,id),pm=summary(prevMonth(state.month),scope,id),ya=summary(yearAgo(state.month),scope,id);
 const root=$("modal-root");if(!root)return;
 root.innerHTML=`<div class="modal-overlay"><div class="modal"><div class="modal-head"><div><span>CENÁRIO ANALÍTICO • ${safe(mt(state.month).toUpperCase())}</span><h2>${safe(title)}</h2><p>${kind==="store"?safe(s?.region):"Regional"}</p></div><button class="modal-close" id="modal-close">×</button></div><div class="modal-body"><div class="modal-kpis"><div><span>Atingimento</span><strong>${fmt(cur.att,"percent")}</strong><small>M-1 ${fmt(pm.att,"percent")}</small></div><div><span>Etiquetas</span><strong>${fmt(cur.labels)}</strong><small>AA ${fmt(ya.labels)}</small></div><div><span>Qtd. descontos</span><strong>${fmt(cur.dc)}</strong><small>AA ${fmt(ya.dc)}</small></div><div><span>Valor descontos</span><strong>${fmt(cur.dv,"currency")}</strong><small>AA ${fmt(ya.dv,"currency")}</small></div></div><div class="modal-note">Leitura consolidada da competência selecionada para apoio à análise gerencial.</div></div></div></div>`;
 document.body.classList.add("modal-open");$("modal-close").onclick=closeModal;root.querySelector(".modal-overlay").onclick=e=>{if(e.target.classList.contains("modal-overlay"))closeModal()};
}
function closeModal(){const root=$("modal-root");if(root)root.innerHTML="";document.body.classList.remove("modal-open")}
function toast(msg){const t=$("toast");if(!t)return;t.textContent=msg;t.classList.add("show");clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove("show"),2200)}
function render(){
 const fn={dashboard:renderDashboard,comparison:renderComparison,stores:renderStores,regions:renderRegions,evolution:renderEvolution,recommendations:renderRecommendations,database:renderDatabase}[state.view]||renderDashboard;
 fn();bindDynamic();
}
function activate(v,push=true){
 if(!titles[v])v="dashboard";state.view=v;
 document.querySelectorAll(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.view===v));
 document.querySelectorAll(".view").forEach(x=>x.classList.toggle("active",x.id==="view-"+v));
 $("page-title").textContent=titles[v][0];$("page-subtitle").textContent=titles[v][1];
 if(push&&location.hash.slice(1)!==v)history.replaceState(null,"","#"+v);
 render();window.scrollTo({top:0,behavior:"auto"});
}
function detail(){
 const e=$("scope-detail");
 if(state.scope==="network"){e.innerHTML='<option value="">Rede completa</option>';e.disabled=true;state.id=""}
 else if(state.scope==="region"){e.disabled=false;e.innerHTML=D.regions.map(r=>`<option value="${safe(r)}">${safe(r)}</option>`).join("");if(!D.regions.includes(state.id))state.id=D.regions[0];e.value=state.id}
 else{e.disabled=false;e.innerHTML=D.stores.map(s=>`<option value="${s.id}">${s.code} · ${safe(s.name)}</option>`).join("");if(!storeMap.has(+state.id))state.id=String(D.stores[0].id);e.value=state.id}
}
function sync(){
 const i=D.months.indexOf(state.month);$("prev-month").disabled=i<=0;$("next-month").disabled=i>=D.months.length-1;$("month-select").value=state.month;$("scope-type").value=state.scope;detail();
}
function bindDynamic(){
 document.querySelectorAll(".open-store").forEach(b=>b.onclick=()=>{state.scope="store";state.id=b.dataset.id;sync();activate("dashboard")});
 document.querySelectorAll(".open-region").forEach(b=>b.onclick=()=>{state.scope="region";state.id=b.dataset.id;sync();activate("dashboard")});
 document.querySelectorAll(".open-scenario").forEach(b=>b.onclick=()=>openScenario(b.dataset.kind,b.dataset.id));
 document.querySelectorAll(".rec-store").forEach(b=>b.onclick=()=>{state.scope="store";state.id=b.dataset.id;sync();activate("recommendations")});
 document.querySelectorAll(".rec-region").forEach(b=>b.onclick=()=>{state.scope="region";state.id=b.dataset.id;sync();activate("recommendations")});
 document.querySelectorAll("[data-metric]").forEach(b=>b.onclick=()=>{state.metric=b.dataset.metric;render()});
 const sq=$("store-q");if(sq)sq.oninput=e=>{state.q=e.target.value;render()};
 const sr=$("store-region");if(sr)sr.onchange=e=>{state.storeRegion=e.target.value;render()};
 const ss=$("store-status");if(ss)ss.onchange=e=>{state.storeStatus=e.target.value;render()};
 const sc=$("store-clear");if(sc)sc.onclick=()=>{state.q="";state.storeRegion="ALL";state.storeStatus="ALL";render()};
 const dq=$("db-q");if(dq)dq.oninput=e=>{state.q=e.target.value;render()};
 const dr=$("db-region");if(dr)dr.onchange=e=>{state.dbRegion=e.target.value;render()};
 const ds=$("db-status");if(ds)ds.onchange=e=>{state.dbStatus=e.target.value;render()};
 const dc=$("db-clear");if(dc)dc.onclick=()=>{state.q="";state.dbRegion="ALL";state.dbStatus="ALL";render()};
 const csv=$("db-csv");if(csv)csv.onclick=exportCSV;
}
function move(n){const i=D.months.indexOf(state.month)+n;if(i<0||i>=D.months.length)return;state.month=D.months[i];render();sync()}
function printReport(){
 closeModal();
 const b=$("print-banner");b.innerHTML=`<strong>Auditoria de Preços — ${safe(titles[state.view][0])}</strong><span>${safe(mt(state.month))} • ${safe(currentName())}</span>`;
 setTimeout(()=>window.print(),60);
}
function init(){
 const ms=$("month-select");ms.innerHTML=D.months.slice().reverse().map(m=>`<option value="${m}">${mt(m)}</option>`).join("");ms.value=state.month;ms.onchange=e=>{state.month=e.target.value;render();sync()};
 $("prev-month").onclick=()=>move(-1);$("next-month").onclick=()=>move(1);
 $("scope-type").onchange=e=>{state.scope=e.target.value;state.id="";state.q="";state.dbRegion="ALL";state.dbStatus="ALL";detail();render()};
 $("scope-detail").onchange=e=>{state.id=e.target.value;state.q="";state.dbRegion="ALL";state.dbStatus="ALL";render()};
 $("print-report").onclick=printReport;
 document.querySelectorAll(".nav-item").forEach(b=>b.onclick=()=>activate(b.dataset.view));
 window.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal()});
 const hash=location.hash.slice(1);if(titles[hash])state.view=hash;
 sync();activate(state.view,false);
}
init();
})();