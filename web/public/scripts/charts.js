const deviceTypes = {
  'CAMERA': 1,
  'SENSOR': 2,
  'INOUT': 3,
};

async function fetchInOutData(deviceId, sTime, eTime) {
  const url = `/honeybee/api/inout?deviceId=${deviceId}&sTime=${sTime}&eTime=${eTime}`;
  const response = await fetch(url);
  const data = await response.json();
  console.log(`Data received for device ${deviceId}:`, data);
  return data;
}

async function fetchSensorData(deviceId, sTime, eTime) {
  const url = `/honeybee/api/sensor?deviceId=${deviceId}&sTime=${sTime}&eTime=${eTime}`;
  const response = await fetch(url);
  const data = await response.json();
  console.log(`Data received for device ${deviceId}:`, data);
  return data;
}

async function fetchDevicesByHive(hiveId) {
  const url = `/honeybee/api/device?hiveId=${hiveId}`;
  const response = await fetch(url);
  const data = await response.json();
  console.log(`Devices received for hive ${hiveId}:`, data);
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
      },
      responsive: false
    }
  });
}

function createInOutChart(ctx, created_at, in_field, out_field) {
  createChart(ctx, created_at, [
    {
      label: 'in',
      data: in_field,
      borderColor: 'rgba(75, 192, 192, 1)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      fill: false,
      pointRadius: 0,  // Hide data points
      borderWidth: 1
    },
    {
      label: 'out',
      data: out_field,
      borderColor: 'rgba(192, 75, 192, 1)',
      backgroundColor: 'rgba(192, 75, 192, 0.2)',
      fill: false,
      pointRadius: 0,  // Hide data points
      borderWidth: 1
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
      fill: false,
      pointRadius: 0,  // Hide data points
      borderWidth: 1
    },
    {
      label: 'humi',
      data: humi,
      borderColor: 'rgba(192, 75, 192, 1)',
      backgroundColor: 'rgba(192, 75, 192, 0.2)',
      fill: false,
      pointRadius: 0,  // Hide data points
      borderWidth: 1
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
      fill: false,
      pointRadius: 0,  // Hide data points
      borderWidth: 1
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
      fill: false,
      pointRadius: 0,  // Hide data points
      borderWidth: 1
    }
  ]);
}

async function fetchAndRenderCharts(urlParams) {
  // URL 쿼리 매개변수에서 hiveId, sTime, eTime 추출
  const urlSearchParams = new URLSearchParams(urlParams);
  let hiveId = urlSearchParams.get('hiveId');
  let sTime = urlSearchParams.get('sTime');
  let eTime = urlSearchParams.get('eTime');

  // 기본값 설정
  if (!hiveId) {
    hiveId = 1;
  }

  if (!sTime || !eTime) {
    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(now.getMonth() - 1);
  
    const defaultSTime = oneMonthAgo.toISOString().slice(0, 19).replace('T', ' ');
    const defaultETime = now.toISOString().slice(0, 19).replace('T', ' ');
    
    sTime = sTime || defaultSTime;
    eTime = eTime || defaultETime;
  }

  // 장치 목록 조회
  const devices = await fetchDevicesByHive(hiveId);
  const sensorData = [];
  const inoutData = [];

  for (const device of devices) {
    let result;
    if (device.type === deviceTypes.SENSOR) {
      result = await fetchSensorData(device.id, sTime, eTime);
    } else if (device.type === deviceTypes.INOUT) {
      result = await fetchInOutData(device.id, sTime, eTime);
    }

    if (result && result.length > 0) {
      if (device.type === deviceTypes.SENSOR) {
        sensorData.push(...result);
      } else if (device.type === deviceTypes.INOUT) {
        inoutData.push(...result);
      }
    }
  }

  // 차트 렌더링
  createInOutChart(document.getElementById('hive_io').getContext('2d'), inoutData.map(data => data.time), inoutData.map(data => data.in_field), inoutData.map(data => data.out_field));
  createTempHumiChart(document.getElementById('hive_th').getContext('2d'), sensorData.map(data => data.time), sensorData.map(data => data.temp), sensorData.map(data => data.humi));
  createCo2Chart(document.getElementById('hive_co2').getContext('2d'), sensorData.map(data => data.time), sensorData.map(data => data.co2));
  createWeighChart(document.getElementById('hive_weigh').getContext('2d'), sensorData.map(data => data.time), sensorData.map(data => data.weigh));
}


document.addEventListener('DOMContentLoaded', function() {
  fetchAndRenderCharts(window.location.search);
});