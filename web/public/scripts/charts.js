async function fetchInOutData(group_id) {
  const url = `/api/get/inout/${group_id}`;
  const response = await fetch(url);
  const data = await response.json();
  console.log(`Data received for group_id ${group_id}:`, data);
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

  const inoutDataPromises = [1, 2].map(fetchInOutData);
  const sensorDataPromises = [1, 2, 3, 4, 5, 6].map(fetchSensorData);

  const inoutData = await Promise.all(inoutDataPromises);
  const sensorData = await Promise.all(sensorDataPromises);

  const hiveIds = [1, 2, 3, 4, 5, 6];

  hiveIds.forEach((hiveId, index) => {
    const inoutDataIndex = Math.floor(index / 3); // 3개의 hive당 하나의 inoutData 사용
    const sensorDataIndex = index; // 각각의 hive에 대해 하나의 sensorData 사용

    const hivePrefix = `hive${hiveId}`;

    const inoutCtx = document.getElementById(`${hivePrefix}_io`).getContext('2d');
    createInOutChart(inoutCtx, inoutData[inoutDataIndex].entry_ids, inoutData[inoutDataIndex][`field${index * 2 + 1}`], inoutData[inoutDataIndex][`field${index * 2 + 2}`]);

    const thCtx = document.getElementById(`${hivePrefix}_th`).getContext('2d');
    createSensorChart(thCtx, sensorData[sensorDataIndex].data_id, sensorData[sensorDataIndex].temp, sensorData[sensorDataIndex].humi);

    const co2Ctx = document.getElementById(`${hivePrefix}_co2`).getContext('2d');
    createCo2Chart(co2Ctx, sensorData[sensorDataIndex].data_id, sensorData[sensorDataIndex].co2);
  });
}

renderCharts();


















async function fetchInOutData(group_id) {
  const url = `/api/get/inout/${group_id}`;
  const response = await fetch(url);
  const data = await response.json();
  console.log(`Data received for group_id ${group_id}:`, data);
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
  const inout_data1 = await fetchInOutData(1);
  const inout_data2 = await fetchInOutData(2);

  const sensor_data1 = await fetchSensorData(1);
  const sensor_data2 = await fetchSensorData(2);
  const sensor_data3 = await fetchSensorData(3);
  const sensor_data4 = await fetchSensorData(4);
  const sensor_data5 = await fetchSensorData(5);
  const sensor_data6 = await fetchSensorData(6);

  createInOutChart(document.getElementById('hive1_io').getContext('2d'), inout_data1.entry_ids, inout_data1.field1, inout_data1.field2);
  createInOutChart(document.getElementById('hive2_io').getContext('2d'), inout_data1.entry_ids, inout_data1.field3, inout_data1.field4);
  createInOutChart(document.getElementById('hive3_io').getContext('2d'), inout_data1.entry_ids, inout_data1.field5, inout_data1.field6);
  createInOutChart(document.getElementById('hive4_io').getContext('2d'), inout_data2.entry_ids, inout_data2.field1, inout_data2.field2);
  createInOutChart(document.getElementById('hive5_io').getContext('2d'), inout_data2.entry_ids, inout_data2.field3, inout_data2.field4);
  createInOutChart(document.getElementById('hive6_io').getContext('2d'), inout_data2.entry_ids, inout_data2.field5, inout_data2.field6);

  createTempHumiChart(document.getElementById('hive1_th').getContext('2d'), sensor_data1.data_id, sensor_data1.temp, sensor_data1.humi);
  createTempHumiChart(document.getElementById('hive2_th').getContext('2d'), sensor_data2.data_id, sensor_data2.temp, sensor_data2.humi);
  createTempHumiChart(document.getElementById('hive3_th').getContext('2d'), sensor_data3.data_id, sensor_data3.temp, sensor_data3.humi);
  createTempHumiChart(document.getElementById('hive4_th').getContext('2d'), sensor_data4.data_id, sensor_data4.temp, sensor_data4.humi);
  createTempHumiChart(document.getElementById('hive5_th').getContext('2d'), sensor_data5.data_id, sensor_data5.temp, sensor_data5.humi);
  createTempHumiChart(document.getElementById('hive6_th').getContext('2d'), sensor_data6.data_id, sensor_data6.temp, sensor_data6.humi);

  createCo2Chart(document.getElementById('hive1_co2').getContext('2d'), sensor_data1.data_id, sensor_data1.co2);
  createCo2Chart(document.getElementById('hive2_co2').getContext('2d'), sensor_data2.data_id, sensor_data2.co2);
  createCo2Chart(document.getElementById('hive3_co2').getContext('2d'), sensor_data3.data_id, sensor_data3.co2);
  createCo2Chart(document.getElementById('hive4_co2').getContext('2d'), sensor_data4.data_id, sensor_data4.co2);
  createCo2Chart(document.getElementById('hive5_co2').getContext('2d'), sensor_data5.data_id, sensor_data5.co2);
  createCo2Chart(document.getElementById('hive6_co2').getContext('2d'), sensor_data6.data_id, sensor_data6.co2);

}