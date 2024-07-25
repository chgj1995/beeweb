let selector_deviceList = [];
let selector_areaHives = [];

async function fetchAreaHiveData() {
    try {
        const response = await fetch('/honeybee/api/areahive');
        let data = await response.json();

        // 하이브 이름을 기준으로 정렬하고, 하이브가 없는 지역 제거
        data = data
            .filter(area => area.hives.length > 0) // 하이브가 있는 지역만 남김
            .map(area => {
                area.hives.sort((a, b) => {
                    const aNumber = parseInt(a.name.replace('Hive ', ''));
                    const bNumber = parseInt(b.name.replace('Hive ', ''));
                    return aNumber - bNumber;
                });
                return area;
            });

        return data;
    } catch (error) {
        console.error('Error fetching area and hive data:', error);
    }
}

async function fetchDevicesByHive(hiveId) {
    const url = `/honeybee/api/device?hiveId=${hiveId}`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
  }

async function fetchDeviceByDeviceId(deviceId) {
    const url = `/honeybee/api/device?deviceId=${deviceId}`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
}

function createAreaElement(area) {
    const areaDiv = document.createElement('div');
    areaDiv.className = 'area-selector';
    areaDiv.dataset.areaId = area.id;

    const areaHeader = document.createElement('div');
    areaHeader.className = 'header';

    const toggleButton = document.createElement('button');
    toggleButton.textContent = '►';
    toggleButton.onclick = async () => {
        await toggleElement(toggleButton, areaDiv);
    };

    const title = document.createElement('span');
    title.textContent = area.name;

    areaHeader.appendChild(toggleButton);
    areaHeader.appendChild(title);

    const areaBody = document.createElement('div');
    areaBody.className = 'body';
    areaBody.style.display = 'none';

    area.hives.forEach(hive => {
        const hiveElement = createHiveElement(hive);
        areaBody.appendChild(hiveElement);
    });

    areaDiv.appendChild(areaHeader);
    areaDiv.appendChild(areaBody);
    return areaDiv;
}

function createHiveElement(hive) {
    const hiveDiv = document.createElement('div');
    hiveDiv.className = 'hive-selector';
    hiveDiv.dataset.hiveId = hive.id;

    const hiveHeader = document.createElement('div');
    hiveHeader.className = 'header';

    const toggleButton = document.createElement('button');
    toggleButton.textContent = '►';
    toggleButton.onclick = async () => {
        await toggleElement(toggleButton, hiveDiv);
    };
    const title = document.createElement('span');
    title.textContent = hive.name;

    hiveHeader.appendChild(toggleButton);
    hiveHeader.appendChild(title);

    const hiveBody = document.createElement('div');
    hiveBody.className = 'body';
    hiveBody.style.display = 'none';

    hiveDiv.appendChild(hiveHeader);
    hiveDiv.appendChild(hiveBody);
    return hiveDiv;
}

async function toggleElement(button, element, isShow = false) {
    const body = element.querySelector('.body');
    if (!body) return;

    if (body.style.display === 'none' || body.style.display === '' || isShow) {
        body.style.display = 'block';
        button.textContent = '▼';

        if (element.classList.contains('hive-selector') && body.children.length === 0) {
            const hiveId = element.dataset.hiveId;
            const devices = await fetchDevicesByHive(hiveId);
            console.log('Devices:', devices);
            const checklist = document.createElement('div');
            checklist.className = 'selector-device-checklist';
            devices.forEach(device => {
                const deviceDiv = createCheckboxElement(device.id, device.type_id, device.name);
                checklist.appendChild(deviceDiv);
            });
            body.appendChild(checklist);
        }
    } else {
        body.style.display = 'none';
        button.textContent = '►';
    }
}


function createCheckboxElement(id, type_id, name) {
    const div = document.createElement('div');
    div.className = 'device';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = id;
    checkbox.onchange = (event) => {
        if (event.target.checked) {
            selector_deviceList.push(id);
        } else {
            const index = selector_deviceList.indexOf(id);
            if (index > -1) {
                selector_deviceList.splice(index, 1);
            }
        }
        updateURLParamsForDevice();
        const updateEvent = new CustomEvent('deviceListUpdated', { detail: selector_deviceList });
        document.dispatchEvent(updateEvent);
    };

    const label = document.createElement('label');
    label.htmlFor = id;

    // const deviceTypes = {
    //     'CAMERA': 1,
    //     'SENSOR': 2,
    //     'INOUT': 3,
    //   };
    if(type_id == 2) {
        label.textContent = `[TEMP&HUMI] ${name}`;
    } else if (type_id == 3) {
        label.textContent = `[I/O] ${name}`;
    } else {
        label.textContent = name;
    }

    div.appendChild(checkbox);
    div.appendChild(label);
    return div;
}

// ================== URL 파라미터 관리 ==================

// URL 파라미터 업데이트 함수
function updateURLParamsForDevice() {
    const hiveSelector = document.querySelectorAll('.hive-selector');
    let params = new URLSearchParams(window.location.search);

    let allSelectedDeviceIds = [];

    // 모든 hive-selector에서 선택된 장치 ID를 수집합니다.
    for (const hive of hiveSelector) {
        const selectedOptions = Array.from(hive.querySelectorAll('.selector-device-checklist input:checked')).map(cb => cb.id);
        allSelectedDeviceIds = allSelectedDeviceIds.concat(selectedOptions);
    }

    // 선택된 장치 ID가 있으면 deviceId 파라미터를 설정하고, 없으면 삭제합니다.
    if (allSelectedDeviceIds.length > 0) {
        params.set('deviceId', allSelectedDeviceIds.join(','));
    } else {
        params.delete('deviceId');
    }

    // 새로운 URL을 생성하고, 히스토리를 업데이트합니다.
    const newURL = window.location.pathname + '?' + params.toString();
    window.history.replaceState(null, '', newURL);
}

// URL 파라미터로부터 셀렉터 복구 함수
async function fetchAndRenderDevice() {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const urlDevices = urlSearchParams.get('deviceId');
    if (urlDevices) {
        const devices = await fetchDeviceByDeviceId(urlDevices);

        for(const device of devices) {
            const hiveId = device.hive_id;
            // areaHives에서 hiveId를 가진 area를 찾음
            const area = selector_areaHives.find(area => area.hives && area.hives.find(hive => hive.id == hiveId));
            if(!area) { return; }
            const areaId = area.id;

            const areaElement = document.querySelector(`.area-selector[data-area-id='${areaId}']`);
            if (!areaElement) { return; }

            const areaToggleButton = areaElement.querySelector('.body button');
            if (!areaToggleButton) { return; }
            await toggleElement(areaToggleButton, areaElement, true);

            const hiveElement = areaElement.querySelector(`.hive-selector[data-hive-id='${hiveId}']`);
            if (!hiveElement) { return; }

            const hiveToggleButton = hiveElement.querySelector('.body button');
            if (!hiveToggleButton) { return; }
            await toggleElement(hiveToggleButton, hiveElement, true);

            const deviceCheckBox = hiveElement.querySelector(`.selector-device-checklist input[id='${device.id}']`);
            if (!deviceCheckBox) { return; }

            deviceCheckBox.checked = true;
            selector_deviceList.push(device);
        };

        const updateEvent = new CustomEvent('deviceListUpdated', { detail: selector_deviceList });
        document.dispatchEvent(updateEvent);
    }
}


document.addEventListener('DOMContentLoaded', async () => {
    const deviceSelector = document.getElementById('device-selector');
    selector_areaHives = await fetchAreaHiveData();

    console.log('Area Hives:', selector_areaHives);

    for(const area of selector_areaHives) {
        const areaElement = createAreaElement(area);
        deviceSelector.appendChild(areaElement);
    }

    // 페이지 로드 시 URL 파라미터로부터 셀렉터 복구
    await fetchAndRenderDevice();
});
