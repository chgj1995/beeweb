async function fetchInOutData(area, hive) {
  const url = `/honeybee/api/get?type=inout&area=${area}&hive=${hive}`;
  const response = await fetch(url);
  const data = await response.json();
  console.log(`Data received for area ${area}, hive ${hive}:`, data);
  return data;
}

async function fetchSensorData(area, hive) {
  const url = `/honeybee/api/get?type=sensor&area=${area}&hive=${hive}`;
  const response = await fetch(url);
  const data = await response.json();
  console.log(`Data received for area ${area}, hive ${hive}:`, data);
  return data;
}

function createChart(ctx, labels, datasets) {
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'minute',
            tooltipFormat: 'MM-dd HH:mm',
            displayFormats: {
              minute: 'MM-dd HH:mm'
            }
          },
          title: {
            display: false,
            text: 'Time'
          },
          ticks: {
            source: 'data',
            autoSkip: true,
            maxTicksLimit: 10
          }
        }
      }
    }
  });
}

function createInOutChart(ctx, created_at, field1, field2) {
  createChart(ctx, created_at, [
    {
      label: 'in',
      data: field1,
      borderColor: 'rgba(75, 192, 192, 1)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      fill: true,
    },
    {
      label: 'out',
      data: field2,
      borderColor: 'rgba(192, 75, 192, 1)',
      backgroundColor: 'rgba(192, 75, 192, 0.2)',
      fill: true,
    }
  ]);
}

function createTempHumiChart(ctx, time, temp, humi) {
  createChart(ctx, time, [
    {
      label: 'temp',
      data: temp,
      borderColor: 'rgba(75, 192, 192, 1)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      fill: true,
    },
    {
      label: 'humi',
      data: humi,
      borderColor: 'rgba(192, 75, 192, 1)',
      backgroundColor: 'rgba(192, 75, 192, 0.2)',
      fill: true,
    }
  ]);
}

function createCo2Chart(ctx, time, co2) {
  createChart(ctx, time, [
    {
      label: 'co2',
      data: co2,
      borderColor: 'rgba(75, 192, 192, 1)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      fill: true,
    }
  ]);
}

function createWeighChart(ctx, time, weigh) {
  createChart(ctx, time, [
    {
      label: 'weigh',
      data: weigh,
      borderColor: 'rgba(75, 192, 192, 1)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      fill: true,
    }
  ]);
}

async function renderCharts(area, hive) {
  console.log('Rendering charts for area', area, 'hive', hive);
  
  const inoutData = await fetchInOutData(area, hive);
  const sensorData = await fetchSensorData(area, hive);

  createInOutChart(document.getElementById('hive_io').getContext('2d'), inoutData.created_at, inoutData.in, inoutData.out);
  createTempHumiChart(document.getElementById('hive_th').getContext('2d'), sensorData.time, sensorData.temp, sensorData.humi);
  createCo2Chart(document.getElementById('hive_co2').getContext('2d'), sensorData.time, sensorData.co2);
  createWeighChart(document.getElementById('hive_weigh').getContext('2d'), sensorData.time, sensorData.weigh);
}

document.addEventListener('DOMContentLoaded', function() {
  const params = new URLSearchParams(window.location.search);
  const area = params.get('area');
  const hive = params.get('hive');

  if (area && hive) {
    renderCharts(area, hive);
  } else {
    console.error('Area and hive query parameters are required');
  }
});
