let fetcher_deviceList = [];
let fetcher_tRange = {sTime: null, eTime: null};
let fetcher_dataList = [];

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

async function fetchDataList() {
    fetcher_dataList = [];

    for(const device of fetcher_deviceList) {
        let data;

        // // fetchDataList에 deviceId가 없는 경우(데이터가 없는 경우)에만 데이터를 가져옴
        // if(fetcher_dataList.find(d => d.device.id == device.id) != undefined) {
        //     console.log('Data already fetched for device:', device);
        //     continue;
        // }

        if(device.type_id == 2) {
            data = await fetchSensorData(device.id, fetcher_tRange.sTime, fetcher_tRange.eTime);
            console.log('fetched data', {device: device, data: data});
            fetcher_dataList.push({device: device, data: data});
        } else if(device.type_id == 3) {
            data = await fetchInOutData(device.id, fetcher_tRange.sTime, fetcher_tRange.eTime);
            console.log('fetched data', {device: device, data: data});
            fetcher_dataList.push({device: device, data: data});
        }
    }
    console.log('All data fetched:', fetcher_dataList);

    const updateEvent = new CustomEvent('dataUpdated', { detail: fetcher_dataList });
    document.dispatchEvent(updateEvent);
}

// ================== 장치 선택기의 이벤트 리스너 ==================
document.addEventListener('deviceListUpdated', async (event) => {
    console.log('deviceListUpdated:', event.detail);
    fetcher_deviceList = event.detail;
    await fetchDataList();
});


// ================== 시간 선택기의 이벤트 리스너 ==================
document.addEventListener('timeRangeUpdated', async (event) => {
    console.log(`Time range updated: ${event.detail.sTime} ~ ${event.detail.eTime}`);
    fetcher_tRange = event.detail;
    if(fetcher_deviceList.length > 0) {
        await fetchDataList();
    }
});

// ================== 차트에서 쓸 테스트용 이벤트 리스너 ==================
document.addEventListener('dataUpdated', (event) => {
    console.log('dataLoaded:', fetcher_dataList);
});