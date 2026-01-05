// Charts initialization using Chart.js with demo data and simple filter hooks
document.addEventListener('DOMContentLoaded', function(){
  if(typeof Chart === 'undefined') return console.warn('Chart.js not loaded');

  // Revenue vs Expenses (line) - compact options
  const ctx1 = document.getElementById('revenueExpensesChart');
  if(ctx1){
    new Chart(ctx1, {
      type: 'line',
      data: {
        labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
        datasets: [
          { label: 'Revenue', data: [1200,1500,1800,1700,2100,1900,2400], borderColor: '#60a5fa', backgroundColor: 'rgba(96,165,250,0.12)', tension:0.25, pointRadius:3 },
          { label: 'Expenses', data: [800,900,850,950,1100,980,1200], borderColor: '#f97316', backgroundColor: 'rgba(249,115,22,0.08)', tension:0.25, pointRadius:3 }
        ]
      },
      options: {
        responsive:true,
        maintainAspectRatio:false,
        plugins:{ legend:{ position:'top', labels:{boxWidth:12, padding:8} } },
        interaction:{ mode:'index', intersect:false },
        elements:{ line:{borderWidth:2} },
        scales:{
          x:{ grid:{ display:false }, ticks:{ maxRotation:0 } },
          y:{ beginAtZero:true, ticks:{ callback: v => '$' + v } }
        },
        layout:{ padding:8 }
      }
    });
  }

  // Profit Distribution (doughnut)
  const ctx2 = document.getElementById('profitDistributionChart');
  if(ctx2){
    new Chart(ctx2, {
      type: 'doughnut',
      data: { labels:['Services','Products','Subscriptions'], datasets:[ { data:[45,30,25], backgroundColor:['#60a5fa','#2dd4bf','#ffd166'], hoverOffset:6 } ] },
      options: { responsive:true, maintainAspectRatio:false, cutout:'55%', plugins:{ legend:{ position:'bottom', labels:{boxWidth:12} } }, layout:{ padding:6 } }
    });
  }

  // Monthly Performance (compact bar)
  const ctx3 = document.getElementById('monthlyPerformanceChart');
  if(ctx3){
    new Chart(ctx3, {
      type: 'bar',
      data: {
        labels:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
        datasets:[ { label:'Revenue', data:[12000,15000,14000,17000,20000,23000,21000,24000,22000,25000,26000,28000], backgroundColor:'#60a5fa', maxBarThickness:28 } ]
      },
      options: {
        responsive:true,
        maintainAspectRatio:false,
        plugins:{ legend:{ display:false } },
        scales:{ x:{ grid:{ display:false }, ticks:{ maxRotation:0 } }, y:{ beginAtZero:true, ticks:{ callback: v => '$' + v } } },
        layout:{ padding:8 }
      }
    });
  }

  // Expense Category (pie) - compact
  const ctx4 = document.getElementById('expenseCategoryChart');
  if(ctx4){
    new Chart(ctx4, { type:'pie', data:{ labels:['Salaries','Marketing','Operations','Office Supplies'], datasets:[{ data:[40,25,20,15], backgroundColor:['#f97316','#f59e0b','#10b981','#60a5fa'], hoverOffset:6 }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{boxWidth:12} } }, layout:{ padding:6 } } });
  }

  // Leakage Sources (compact bar)
  const ctx5 = document.getElementById('leakageSourcesChart');
  if(ctx5){
    new Chart(ctx5, { type:'bar', data:{ labels:['Supplies','Fraud','Billing','Process'], datasets:[{ label:'Leakage ($)', data:[1200,900,700,450], backgroundColor:'#ef4444', maxBarThickness:28 }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ x:{ grid:{ display:false } }, y:{ beginAtZero:true, ticks:{ callback: v => '$' + v } } }, layout:{ padding:8 } } });
  }

  // Simple hooks for chart filters (if present)
  const trendFilter = document.getElementById('trendFilter');
  if(trendFilter) trendFilter.addEventListener('change', ()=> alert('Trend filter changed (demo): '+trendFilter.value));
  const profitFilter = document.getElementById('profitFilter');
  if(profitFilter) profitFilter.addEventListener('change', ()=> alert('Profit filter changed (demo): '+profitFilter.value));
});
