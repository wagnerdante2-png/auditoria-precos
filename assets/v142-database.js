(()=>{
  'use strict';

  const D=window.AUDITORIA_DATA;
  if(!D||!Array.isArray(D.months)||!Array.isArray(D.stores)||!Array.isArray(D.records)) return;

  const T=Number(D.metadata?.targetLabelsPerStore)||6000;
  const rec=new Map(D.records.map(r=>[`${r.storeId}|${r.month}`,r]));
  const nf=new Intl.NumberFormat('pt-BR');
  const cf=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
  const pf=new Intl.NumberFormat('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1});
  const monthFmt=new Intl.DateTimeFormat('pt-BR',{month:'short',year:'numeric',timeZone:'UTC'});
  const state={from:D.metadata?.latestMonth||D.months.at(-1),to:D.metadata?.latestMonth||D.months.at(-1),active:false,q:'',region:'ALL',status:'ALL'};
  let enhancing=false;

  const $=id=>document.getElementById(id);
  const safe=v=>v==null?'':String(v).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'}[c]));
  const fmt=(v,type='integer')=>v==null||Number.isNaN(v)?'—':type==='currency'?cf.format(v):type==='percent'?pf.format(v)+'%':nf.format(Math.round(v));
  const sum=arr=>arr.reduce((a,v)=>a+(Number.isFinite(v)?v:0),0);
  const pct=(a,b)=>a==null||b==null||b===0?null:(a-b)/Math.abs(b)*100;
  const mt=m=>{if(!m)return'—';const s=monthFmt.format(new Date(`${m}-01T00:00:00Z`));return s.charAt(0).toUpperCase()+s.slice(1).replace('.','');};
  const monthIndex=m=>D.months.indexOf(m);
  const monthRange=(from,to)=>{let a=monthIndex(from),b=monthIndex(to);if(a<0||b<0)return[];if(a>b)[a,b]=[b,a];return D.months.slice(a,b+1);};
  const shiftedMonths=(months,delta)=>months.map(m=>{const [y,mo]=m.split('-').map(Number);const d=new Date(Date.UTC(y,mo-1+delta,1));return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`;}).filter(m=>D.months.includes(m));
  const previousEquivalent=months=>{if(!months.length)return[];const start=monthIndex(months[0]),len=months.length;if(start<=0)return[];return D.months.slice(Math.max(0,start-len),start);};
  const get=(id,m)=>rec.get(`${id}|${m}`)||null;

  function scopeStores(){
    const scope=$('scope-type')?.value||'network';
    const detail=$('scope-detail')?.value||'';
    if(scope==='region') return D.stores.filter(s=>s.region===detail);
    if(scope==='store') return D.stores.filter(s=>String(s.id)===String(detail)||s.code===detail||s.label===detail);
    return D.stores.slice();
  }

  function aggStore(store,months){
    const rows=months.map(m=>get(store.id,m));
    const opRows=rows.filter(r=>r&&r.labels!=null);
    const finite=(r,k)=>r&&Number.isFinite(r[k])?r[k]:null;
    const labels=sum(rows.map(r=>finite(r,'labels')));
    const divergences=sum(rows.map(r=>finite(r,'divergences')));
    const noPrice=sum(rows.map(r=>finite(r,'noPrice')));
    const discountCount=sum(rows.map(r=>finite(r,'discountCount')));
    const discountValue=sum(rows.map(r=>finite(r,'discountValue')));
    const opMonths=opRows.length;
    const target=opMonths*T;
    return {store,labels,divergences,noPrice,discountCount,discountValue,opMonths,target,att:target?labels/target*100:null};
  }

  function benchFor(months){
    const rows=D.stores.map(s=>aggStore(s,months)).filter(x=>x.opMonths>0);
    const avgMonthly=(key)=>{
      const vals=rows.map(x=>x.opMonths?x[key]/x.opMonths:null).filter(Number.isFinite);
      return vals.length?sum(vals)/vals.length:null;
    };
    return {discountCount:avgMonthly('discountCount'),discountValue:avgMonthly('discountValue')};
  }

  function periodStatus(agg,bench){
    if(!agg.opMonths) return {cls:'neutral',label:'Sem base',reason:'Sem dados operacionais no período.'};
    const reasons=[];
    if(agg.labels<agg.target) reasons.push(`Etiquetas abaixo da meta acumulada: ${fmt(agg.labels)} de ${fmt(agg.target)}.`);
    const dc=agg.discountCount/agg.opMonths,dv=agg.discountValue/agg.opMonths;
    if(bench.discountCount!=null&&dc>bench.discountCount) reasons.push(`Média mensal de descontos acima da média da rede.`);
    if(bench.discountValue!=null&&dv>bench.discountValue) reasons.push(`Média mensal do valor de descontos acima da média da rede.`);
    if(reasons.length) return {cls:'bad',label:'Crítico',reason:reasons.join(' ')};
    const attention=(bench.discountCount&&dc>=bench.discountCount*.8)||(bench.discountValue&&dv>=bench.discountValue*.8);
    return attention?{cls:'warn',label:'Atenção',reason:'Meta atingida, com descontos entre 80% e 100% da média mensal da rede.'}:{cls:'good',label:'Saudável',reason:'Meta acumulada atingida e descontos abaixo de 80% da média mensal da rede.'};
  }

  function trendHTML(cur,prev,dir='down'){
    const d=pct(cur,prev);
    if(d==null) return '<small class=\"trend neutral\">• sem base</small>';
    const good=dir==='up'?d>=0:d<=0;
    const cls=d===0?'neutral':good?'good':'bad';
    const arrow=d>0?'▲':d<0?'▼':'•';
    return `<small class=\"trend ${cls}\">${arrow} ${fmt(Math.abs(d),'percent')}</small>`;
  }

  function periodOptions(selected){
    return D.months.map(m=>`<option value=\"${m}\" ${m===selected?'selected':''}>${safe(mt(m))}</option>`).join('');
  }

  function ensureControls(){
    const view=$('view-database');
    if(!view||!view.classList.contains('active')) return;
    if(view.querySelector('[data-period-controls]')) return;
    enhancing=true;
    const host=document.createElement('div');
    host.dataset.periodControls='1';
    host.className='period-host';
    host.innerHTML=`<div class=\"period-bar\"><div class=\"period-title\"><strong>Período de análise</strong><span>Use De / Até para consolidar vários meses na Base de Dados.</span></div><label><span>De</span><select id=\"period-from\">${periodOptions(state.from)}</select></label><label><span>Até</span><select id=\"period-to\">${periodOptions(state.to)}</select></label><button type=\"button\" class=\"btn period-apply\" id=\"period-apply\">Aplicar período</button><button type=\"button\" class=\"btn period-reset\" id=\"period-reset\">Mês único</button></div><div id=\"period-results\" class=\"period-results\" hidden></div>`;
    view.insertBefore(host,view.firstChild);
    host.querySelector('#period-apply').addEventListener('click',applyRange);
    host.querySelector('#period-reset').addEventListener('click',resetRange);
    if(state.active){
      host.querySelector('#period-from').value=state.from;
      host.querySelector('#period-to').value=state.to;
      renderRange();
    }
    enhancing=false;
  }

  function hideNative(active){
    const view=$('view-database');
    if(!view)return;
    [...view.children].forEach(el=>{
      if(el.matches('[data-period-controls]')) return;
      if(active){if(el.dataset.periodDisplay===undefined)el.dataset.periodDisplay=el.style.display||'';el.style.display='none';}
      else if(el.dataset.periodDisplay!==undefined){el.style.display=el.dataset.periodDisplay;delete el.dataset.periodDisplay;}
    });
    view.classList.toggle('period-range-active',active);
  }

  function applyRange(){
    const from=$('period-from')?.value||state.from;
    const to=$('period-to')?.value||state.to;
    let a=monthIndex(from),b=monthIndex(to);
    if(a<0||b<0)return;
    if(a>b){state.from=to;state.to=from;}else{state.from=from;state.to=to;}
    const fromSel=$('period-from'),toSel=$('period-to');
    if(fromSel)fromSel.value=state.from;if(toSel)toSel.value=state.to;
    if(state.from===state.to){
      state.active=false;hideNative(false);const box=$('period-results');if(box)box.hidden=true;
      const ms=$('month-select');if(ms&&ms.value!==state.to){ms.value=state.to;ms.dispatchEvent(new Event('change',{bubbles:true}));}
      return;
    }
    state.active=true;
    const ms=$('month-select');if(ms&&ms.value!==state.to){ms.value=state.to;ms.dispatchEvent(new Event('change',{bubbles:true}));}
    renderRange();
  }

  function resetRange(){
    const current=$('month-select')?.value||D.metadata?.latestMonth||D.months.at(-1);
    state.from=current;state.to=current;state.active=false;
    const f=$('period-from'),t=$('period-to');if(f)f.value=current;if(t)t.value=current;
    hideNative(false);const box=$('period-results');if(box)box.hidden=true;
  }

  function summaryForStores(stores,months){
    const rows=stores.map(s=>aggStore(s,months));
    const labels=sum(rows.map(x=>x.labels)),target=sum(rows.map(x=>x.target));
    return {rows,labels,target,att:target?labels/target*100:null,opStores:rows.filter(x=>x.opMonths).length,hit:rows.filter(x=>x.opMonths&&x.labels>=x.target).length};
  }

  function renderRange(){
    if(!state.active)return;
    const view=$('view-database');if(!view||!view.classList.contains('active'))return;
    ensureControls();
    hideNative(true);
    const box=$('period-results');if(!box)return;
    const months=monthRange(state.from,state.to),prevMonths=previousEquivalent(months),aaMonths=shiftedMonths(months,-12);
    const scoped=scopeStores();
    const bench=benchFor(months);
    const all=scoped.map(s=>{
      const cur=aggStore(s,months),prev=aggStore(s,prevMonths),aa=aggStore(s,aaMonths),status=periodStatus(cur,bench);
      return {s,cur,prev,aa,status};
    });
    const q=state.q.trim().toLocaleLowerCase('pt-BR');
    const list=all.filter(x=>state.region==='ALL'||x.s.region===state.region).filter(x=>state.status==='ALL'||x.status.cls===state.status).filter(x=>!q||`${x.s.code} ${x.s.name} ${x.s.region}`.toLocaleLowerCase('pt-BR').includes(q));
    const sumCur=summaryForStores(scoped,months),sumPrev=summaryForStores(scoped,prevMonths),delta=pct(sumCur.att,sumPrev.att);
    const scopeLabel=$('scope-type')?.value==='region'?($('scope-detail')?.selectedOptions?.[0]?.textContent||'Regional'):$('scope-type')?.value==='store'?($('scope-detail')?.selectedOptions?.[0]?.textContent||'Loja'):'Total Rede';
    const periodLabel=`${mt(months[0])} a ${mt(months.at(-1))}`;
    const regionDisabled=$('scope-type')?.value!=='network';

    box.hidden=false;
    box.innerHTML=`
      <div class=\"hero period-hero\"><div class=\"hero-top\"><div><span class=\"eyebrow\">AUDITORIA DE PREÇOS • PERÍODO CONSOLIDADO</span><h2>Base consolidada · ${safe(scopeLabel)}</h2><p>${safe(periodLabel)} · somatório dos indicadores e meta acumulada por competência com base operacional.</p></div><div class=\"hero-badges\"><span class=\"pill live\">● ${sumCur.opStores} lojas com dados operacionais</span><span class=\"pill\">${months.length} competência(s)</span></div></div><div class=\"hero-stats\"><div class=\"hero-stat\"><span>Escopo</span><strong>${safe(scopeLabel)}</strong></div><div class=\"hero-stat\"><span>Atingimento</span><strong>${fmt(sumCur.att,'percent')}</strong></div><div class=\"hero-stat\"><span>Δ período anterior</span><strong>${delta==null?'—':`${delta>=0?'▲':'▼'} ${fmt(Math.abs(delta),'percent')}`}</strong></div><div class=\"hero-stat\"><span>Lojas na meta</span><strong>${sumCur.hit}/${sumCur.opStores}</strong></div></div></div>
      <div class=\"legend-grid\"><article class=\"legend-box\"><strong>Leitura do período</strong><p>Etiquetas, divergências, produtos sem preço e descontos são somados entre De e Até. Atingimento usa a meta de 6.000 etiquetas por loja para cada competência com base operacional.</p></article><article class=\"legend-box\"><strong>Setas = período anterior equivalente</strong><p>▲ / ▼ mostram a variação contra a janela imediatamente anterior de mesmo tamanho. Colunas AA usam o mesmo período deslocado em 12 meses.</p></article></div>
      <div class=\"toolbar period-filter\"><input id=\"period-q\" placeholder=\"Buscar loja...\" value=\"${safe(state.q)}\"><select id=\"period-region\" ${regionDisabled?'disabled':''}><option value=\"ALL\">Todas as regionais</option>${D.regions.map(r=>`<option value=\"${safe(r)}\" ${state.region===r?'selected':''}>${safe(r)}</option>`).join('')}</select><select id=\"period-status\"><option value=\"ALL\">Todos os semáforos</option><option value=\"good\" ${state.status==='good'?'selected':''}>Saudável</option><option value=\"warn\" ${state.status==='warn'?'selected':''}>Atenção</option><option value=\"bad\" ${state.status==='bad'?'selected':''}>Crítico</option><option value=\"neutral\" ${state.status==='neutral'?'selected':''}>Sem base</option></select><button class=\"btn\" id=\"period-clear\" type=\"button\">Limpar</button><button class=\"btn\" id=\"period-csv\" type=\"button\">Exportar CSV</button><span class=\"count\">${list.length} lojas</span></div>
      <div class=\"table-shell period-table-shell\"><table class=\"data-table period-table\"><thead><tr><th>Status</th><th>Loja</th><th>Regional</th><th>Etiquetas</th><th>Atingimento</th><th>Divergências</th><th>Sem preço</th><th>Qtd descontos</th><th>Qtd descontos AA</th><th>Valor descontos</th><th>Valor descontos AA</th></tr></thead><tbody>${list.map(x=>`<tr><td><span class=\"semaphore ${x.status.cls}\" title=\"${safe(x.status.reason)}\"><i></i>${x.status.label}</span></td><td><strong>${safe(x.s.code)} · ${safe(x.s.name)}</strong></td><td>${safe(x.s.region)}</td><td class=\"num\"><div class=\"cell-metric\"><strong>${fmt(x.cur.labels)}</strong>${trendHTML(x.cur.labels,x.prev.labels,'up')}</div></td><td class=\"num\"><strong>${fmt(x.cur.att,'percent')}</strong></td><td class=\"num\"><div class=\"cell-metric\"><strong>${fmt(x.cur.divergences)}</strong>${trendHTML(x.cur.divergences,x.prev.divergences,'down')}</div></td><td class=\"num\"><div class=\"cell-metric\"><strong>${fmt(x.cur.noPrice)}</strong>${trendHTML(x.cur.noPrice,x.prev.noPrice,'down')}</div></td><td class=\"num\"><div class=\"cell-metric\"><strong>${fmt(x.cur.discountCount)}</strong>${trendHTML(x.cur.discountCount,x.prev.discountCount,'down')}</div></td><td class=\"num\"><strong>${aaMonths.length?fmt(x.aa.discountCount):'—'}</strong></td><td class=\"num\"><div class=\"cell-metric\"><strong>${fmt(x.cur.discountValue,'currency')}</strong>${trendHTML(x.cur.discountValue,x.prev.discountValue,'down')}</div></td><td class=\"num\"><strong>${aaMonths.length?fmt(x.aa.discountValue,'currency'):'—'}</strong></td></tr>`).join('')}</tbody></table></div>`;

    box.querySelector('#period-q').addEventListener('input',e=>{state.q=e.target.value;renderRange();});
    box.querySelector('#period-region').addEventListener('change',e=>{state.region=e.target.value;renderRange();});
    box.querySelector('#period-status').addEventListener('change',e=>{state.status=e.target.value;renderRange();});
    box.querySelector('#period-clear').addEventListener('click',()=>{state.q='';state.region='ALL';state.status='ALL';renderRange();});
    box.querySelector('#period-csv').addEventListener('click',()=>exportCSV(list,periodLabel));
  }

  function exportCSV(list,periodLabel){
    const rows=[['Status','Loja','Regional','Etiquetas','Atingimento','Divergências','Sem preço','Qtd descontos','Qtd descontos AA','Valor descontos','Valor descontos AA']];
    const months=monthRange(state.from,state.to),aaMonths=shiftedMonths(months,-12);
    for(const x of list) rows.push([x.status.label,`${x.s.code} - ${x.s.name}`,x.s.region,x.cur.labels,x.cur.att==null?'':x.cur.att,x.cur.divergences,x.cur.noPrice,x.cur.discountCount,aaMonths.length?x.aa.discountCount:'',x.cur.discountValue,aaMonths.length?x.aa.discountValue:'']);
    const esc=v=>`\"${String(v??'').replace(/\"/g,'\"\"')}\"`;
    const csv='\uFEFF'+rows.map(r=>r.map(esc).join(';')).join('\r\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=`auditoria-precos-${periodLabel.replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-|-$/g,'').toLowerCase()}.csv`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),0);
  }

  function syncWithMonth(){
    if(state.active)return;
    const current=$('month-select')?.value;
    if(!current)return;
    state.from=current;state.to=current;
    const f=$('period-from'),t=$('period-to');if(f)f.value=current;if(t)t.value=current;
  }

  function scheduleEnhance(){
    if(enhancing)return;
    requestAnimationFrame(()=>{ensureControls();if(state.active)renderRange();});
  }

  document.addEventListener('click',e=>{
    if(e.target.closest('[data-view=\"database\"]')) setTimeout(scheduleEnhance,0);
  },true);
  $('month-select')?.addEventListener('change',()=>setTimeout(()=>{syncWithMonth();scheduleEnhance();},0));
  $('scope-type')?.addEventListener('change',()=>setTimeout(()=>{if(state.active)renderRange();},0));
  $('scope-detail')?.addEventListener('change',()=>setTimeout(()=>{if(state.active)renderRange();},0));
  window.addEventListener('hashchange',scheduleEnhance);
  window.addEventListener('beforeprint',()=>{
    if(!state.active)return;
    const banner=$('print-banner');if(!banner)return;
    const scope=$('scope-type')?.value==='network'?'Total Rede':($('scope-detail')?.selectedOptions?.[0]?.textContent||'Escopo selecionado');
    banner.innerHTML=`<strong>Auditoria de Preços — Base de Dados</strong><span>Período: ${safe(mt(state.from))} a ${safe(mt(state.to))} • ${safe(scope)}</span>`;
  });

  const view=$('view-database');
  if(view){new MutationObserver(()=>{if(!enhancing&&view.classList.contains('active'))scheduleEnhance();}).observe(view,{childList:true});}
  scheduleEnhance();
})();
