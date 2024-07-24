let deviceList = [];

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
    console.log(`Devices received for hive ${hiveId}:`, data);
    return data;
  }

// function getDevices(hiveId) {
//     const devices = {
//         1: [
//             { name: 'device1', id: 'd1' },
//             { name: 'device2', id: 'd2' }
//         ],
//         2: [
//             { name: 'device3', id: 'd3' }
//         ],
//         3: [
//             { name: 'device4', id: 'd4' },
//             { name: 'device5', id: 'd5' }
//         ]
//     };
//     return devices[hiveId] || [];
// }

function createAreaElement(area) {
    const areaDiv = document.createElement('div');
    areaDiv.className = 'area-selector';

    const areaHeader = document.createElement('div');
    areaHeader.className = 'area-header';

    const toggleButton = document.createElement('button');
    toggleButton.textContent = '►';
    toggleButton.onclick = async () => {
        await toggleElement(toggleButton, areaBody);
    };

    const title = document.createElement('span');
    title.textContent = area.name;

    areaHeader.appendChild(toggleButton);
    areaHeader.appendChild(title);

    const areaBody = document.createElement('div');
    areaBody.className = 'area-body';
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

    const hiveHeader = document.createElement('div');
    hiveHeader.className = 'hive-header';

    const toggleButton = document.createElement('button');
    toggleButton.textContent = '►';
    toggleButton.onclick = async () => {
        await toggleElement(toggleButton, hiveBody);
    };
    const title = document.createElement('span');
    title.textContent = hive.name;

    hiveHeader.appendChild(toggleButton);
    hiveHeader.appendChild(title);

    const hiveBody = document.createElement('div');
    hiveBody.className = 'hive-body';
    hiveBody.style.display = 'none';

    hiveBody.dataset.hiveId = hive.id;

    hiveDiv.appendChild(hiveHeader);
    hiveDiv.appendChild(hiveBody);
    return hiveDiv;
}

async function toggleElement(button, element) {
    if (element.style.display === 'none' || element.style.display === '') {
        element.style.display = 'block';
        button.textContent = '▼';
        if (element.className === 'hive-body' && element.children.length === 0) {
            const devices = await fetchDevicesByHive(element.dataset.hiveId);
            console.log('Devices:', devices);
            const checklist = document.createElement('div');
            checklist.className = 'device-checklist';
            devices.forEach(device => {
                const deviceDiv = createCheckboxElement(device.name, device.id);
                checklist.appendChild(deviceDiv);
            });
            element.appendChild(checklist);
        }
    } else {
        element.style.display = 'none';
        button.textContent = '►';
    }
}

function createCheckboxElement(name, id) {
    const div = document.createElement('div');
    div.className = 'device';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = id;
    checkbox.onchange = (event) => {
        if (event.target.checked) {
            deviceList.push(id);
        } else {
            const index = deviceList.indexOf(id);
            if (index > -1) {
                deviceList.splice(index, 1);
            }
        }
        const updateEvent = new CustomEvent('deviceListUpdated', { detail: deviceList });
        document.dispatchEvent(updateEvent);
    };

    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = name;

    div.appendChild(checkbox);
    div.appendChild(label);
    return div;
}

document.addEventListener('DOMContentLoaded', async () => {
    const deviceContainer = document.getElementById('deviceContainer');
    const areaHives = await fetchAreaHiveData();
    
    console.log('Area Hives:', areaHives);

    areaHives.forEach(area => {
        const areaElement = createAreaElement(area);
        deviceContainer.appendChild(areaElement);
    });

    document.addEventListener('deviceListUpdated', (event) => {
        console.log('Device List Updated:', event.detail);
    });
});
