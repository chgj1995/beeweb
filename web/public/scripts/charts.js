async function fetchData() {
    const response = await fetch('/api/data');
    const data = await response.json();
    console.log('Data received:', data);
    return data;
  }
  
  function createChart(ctx, label, data, labels) {
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: label,
          data: data,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: true,
        }]
      },
      options: {
        scales: {
          x: {
            type: 'linear',
            title: {
              display: true,
              text: 'Entry ID'
            },
            ticks: {
              callback: function(value) {
                return Number.isInteger(value) ? value : '';
              }
            }
          }
        }
      }
    });
  }
  
  async function renderCharts() {
    console.log('Rendering charts');
    const data = await fetchData();
    const labels = data.entry_ids;  // entry_ids를 사용하여 라벨 설정
  
    createChart(document.getElementById('chart1').getContext('2d'), 'Field 1', data.field1, labels);
    createChart(document.getElementById('chart2').getContext('2d'), 'Field 2', data.field2, labels);
    createChart(document.getElementById('chart3').getContext('2d'), 'Field 3', data.field3, labels);
    createChart(document.getElementById('chart4').getContext('2d'), 'Field 4', data.field4, labels);
    createChart(document.getElementById('chart5').getContext('2d'), 'Field 5', data.field5, labels);
    createChart(document.getElementById('chart6').getContext('2d'), 'Field 6', data.field6, labels);
  }
  
  renderCharts();
  