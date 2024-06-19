async function fetchInOutData(areaId, hiveId) {
  const url = `/api/get/inout/${areaId}/${hiveId}`;
  const response = await fetch(url);
  const data = await response.json();
  console.log(`Data received for area_id ${areaId}, hive_id ${hiveId}:`, data);
  return data;
}

async function fetchSensorData(areaId, hiveId) {
  const url = `/api/get/sensor/${areaId}/${hiveId}`;
  const response = await fetch(url);
  const data = await response.json();
  console.log(`Data received for area_id ${areaId}, hive_id ${hiveId}:`, data);
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
          type: 'time', // x축을 시간 축으로 설정
          time: {
            unit: 'minute', // 시간 단위를 분으로 설정
            tooltipFormat: 'MM-dd HH:mm', // 툴팁 형식 설정
            displayFormats: {
              minute: 'MM-dd HH:mm' // x축 라벨 형식 설정
            }
          },
          title: {
            display: false,
            text: 'Time'
          },
          ticks: {
            source: 'data', // 값이 있는 포인트에만 x축을 표기
            autoSkip: true,
            maxTicksLimit: 10 // x축 라벨의 최대 표시 개수
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

async function renderCharts(areaId, hiveId) {
  console.log('Rendering charts for area', areaId, 'hive', hiveId);
  
  const inoutData = await fetchInOutData(areaId, hiveId);
  const sensorData = await fetchSensorData(areaId, hiveId);

  createInOutChart(document.getElementById('hive_io').getContext('2d'), inoutData.created_at, inoutData.in, inoutData.out);
  createTempHumiChart(document.getElementById('hive_th').getContext('2d'), sensorData.time, sensorData.temp, sensorData.humi);
  createCo2Chart(document.getElementById('hive_co2').getContext('2d'), sensorData.time, sensorData.co2);
  createWeighChart(document.getElementById('hive_weigh').getContext('2d'), sensorData.time, sensorData.weigh);
}

document.addEventListener('DOMContentLoaded', function() {
  const pathParts = window.location.pathname.split('/');
  const areaId = pathParts[2];
  const hiveId = pathParts[4];
  // document.getElementById('hiveId').textContent = `Area ${areaId}, Hive ${hiveId}`;
  renderCharts(areaId, hiveId);
});
