// 전역변수로 sTime, eTime 설정
let sTime;
let eTime;

// 이벤트 받아서 처리
document.addEventListener('saveButtonClicked', async (event) => {
    console.log('selected hive datas:', event.detail.hives);

    // 데이터 획득
    const hives = event.detail.hives;
    const datas = await getDatas(hives, sTime, eTime);
    saveHivesToExcel(datas);
});

// 이벤트 받아서 처리
document.addEventListener('timeRangeUpdated', (event) => {
    sTime = event.detail.sTime;
    eTime = event.detail.eTime;
    console.log(`Time range updated: ${sTime} ~ ${eTime}`);
});

// 실제 API 호출을 통해 HIVE 데이터를 가져오는 함수
async function getAreas() {
    const response = await fetch('/honeybee/api/areahive');
    const data = await response.json();

    if (!data || !data.length) {
        return [];
    }

    let hives = [];
    data.forEach(area => {
        area.hives.forEach(hive => {
            hives.push({
                id: hive.id,
                name: hive.name,
                area_name: area.name
            });
        });
    });
    return hives;
}

async function getDatas(hives, sTime, eTime) {
    const datas = [];
    for (const hive of hives) {
        const inout = await getInout(hive.id, sTime, eTime);
        const sensor = await getSensor(hive.id, sTime, eTime);        
        datas.push({
            hive: hive,
            inout: inout,
            sensor: sensor
        });
    }

    return datas;
}

async function getInout(deviceId, sTime, eTime) {
    const response = await fetch(`/honeybee/api/inout?deviceId=${deviceId}&sTime=${sTime}&eTime=${eTime}`);
    const data = await response.json();

    if (!data || !data.length) {
        return [];
    }

    return data;
}

async function getSensor(deviceId, sTime, eTime) {
    const response = await fetch(`/honeybee/api/sensor?deviceId=${deviceId}&sTime=${sTime}&eTime=${eTime}`);
    const data = await response.json();

    if (!data || !data.length) {
        return [];
    }

    return data;
}

function saveHivesToExcel(data) {
    // 1. 모든 inout과 sensor 데이터를 time을 기준으로 정렬해서 하나의 배열로 만듦
    let combinedData = [];

    data.forEach(item => {
        // hive 정보는 각 행에 공통으로 들어감
        const { id, name, area_name } = item.hive;

        // inout 데이터를 추가
        item.inout.forEach(inoutData => {
            combinedData.push({
                time: inoutData.time,
                hive_id: id,
                hive_name: name,
                area_name: area_name,
                in_field: inoutData.in_field,
                out_field: inoutData.out_field,
                temp: '',
                humi: '',
                co2: '',
                weigh: ''
            });
        });

        // sensor 데이터를 추가
        item.sensor.forEach(sensorData => {
            combinedData.push({
                time: sensorData.time,
                hive_id: id,
                hive_name: name,
                area_name: area_name,
                in_field: '',
                out_field: '',
                temp: sensorData.temp,
                humi: sensorData.humi,
                co2: sensorData.co2,
                weigh: sensorData.weigh
            });
        });
    });

    // 2. time을 기준으로 데이터 정렬
    combinedData.sort((a, b) => new Date(a.time) - new Date(b.time));

    // 3. 엑셀에 저장할 데이터 구조 설정
    const excelData = combinedData.map(item => ({
        'Time': item.time,
        'HIVE ID': item.hive_id,
        'HIVE 이름': item.hive_name,
        '지역 이름': item.area_name,
        'In Field': item.in_field,
        'Out Field': item.out_field,
        'Temperature': item.temp,
        'Humidity': item.humi,
        'CO2': item.co2,
        'Weight': item.weigh
    }));

    // 4. 새로운 워크북 생성
    const wb = XLSX.utils.book_new();

    // 5. 워크시트 생성 (JSON 데이터를 시트로 변환)
    const ws = XLSX.utils.json_to_sheet(excelData);

    // 6. 워크북에 워크시트 추가
    XLSX.utils.book_append_sheet(wb, ws, 'Hives');

    // 파일명에 시간범위 추가
    const sTimeStr = sTime.replace(/:/g, '-');
    const eTimeStr = eTime.replace(/:/g, '-');
    const fileName = `hive_data_${sTimeStr}~${eTimeStr}.xlsx`;

    // 7. 엑셀 파일 다운로드
    XLSX.writeFile(wb, fileName);
}
