// public/js/device_list.js
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const hiveId = urlParams.get('hive_id');
    const hiveName = await getHiveNameById(hiveId); // 함수는 실제 데이터에 맞게 구현 필요

    document.getElementById('deviceListTitle').textContent = `DEVICE 목록 (HIVE: ${hiveName})`;
    document.getElementById('addDeviceButton').onclick = () => {
        window.location.href = `device_add.html?hive_id=${hiveId}`;
    };

    let devices = await getDevicesByHiveId(hiveId); // 함수는 실제 데이터에 맞게 구현 필요
    console.log(devices);

    const tableBody = document.querySelector('#deviceTable tbody');
    tableBody.innerHTML = ''; // 기존 데이터 초기화

    devices.forEach(device => {
        const row = document.createElement('tr');

        // 디바이스 ID
        const idCell = document.createElement('td');
        idCell.textContent = device.id;
        row.appendChild(idCell);

        // 디바이스 이름
        const nameCell = document.createElement('td');
        nameCell.textContent = device.name;
        row.appendChild(nameCell);

        // 타입
        const typeCell = document.createElement('td');
        typeCell.textContent = device.type;
        row.appendChild(typeCell);

        // 모뎀 IP
        const ipCell = document.createElement('td');
        ipCell.textContent = device.modem_ip;
        row.appendChild(ipCell);

        // 작업 버튼
        const actionsCell = document.createElement('td');
        actionsCell.classList.add('actions');

        const editButton = document.createElement('button');
        editButton.textContent = '수정';
        editButton.onclick = () => {
            window.location.href = `device_add.html?device_id=${device.id}&hive_id=${hiveId}`;
        };
        actionsCell.appendChild(editButton);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = '삭제';
        deleteButton.classList.add('delete');
        deleteButton.onclick = () => {
            prepareDelete('device', device.id);
        };
        actionsCell.appendChild(deleteButton);

        row.appendChild(actionsCell);

        tableBody.appendChild(row);
    });
});

async function getDevicesByHiveId(id) {
    const url = `/honeybee/api/device?hiveId=${id}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data || !data.length) {
        return [];
    }

    // 타입 변환을 위한 매핑 테이블 (type_id를 type으로 변환)
    const typeMapping = {
        1: 'CAMERA',
        2: 'SENSOR',
        3: 'INOUT'
    };

    // 변환된 devices 배열 생성
    const devices = data.map(device => ({
        id: device.id,
        name: device.name,
        type: typeMapping[device.type_id] || 'UNKNOWN', // type_id를 type으로 변환, 없는 경우 'UNKNOWN' 처리
        modem_ip: device.modem_ip || '0.0.0.0' // 임의로 모뎀 IP 생성 (필요 시 수정 가능)
    }));

    return devices;
}

// HIVE ID로 HIVE 이름 가져오기 (예시 함수)
async function getHiveNameById(id) {
    const url = `/honeybee/api/hive?hiveId=${id}`;
    const response = await fetch(url);
    const data = await response.json();
    
    // data가 존재하고 배열이 아닐 경우 처리
    if (!Array.isArray(data) || data.length === 0) {
        return 'Unknown';
    }

    // data 배열에서 id에 맞는 hive 찾기
    const hive = data.find(hive => hive.id === parseInt(id));

    // hive가 존재하고 name이 있으면 반환, 없으면 'Unknown'
    return hive && hive.name ? hive.name : 'Unknown';
}


// 삭제 준비 함수
function prepareDelete(type, id) {
    // 삭제할 항목의 타입과 ID를 전역 변수로 설정
    window.deleteType = type;
    window.deleteId = id;
    showDeleteModal();  // 모달 표시
}

// 삭제 확인 후 실행될 함수
document.addEventListener('modalLoaded', () => {
    const confirmButton = document.getElementById('confirmDelete');

    if (confirmButton) {
        confirmButton.addEventListener('click', async () => {
            const type = window.deleteType;
            const id = window.deleteId;

            if (type === 'device') {

                await fetch(`/honeybee/api/device?deviceId=${id}`, { method: 'DELETE' })
                    .then(response => response.json())
                    .then(data => {
                        alert('DEVICE가 삭제되었습니다.');
                        location.reload();
                    })
                    .catch(error => {
                        console.error('Error deleting DEVICE:', error);
                        alert('DEVICE 삭제에 실패했습니다.');
                    });

                closeDeleteModal();
                location.reload(); // 실제로는 테이블에서 해당 행을 제거하는 로직 필요
            }
        });
    }
});