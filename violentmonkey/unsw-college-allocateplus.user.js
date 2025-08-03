// ==UserScript==
// @name         UNSW College Timetable Helper
// @namespace    http://tampermonkey.net/
// @version      2.7
// @description  Activity finder + visual 7-day timetable with clash layout and image export. Polished UI spacing, alignment, and styles.
// @author       Gemini/Claude/Me
// @match        https://timetables.unswcollege.edu.au/aplus/student*
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @updateURL    https://cdn.jsdelivr.net/gh/first-storm/browser_scripts@master/violentmonkey/unsw-college-allocateplus.user.js
// @downloadURL  https://cdn.jsdelivr.net/gh/first-storm/browser_scripts@master/violentmonkey/unsw-college-allocateplus.user.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js
// ==/UserScript==

(function () {
  'use strict';

  GM_addStyle(`
    :root{
      --ch-primary:#003c71; --ch-primary-600:#235c9f; --ch-panel:#fff; --ch-muted:#6b7280;
      --ch-bg:#f7f8fa; --ch-border:#e5e7eb; --ch-shadow:0 10px 24px rgba(0,0,0,.12);
      --ch-success:#16a34a; --ch-warn:#f59e0b; --ch-danger:#dc2626; --ch-info:#2563eb;
      --ev-radius:8px; --hour-h:64px; /* calendar hour height (increased from 48px) */
    }
    /* Toggle */
    #ch-toggle-button{position:fixed;bottom:24px;right:24px;width:52px;height:52px;border-radius:50%;
      border:none;background:var(--ch-primary);color:#fff;display:flex;align-items:center;justify-content:center;
      box-shadow:0 8px 16px rgba(0,0,0,.22);cursor:pointer;z-index:9998;transition:transform .15s}
    #ch-toggle-button:hover{transform:scale(1.06)}

    /* Panel */
    #course-helper-panel{display:none;position:fixed;inset:auto 24px 24px auto;width:980px;max-width:96vw;height:720px;max-height:92vh;
      background:var(--ch-panel);border:1px solid var(--ch-border);border-radius:14px;box-shadow:var(--ch-shadow);
      font-family:Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji";
      color:#111827;z-index:9999;display:flex;flex-direction:column;overflow:hidden;resize:both}
    #course-helper-header{height:58px;display:flex;align-items:center;justify-content:space-between;padding:0 16px 0 18px;
      background:#fff;border-bottom:1px solid var(--ch-border);cursor:move}
    #course-helper-header span{font-weight:600}
    #course-helper-close{border:none;background:transparent;color:#9ca3af;font-size:22px;cursor:pointer;padding:6px;border-radius:8px}
    #course-helper-close:hover{background:#f3f4f6;color:#6b7280}

    /* Tabs */
    .ch-tabs{display:flex;gap:18px;padding:10px 16px 0;border-bottom:1px solid var(--ch-border);background:#fff}
    .ch-tab-button{appearance:none;border:none;background:transparent;padding:10px 4px 12px;margin:0 2px 0;
      font-weight:600;color:#6b7280;border-bottom:2px solid transparent;cursor:pointer}
    .ch-tab-button.active{color:var(--ch-primary);border-bottom-color:var(--ch-primary)}
    .ch-view{display:flex;flex-direction:column;flex:1;min-height:0}
    .ch-view:not(.active){display:none}

    /* Controls */
    .ch-controls{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 16px;background:#fff}
    .ch-left-controls{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
    .ch-right-controls{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
    .btn{border:1px solid var(--ch-border);background:#fff;padding:8px 12px;border-radius:9px;cursor:pointer;font-weight:600;color:var(--ch-primary)}
    .btn:hover{background:#f3f8ff;border-color:#c7d7f5}
    .btn-primary{background:var(--ch-primary);color:#fff;border-color:var(--ch-primary)}
    .btn-primary:hover{background:var(--ch-primary-600)}
    .btn-ghost{color:#374151;border-color:var(--ch-border)}
    .small-muted{color:var(--ch-muted);font-size:13px}

    /* Content container */
    .ch-content{flex:1;overflow:auto;background:var(--ch-bg);padding:14px}

    /* Finder table */
    .table-container{border:1px solid var(--ch-border);border-radius:12px;overflow:hidden;background:#fff}
    table{width:100%;border-collapse:collapse;font-size:13px}
    th,td{border-bottom:1px solid #edf0f3;padding:12px 14px;text-align:left}
    th{background:#f9fafb;font-weight:700}

    .status-tag{padding:3px 8px;border-radius:999px;color:#fff;font-weight:700;font-size:11px}
    .status-full{background:var(--ch-danger)} .status-clash{background:var(--ch-warn);color:#111}
    .status-allocated{background:var(--ch-success)} .status-select{background:var(--ch-info)}

    #copy-feedback{position:absolute;bottom:10px;left:16px;color:var(--ch-success);font-weight:700;opacity:0;transition:opacity .25s}

    /* Calendar wrapper */
    .ch-week-wrapper{background:#fff;border:1px solid var(--ch-border);border-radius:12px;overflow:hidden}
    .ch-week-header{display:grid;grid-template-columns:80px repeat(7,1fr);background:#f9fafb;border-bottom:1px solid var(--ch-border);position:sticky;top:0;z-index:5}
    .ch-week-header div{padding:10px 8px;text-align:center;font-weight:700;color:#374151}

    .ch-week-body{display:grid;grid-template-columns:80px repeat(7,1fr)}
    .ch-time-col{background:#fff;border-right:1px solid var(--ch-border);position:sticky;left:0;z-index:4}
    .ch-time-slot{height:var(--hour-h);border-bottom:1px solid #f1f3f5;font-size:12px;color:#6b7280;display:flex;align-items:flex-start;justify-content:flex-end;padding:6px 8px}
    .ch-day-col{position:relative;border-right:1px solid #f3f4f6;background:#fff}
    .ch-hour-line{position:absolute;left:0;right:0;height:1px;background:#f1f3f5}

    /* Event chips */
    .ch-event{position:absolute;border-radius:var(--ev-radius);color:#fff;font-size:12px;overflow:hidden;border:1px solid rgba(0,0,0,.18);
      box-shadow:0 1px 2px rgba(0,0,0,.06)}
    .ch-ev-inner{padding:6px 8px;display:flex;flex-direction:column;gap:2px}
    .ch-ev-title{font-weight:800;letter-spacing:.2px;font-size:11px;opacity:.95}
    .ch-ev-sub{font-size:11px;opacity:.98;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .ch-event.clashable{border-style:dashed}
    .ch-event.hard-clash::before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--ch-danger);border-top-left-radius:var(--ev-radius);border-bottom-left-radius:var(--ev-radius)}
  `);

  // ---------- UI ----------
  function injectUI(){
    document.body.insertAdjacentHTML('beforeend', `
      <button id="ch-toggle-button" title="Timetable Helper">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="26" height="26"><path d="M0 0h24v24H0z" fill="none"/><path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6C3.17 4.5 2.5 5.17 2.5 6S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.67-1.5 1.5S3.17 19.5 4 19.5 5.5 18.83 5.5 18 4.83 16.5 4 16.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/></svg>
      </button>
    `);
    document.body.insertAdjacentHTML('beforeend', `
      <div id="course-helper-panel">
        <div id="course-helper-header">
          <span>Timetable Helper</span>
          <button id="course-helper-close" aria-label="Close">&times;</button>
        </div>
        <div class="ch-tabs">
          <button id="tab-activity" class="ch-tab-button active">Activity Finder</button>
          <button id="tab-week" class="ch-tab-button">My Timetable</button>
        </div>

        <!-- Finder -->
        <div id="view-activity" class="ch-view active">
          <div class="ch-controls">
            <div class="ch-left-controls">
              <span class="small-muted">Filters:</span>
              <label><input type="checkbox" id="filter-full"> Hide Full</label>
              <label><input type="checkbox" id="filter-clash"> Hide Clash</label>
              <label><input type="checkbox" id="filter-allocated"> Hide Allocated</label>
            </div>
            <div class="ch-right-controls">
              <span class="small-muted">Export:</span>
              <button class="btn btn-ghost copy-json">Copy JSON</button>
              <button class="btn btn-ghost copy-csv">Copy CSV</button>
            </div>
          </div>
          <div class="ch-content" id="activity-content">
            <div class="table-container"><div style="padding:14px" class="small-muted">Select a course activity from the main page to see details here.</div></div>
          </div>
        </div>

        <!-- Timetable -->
        <div id="view-week" class="ch-view">
          <div class="ch-controls">
            <div class="ch-left-controls">
              <button id="fetch-tt" class="btn btn-primary">Fetch My Timetable</button>
            </div>
            <div class="ch-right-controls">
              <span class="small-muted">Export:</span>
              <button id="save-img" class="btn">Save as Image</button>
              <button class="btn btn-ghost copy-json">Copy JSON</button>
              <button class="btn btn-ghost copy-csv">Copy CSV</button>
            </div>
          </div>
          <div class="ch-content" id="week-content">
            <div class="table-container"><div style="padding:14px" class="small-muted">Click “Fetch My Timetable” (ensure the site is in List view).</div></div>
          </div>
        </div>
        <span id="copy-feedback"></span>
      </div>
    `);
  }

  // ---------- State ----------
  let activityData = {};
  let myTimetable = [];
  const colorMap = {}; let colorIdx = 0;
  const dayOrder = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const dayToIndex = d=>dayOrder.indexOf(d);
  const colors = [
    {bg:'#4f46e5',border:'#3730a3'},{bg:'#0ea5e9',border:'#0369a1'},{bg:'#059669',border:'#065f46'},
    {bg:'#9333ea',border:'#6b21a8'},{bg:'#f59e0b',border:'#b45309'},{bg:'#dc2626',border:'#991b1b'},
    {bg:'#14b8a6',border:'#0f766e'},{bg:'#1f2937',border:'#111827'}
  ];
  const getColor = code => colorMap[code] || (colorMap[code] = colors[colorIdx++ % colors.length]);

  // ---------- Helpers ----------
  const timeToMinutes = t => { const [h,m]=t.split(':').map(Number); return h*60+(m||0); };
  const parseDurationMins = text => {
    const n = parseFloat(text);
    if (/hr/.test(text)) return Math.round(n*60);
    if (/min/.test(text)) return Math.round(n);
    return isFinite(n)?Math.round(n):60;
  };

  // ---------- Activity Finder ----------
  function parseActivity(){
    const target = document.querySelector('#group-tpl-AA');
    const content = document.getElementById('activity-content');
    if (!target || target.style.display==='none'){
      content.innerHTML = '<div class="table-container"><div style="padding:14px" class="small-muted">Waiting for course data…</div></div>';
      activityData = {}; return;
    }

    const desc = target.querySelector('.desc-text');
    const rows = Array.from(target.querySelectorAll('.aplus-table tbody tr'));
    const grouped=[]; let cur=null;
    rows.forEach(r=>{
      const t = Array.from(r.querySelectorAll('td')).map(td=>td.innerText.trim());
      const sub = {act:t[2],day:t[3],time:t[4],free:t[6],loc:t[8],staff:t[9],dur:t[10],wks:t[11]};
      if (r.id){
        if (cur) grouped.push(cur);
        cur = {status:r.querySelector('.button-cell button')?.textContent.trim()||'N/A',grp:sub.act,sub:[sub]};
      } else if (cur && t.length>2) cur.sub.push(sub);
    });
    if (cur) grouped.push(cur);

    const br = desc.querySelectorAll('br');
    activityData = {
      code:desc.querySelector('h3')?.textContent.trim()||'',
      name:br[0]?.nextSibling?.textContent.trim()||'',
      type:br[1]?.nextSibling?.textContent.trim()||'',
      activities:grouped
    };
    renderActivity();
  }
  function renderActivity(){
    const c = document.getElementById('activity-content');
    if (!activityData.activities?.length){
      c.innerHTML = '<div class="table-container"><div style="padding:14px" class="small-muted">No activities found.</div></div>'; return;
    }
    const filters = {
      Full: document.getElementById('filter-full').checked,
      Clash: document.getElementById('filter-clash').checked,
      Allocated: document.getElementById('filter-allocated').checked
    };
    const filtered = activityData.activities.filter(g=>!filters[g.status]);
    if (!filtered.length){
      c.innerHTML = '<div class="table-container"><div style="padding:14px" class="small-muted">All activities hidden by current filters.</div></div>'; return;
    }
    let html = '<div class="table-container"><table><thead><tr><th>Status</th><th>Activity</th><th>Details (Day · Time · Location)</th><th>Spots</th><th>Staff</th><th>Weeks</th></tr></thead><tbody>';
    filtered.forEach(g=>{
      const spots = g.sub.map(s=>parseInt(s.free)||0).reduce((a,b)=>a+b,0);
      const details = g.sub.map(s=>`<div><strong>${s.day}</strong> · ${s.time} · ${s.loc} <span class="small-muted">(${s.dur})</span></div>`).join('');
      const staff = [...new Set(g.sub.map(s=>s.staff).filter(Boolean))].join(', ') || '-';
      html += `<tr>
        <td><span class="status-tag status-${g.status.toLowerCase()}">${g.status}</span></td>
        <td>${g.grp}</td>
        <td>${details}</td>
        <td>${spots}</td>
        <td>${staff}</td>
        <td>${g.sub[0]?.wks||'N/A'}</td>
      </tr>`;
    });
    c.innerHTML = html + '</tbody></table></div>';
  }

  // ---------- Timetable parsing ----------
  function fetchTimetable(){
    const tbody = document.querySelector('#tt-flat tbody');
    const content = document.getElementById('week-content');
    if (!tbody || !tbody.rows.length){
      content.innerHTML = '<div class="table-container"><div style="padding:14px" class="small-muted">Could not find timetable list. Open Timetable → List view, then click Fetch.</div></div>';
      myTimetable = []; return;
    }
    myTimetable = Array.from(tbody.rows).map(tr=>{
      const c = Array.from(tr.cells).map(td=>td.textContent.trim());
      const obj = {
        code:c[0], desc:c[1], group:c[2], activity:c[3], day:c[4], time:c[5],
        campus:c[7], loc:c[8], staff:c[9], durText:c[10], weeks:c[11]
      };
      obj.startMin = timeToMinutes(obj.time);
      obj.duration = parseDurationMins(obj.durText);
      obj.endMin = obj.startMin + obj.duration;
      obj.clashable = /clashable/i.test(obj.desc) || /clashable/i.test(obj.activity);
      return obj;
    });
    renderWeek();
  }

  // Overlap layout
  function layoutColumns(events){
    events.sort((a,b)=>a.startMin-b.startMin || b.endMin-a.endMin);
    const clusters=[]; let cur=[]; let curEnd=-1;
    events.forEach(e=>{
      if (!cur.length || e.startMin < curEnd){cur.push(e); curEnd=Math.max(curEnd,e.endMin);}
      else {clusters.push(cur); cur=[e]; curEnd=e.endMin;}
    });
    if (cur.length) clusters.push(cur);
    clusters.forEach(cluster=>{
      const cols=[];
      cluster.forEach(e=>{
        let col=-1;
        for(let i=0;i<cols.length;i++){ if(e.startMin>=cols[i]){col=i;break;} }
        if (col===-1){col=cols.length; cols.push(e.endMin);} else cols[col]=e.endMin;
        e._col=col; e._colCount=cols.length;
      });
      const maxCols = Math.max(...cluster.map(x=>x._colCount));
      cluster.forEach(x=>x._colCount=maxCols);
    });
  }

  function renderWeek(){
    const content = document.getElementById('week-content');
    content.innerHTML = '';

    if (!myTimetable.length){
      content.innerHTML = '<div class="table-container"><div style="padding:14px" class="small-muted">No timetable data yet.</div></div>'; return;
    }

    const minStart = Math.min(...myTimetable.map(e=>e.startMin), 8*60);
    const maxEnd = Math.max(...myTimetable.map(e=>e.endMin), 19*60);
    const dayStart = Math.min(8*60, Math.floor(minStart/60)*60);
    const dayEnd = Math.max(19*60, Math.ceil(maxEnd/60)*60);
    const minutesRange = dayEnd - dayStart;
    const scale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hour-h'))/60;

    const wrapper = document.createElement('div'); wrapper.className='ch-week-wrapper';
    const header = document.createElement('div'); header.className='ch-week-header';
    header.innerHTML = `<div></div>${dayOrder.map(d=>`<div>${d}</div>`).join('')}`;
    wrapper.appendChild(header);

    const body = document.createElement('div'); body.className='ch-week-body';

    // Time column
    const timeCol = document.createElement('div'); timeCol.className='ch-time-col';
    const hours = (dayEnd-dayStart)/60;
    for (let h=0; h<hours; h++){
      const slot = document.createElement('div'); slot.className='ch-time-slot'; slot.style.height=`var(--hour-h)`;
      const hh = (dayStart/60)+h;
      const display = (hh%12===0?12:hh%12)+ (hh<12?':00 AM':':00 PM');
      slot.textContent = display;
      timeCol.appendChild(slot);
    }
    body.appendChild(timeCol);

    // Events per day
    const byDay = Array.from({length:7},()=>[]);
    myTimetable.forEach(e=>{ const i=dayToIndex(e.day); if (i>=0) byDay[i].push(e); });
    byDay.forEach(list=>layoutColumns(list));

    // Day columns
    dayOrder.forEach((d, i)=>{
      const col = document.createElement('div');
      col.className='ch-day-col';
      col.style.height = `${minutesRange*scale}px`;
      col.style.position='relative';

      // hour grid lines
      for (let m=0; m<=minutesRange; m+=60){
        const line = document.createElement('div'); line.className='ch-hour-line'; line.style.top = `${m*scale}px`; col.appendChild(line);
      }

      // events
      byDay[i].forEach(ev=>{
        const color = getColor(ev.code);
        const top = (ev.startMin - dayStart)*scale;
        const height = Math.max(32, (ev.endMin-ev.startMin)*scale - 3); // increased min height from 20 to 32
        const w = 100/ev._colCount;
        const l = ev._col*w;
        const div = document.createElement('div');
        div.className = 'ch-event' + (ev.clashable?' clashable':'');
        // hard clash: overlapping non-clashables
        const hard = byDay[i].some(o => o!==ev && !(o.endMin<=ev.startMin || o.startMin>=ev.endMin) && !o.clashable && !ev.clashable);
        if (hard) div.classList.add('hard-clash');

        div.style.top = `${top}px`; div.style.height=`${height}px`;
        div.style.left = `calc(${l}% + 2px)`; div.style.width=`calc(${w}% - 4px)`;
        div.style.background=color.bg; div.style.borderColor=color.border;
        div.title = `${ev.code} ${ev.group}/${ev.activity}\n${ev.day} ${ev.time} (${ev.durText})\n${ev.loc} ${ev.campus}\n${ev.staff}`;
        div.innerHTML = `<div class="ch-ev-inner">
          <div class="ch-ev-title">${ev.code}</div>
          <div class="ch-ev-sub">${ev.activity} · ${ev.group}</div>
          <div class="ch-ev-sub">${ev.loc}</div>
        </div>`;
        col.appendChild(div);
      });

      body.appendChild(col);
    });

    wrapper.appendChild(body);
    content.appendChild(wrapper);
  }

  // ---------- Export / feedback ----------
  function showFeedback(msg){ const el=document.getElementById('copy-feedback'); el.textContent=msg; el.style.opacity='1'; setTimeout(()=>el.style.opacity='0',1600); }
  function copyJSON(){
    const isWeek = document.getElementById('view-week').classList.contains('active');
    const data = isWeek ? myTimetable : activityData;
    if (!data || (Array.isArray(data)&&!data.length)) return showFeedback('Nothing to copy');
    GM_setClipboard(JSON.stringify(data,null,2)); showFeedback('JSON Copied!');
  }
  function copyCSV(){
    const isWeek = document.getElementById('view-week').classList.contains('active');
    let csv='';
    if (isWeek){
      if (!myTimetable.length) return showFeedback('Nothing to copy');
      csv='Code,Description,Group,Activity,Day,Time,Location,Staff,Duration,Weeks\n';
      myTimetable.forEach(e=>{
        csv += [e.code,e.desc,e.group,e.activity,e.day,e.time,e.loc,e.staff,e.durText,e.weeks].map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',') + '\n';
      });
    } else {
      if (!activityData.activities?.length) return showFeedback('Nothing to copy');
      csv='Course,Status,Group,Sub-Activity,Day,Time,Location,Staff,Duration,Weeks,Free Spots\n';
      activityData.activities.forEach(g=>g.sub.forEach(s=>{
        csv += [activityData.code,g.status,g.grp,s.act,s.day,s.time,s.loc,s.staff,s.dur,s.wks,s.free].map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')+'\n';
      }));
    }
    GM_setClipboard(csv); showFeedback('CSV Copied!');
  }
  function saveImage(){
    const wrapper = document.querySelector('#week-content .ch-week-wrapper');
    if (!wrapper) return showFeedback('Fetch timetable first');
    showFeedback('Generating image…');
    html2canvas(wrapper,{backgroundColor:'#ffffff',scale:2}).then(canvas=>{
      const a=document.createElement('a'); a.download='unsw-timetable.png'; a.href=canvas.toDataURL('image/png'); a.click();
      showFeedback('Image saved!');
    });
  }

  // ---------- Events / observers ----------
  function addEvents(){
    const panel=document.getElementById('course-helper-panel');
    const header=document.getElementById('course-helper-header');

    document.getElementById('ch-toggle-button').addEventListener('click',()=> panel.style.display = panel.style.display==='none'?'flex':'none');
    document.getElementById('course-helper-close').addEventListener('click',()=> panel.style.display='none');

    document.getElementById('tab-activity').addEventListener('click',()=>switchTab(true));
    document.getElementById('tab-week').addEventListener('click',()=>switchTab(false));

    document.getElementById('fetch-tt').addEventListener('click', fetchTimetable);
    document.getElementById('save-img').addEventListener('click', saveImage);
    document.querySelectorAll('.copy-json').forEach(b=>b.addEventListener('click', copyJSON));
    document.querySelectorAll('.copy-csv').forEach(b=>b.addEventListener('click', copyCSV));
    ['filter-full','filter-clash','filter-allocated'].forEach(id=>document.getElementById(id).addEventListener('change', renderActivity));

    // Drag
    let dragging=false, ox=0, oy=0;
    header.addEventListener('mousedown',e=>{
      if (e.target.closest('button')) return;
      dragging=true; ox=e.clientX - panel.offsetLeft; oy=e.clientY - panel.offsetTop; panel.style.userSelect='none';
    });
    document.addEventListener('mousemove',e=>{ if(!dragging) return; panel.style.left=(e.clientX-ox)+'px'; panel.style.top=(e.clientY-oy)+'px'; });
    document.addEventListener('mouseup',()=>{ dragging=false; panel.style.userSelect='auto'; });
  }
  function switchTab(activity){
    document.getElementById('tab-activity').classList.toggle('active', activity);
    document.getElementById('tab-week').classList.toggle('active', !activity);
    document.getElementById('view-activity').classList.toggle('active', activity);
    document.getElementById('view-week').classList.toggle('active', !activity);
  }
  function setupObservers(){
    const groupTpl = document.getElementById('group-tpl');
    const ttTpl = document.getElementById('timetable-tpl');
    if (groupTpl){
      let t; new MutationObserver(()=>{clearTimeout(t); t=setTimeout(parseActivity,250);})
        .observe(groupTpl,{childList:true,subtree:true});
    }
    if (ttTpl){
      let t; new MutationObserver(()=>{clearTimeout(t); t=setTimeout(()=>{ if (document.getElementById('view-week').classList.contains('active')) fetchTimetable(); },400);})
        .observe(ttTpl,{childList:true,subtree:true});
    }
  }

  // ---------- Boot ----------
  (function main(){
    injectUI();
    addEvents();
    setupObservers();
    parseActivity();
  })();
})();