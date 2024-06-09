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

    createChart(document.getElementById(`${hivePrefix}_io`).getContext('2d'), inoutData[inoutDataIndex].entry_ids, [
      {
        label: 'in',
        data: inoutData[inoutDataIndex][`field${index * 2 + 1}`],
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
      },
      {
        label: 'out',
        data: inoutData[inoutDataIndex][`field${index * 2 + 2}`],
        borderColor: 'rgba(192, 75, 192, 1)',
        backgroundColor: 'rgba(192, 75, 192, 0.2)',
        fill: true,
      }
    ]);

    createChart(document.getElementById(`${hivePrefix}_th`).getContext('2d'), sensorData[sensorDataIndex].data_id, [
      {
        label: 'temp',
        data: sensorData[sensorDataIndex].temp,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
      },
      {
        label: 'humi',
        data: sensorData[sensorDataIndex].humi,
        borderColor: 'rgba(192, 75, 192, 1)',
        backgroundColor: 'rgba(192, 75, 192, 0.2)',
        fill: true,
      }
    ]);

    createChart(document.getElementById(`${hivePrefix}_co2`).getContext('2d'), sensorData[sensorDataIndex].data_id, [
      {
        label: 'co2',
        data: sensorData[sensorDataIndex].co2,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
      }
    ]);
  });
}

renderCharts();
