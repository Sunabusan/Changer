const PROMOS_TARGET = document.getElementById('promos-inner');
const NBU_BASE = 'https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange';
const PROMO_CURRENCIES = ['USD','EUR','GBP','UAH'];
const HISTORY_DAYS = 14;

function formatDateYMD(d){
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}${m}${day}`;
}

async function fetchRateOnDate(code, ymd){
  const url = `${NBU_BASE}?valcode=${code}&date=${ymd}&json`;
  const res = await fetch(url);
  if(!res.ok) throw new Error('Network error');
  const data = await res.json();
  if(!data || data.length===0) return null;
  return data[0].rate;
}

async function fetchHistory(code, days){
  const today = new Date();
  const promises = [];
  for(let i=days-1;i>=0;i--){
    const dt = new Date(today);
    dt.setDate(today.getDate()-i);
    const ymd = formatDateYMD(dt);
    promises.push(fetchRateOnDate(code, ymd).catch(()=>null));
  }
  const values = await Promise.all(promises);
  const cleaned = [];
  let last = null;
  for(const v of values){
    if(v===null){
      cleaned.push(last !== null ? last : 0);
    } else {
      cleaned.push(v);
      last = v;
    }
  }
  if(code === 'UAH') return Array(days).fill(1);
  const allZero = cleaned.every(v => v === 0);
  if(allZero){
    try{
      const res = await fetch(`${NBU_BASE}?json`);
      if(res.ok){
        const data = await res.json();
        const entry = (data && data.find && data.find(x=>x.cc===code));
        if(entry && entry.rate){
          return Array(days).fill(entry.rate);
        }
      }
    }catch(e){ }
  }
  return cleaned;
}

function drawSparkline(canvas, values, color='#4ade80'){
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth || canvas.width;
  const cssH = canvas.clientHeight || canvas.height;
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0,0,cssW,cssH);
  if(!values || values.length===0) return;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = (max - min) || 1;
  ctx.lineWidth = 2;
  ctx.strokeStyle = color;
  ctx.beginPath();
  values.forEach((v,i)=>{
    const x = (i/(values.length-1))*(cssW-2) +1;
    const y = cssH - ((v-min)/range)*(cssH-2) -1;
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  });
  ctx.stroke();
}

const _charts = new Map();

function formatDateShort(d){
  return d.toLocaleDateString('uk-UA', { month: 'short', day: 'numeric' });
}

async function renderPromos(){
  // destroy previous charts
  _charts.forEach(c=>{ try{ c.destroy(); }catch(e){} });
  _charts.clear();
  PROMOS_TARGET.innerHTML = '';
  for(const code of PROMO_CURRENCIES){
    const card = document.createElement('div');
    card.className = 'promo-card';
    const title = document.createElement('div'); title.className='promo-title'; title.textContent = code;
    const changeEl = document.createElement('div'); changeEl.className='promo-change'; changeEl.textContent = '';
    const canvas = document.createElement('canvas');
    canvas.className = 'promo-canvas';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    card.appendChild(title);
    card.appendChild(changeEl);
    card.appendChild(canvas);
    PROMOS_TARGET.appendChild(card);

    try{
      const todayYmd = formatDateYMD(new Date());
      await fetchRateOnDate(code, todayYmd);
      const values = await fetchHistory(code, HISTORY_DAYS);
      const first = values[0] || 0;
      const last = values[values.length-1] || 0;
      const pct = first ? ((last-first)/first)*100 : 0;
      changeEl.textContent = `${pct>=0?'+':''}${pct.toFixed(2)}% за ${HISTORY_DAYS}дн`;

      const color = pct>=0? '#34d399':'#fb7185';

      // try Chart.js first, fallback to canvas sparkline if Chart not available
            if(window.Chart){
              // ensure crisp rendering on HiDPI
              Chart.defaults.devicePixelRatio = window.devicePixelRatio || 1;
              // prepare labels (short dates)
              const labels = [];
              for(let i=HISTORY_DAYS-1;i>=0;i--){
                const dt = new Date(); dt.setDate(dt.getDate()-i);
                labels.push(formatDateShort(dt));
              }
              const chartContainer = document.createElement('div');
              chartContainer.className = 'promo-chart';
              card.appendChild(chartContainer);
              chartContainer.appendChild(canvas);
              const ctx = canvas.getContext('2d');
              const chart = new Chart(ctx, {
                type: 'line',
                data: { labels, datasets: [{ data: values, borderColor: color, borderWidth: 2, fill: false, pointRadius: 0, tension: 0.25 }] },
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  animation: { duration: 0 },
                  plugins:{ legend:{ display:false } },
                  scales:{ x:{ display:false }, y:{ display:false } },
                  elements:{ point:{ radius:0 } },
                  layout: { padding: 4 }
                }
              });
              chart.resize();
              _charts.set(code, chart);
      } else {
              const chartContainer = document.createElement('div');
              chartContainer.className = 'promo-chart';
              card.appendChild(chartContainer);
              chartContainer.appendChild(canvas);
              drawSparkline(canvas, values, color);
      }

    } catch(err){
      changeEl.textContent = 'Помилка завантаження';
      console.error('Promo fetch error', err);
    }
  }
}

// initialize
if(PROMOS_TARGET){
  renderPromos().catch(err=>{
    PROMOS_TARGET.innerHTML = '<p class="promos-placeholder">Не вдалося завантажити акції.</p>';
    console.error(err);
  });
}
