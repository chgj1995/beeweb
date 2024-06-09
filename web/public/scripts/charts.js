async function fetchInOutData(hive_id) {
  const url = `/api/get/inout/${hive_id}`;
  const response = await fetch(url);
  const data = await response.json();
  console.log(`Data received for hive_id ${hive_id}:`, data);
  return data;
}

async function fetchSensorData(hive_id) {
  const url = `/api/get/sensor/${hive_id}`;
  const response = await fetch(url);
  const data = await response.json();
  console.log(`Data received for hive_id ${hive_id}:`, data);
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
          type: 'linear',
          title: {
            display: false,
            text: 'Entry ID'
          },
          ticks: {
            callback: function (value) {
              return Number.isInteger(value) ? value : '';
            }
          }
        }
      }
    }
  });
}

function createInOutChart(ctx, entry_ids, field1, field2) {
  createChart(ctx, entry_ids, [
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

function createTempHumiChart(ctx, data_id, temp, humi) {
  createChart(ctx, data_id, [
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

function createCo2Chart(ctx, data_id, co2) {
  createChart(ctx, data_id, [
    {
      label: 'co2',
      data: co2,
      borderColor: 'rgba(75, 192, 192, 1)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      fill: true,
    }
  ]);
}

async function renderCharts() {
  console.log('Rendering charts');
  
  const hiveIds = [1, 2, 3, 4, 5, 6];
  const inoutDataPromises = hiveIds.map(id => fetchInOutData(id));
  const sensorDataPromises = hiveIds.map(id => fetchSensorData(id));
  
  const inoutData = await Promise.all(inoutDataPromises);
  const sensorData = await Promise.all(sensorDataPromises);

  createInOutChart(document.getElementById('hive1_io').getContext('2d'), inoutData[0].entry_ids, inoutData[0].in, inoutData[0].out);
  createInOutChart(document.getElementById('hive2_io').getContext('2d'), inoutData[1].entry_ids, inoutData[1].in, inoutData[1].out);
  createInOutChart(document.getElementById('hive3_io').getContext('2d'), inoutData[2].entry_ids, inoutData[2].in, inoutData[2].out);
  createInOutChart(document.getElementById('hive4_io').getContext('2d'), inoutData[3].entry_ids, inoutData[3].in, inoutData[3].out);
  createInOutChart(document.getElementById('hive5_io').getContext('2d'), inoutData[4].entry_ids, inoutData[4].in, inoutData[4].out);
  createInOutChart(document.getElementById('hive6_io').getContext('2d'), inoutData[5].entry_ids, inoutData[5].in, inoutData[5].out);

  createTempHumiChart(document.getElementById('hive1_th').getContext('2d'), sensorData[0].data_id, sensorData[0].temp, sensorData[0].humi);
  createTempHumiChart(document.getElementById('hive2_th').getContext('2d'), sensorData[1].data_id, sensorData[1].temp, sensorData[1].humi);
  createTempHumiChart(document.getElementById('hive3_th').getContext('2d'), sensorData[2].data_id, sensorData[2].temp, sensorData[2].humi);
  createTempHumiChart(document.getElementById('hive4_th').getContext('2d'), sensorData[3].data_id, sensorData[3].temp, sensorData[3].humi);
  createTempHumiChart(document.getElementById('hive5_th').getContext('2d'), sensorData[4].data_id, sensorData[4].temp, sensorData[4].humi);
  createTempHumiChart(document.getElementById('hive6_th').getContext('2d'), sensorData[5].data_id, sensorData[5].temp, sensorData[5].humi);

  createCo2Chart(document.getElementById('hive1_co2').getContext('2d'), sensorData[0].data_id, sensorData[0].co2);
  createCo2Chart(document.getElementById('hive2_co2').getContext('2d'), sensorData[1].data_id, sensorData[1].co2);
  createCo2Chart(document.getElementById('hive3_co2').getContext('2d'), sensorData[2].data_id, sensorData[2].co2);
  createCo2Chart(document.getElementById('hive4_co2').getContext('2d'), sensorData[3].data_id, sensorData[3].co2);
  createCo2Chart(document.getElementById('hive5_co2').getContext('2d'), sensorData[4].data_id, sensorData[4].co2);
  createCo2Chart(document.getElementById('hive6_co2').getContext('2d'), sensorData[5].data_id, sensorData[5].co2);
}

renderCharts();
