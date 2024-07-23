let deviceList = [];

document.addEventListener('DOMContentLoaded', () => {
    const deviceContainer = document.getElementById('deviceContainer');
    const areas = getAreaHives();

    areas.forEach(area => {
        const areaElement = createAreaElement(area);
        deviceContainer.appendChild(areaElement);
    });

    document.addEventListener('deviceListUpdated', (event) => {
        console.log('Device List Updated:', event.detail);
    });
});

function getAreaHives() {
    return [
        {
            "id": 1,
            "name": "인천대",
            "hives": [
                { "id": 1, "name": "Hive 1" },
                { "id": 2, "name": "Hive 2" }
            ]
        },
        {
            "id": 2,
            "name": "안동대",
            "hives": [
                { "id": 3, "name": "Hive 3" }
            ]
        }
    ];
}

function getDevices(hiveId) {
    const devices = {
        1: [
            { name: 'device1', id: 'd1' },
            { name: 'device2', id: 'd2' }
        ],
        2: [
            { name: 'device3', id: 'd3' }
        ],
        3: [
            { name: 'device4', id: 'd4' },
            { name: 'device5', id: 'd5' }
        ]
    };
    return devices[hiveId] || [];
}

function createAreaElement(area) {
    const areaDiv = document.createElement('div');
    areaDiv.className = 'area-selector';

    const areaHeader = document.createElement('div');
    areaHeader.className = 'area-header';

    const toggleButton = document.createElement('button');
    toggleButton.textContent = '►';
    toggleButton.onclick = () => toggleElement(toggleButton, areaBody);

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
    toggleButton.onclick = () => toggleElement(toggleButton, hiveBody);

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

function toggleElement(button, element) {
    if (element.style.display === 'none' || element.style.display === '') {
        element.style.display = 'block';
        button.textContent = '▼';
        if (element.className === 'hive-body' && element.children.length === 0) {
            const devices = getDevices(element.dataset.hiveId);
            const checklist = document.createElement('div');
            checklist.className = 'checklist';
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
