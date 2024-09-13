// public/js/device_add.js
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const hiveId = urlParams.get('hive_id');
    const deviceId = urlParams.get('device_id'); // 수정 시 사용

    const title = document.getElementById('deviceAddTitle');
    const addButton = document.getElementById('addDeviceButton');

    if (deviceId) {
        title.textContent = 'DEVICE 수정';
    
        // 수정할때 deviceType 수정 불가
        document.getElementById('deviceType').disabled = true;

        // 예시 데이터
        document.getElementById('deviceName').value = 'Example Device';
        document.getElementById('deviceType').value = '1';
    
        // 기존 Device 데이터 로드 (API 호출 필요)
        const device = await getDeviceById(deviceId);
        if (device) {
            document.getElementById('deviceName').value = device.name;
            document.getElementById('deviceType').value = device.type_id;
        } else {
            alert('존재하지 않는 DEVICE입니다.');
            window.location.href = `device_list.html?hive_id=${hiveId}`;
        }
    } else {
        title.textContent = `DEVICE 추가 (HIVE ID: ${hiveId})`;
    }

    const form = document.getElementById('deviceAddForm');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const deviceName = document.getElementById('deviceName').value.trim();
        const deviceType = document.getElementById('deviceType').value;

        if (deviceName === '' || deviceType === '') {
            alert('모든 필드를 입력해주세요.');
            return;
        }

        if (deviceId) {
            
            await fetch('/honeybee/api/device', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deviceId: deviceId, name: deviceName })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.message === 'Device updated successfully') {
                        alert('DEVICE가 수정되었습니다.');
                        window.location.href = `device_list.html?hive_id=${hiveId}`;
                    } else if (data.message === 'Device not found') {
                        alert('존재하지 않는 DEVICE입니다.');
                    }
                })
                .catch(error => {
                    console.error('Error updating DEVICE:', error);
                    alert('DEVICE 수정에 실패했습니다.');
                });
            window.location.href = `device_list.html?hive_id=${hiveId}`;
        } else {

            await fetch('/honeybee/api/device', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: deviceName, hiveId: hiveId, typeId: deviceType })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.message === 'Device added successfully') {
                        alert('DEVICE가 추가되었습니다.');
                        window.location.href = `device_list.html?hive_id=${hiveId}`;
                    } else if (data.message === 'Device already exists') {
                        alert('이미 존재하는 DEVICE입니다.');
                    }
                })
                .catch(error => {
                    console.error('Error adding DEVICE:', error);
                    alert('DEVICE 추가에 실패했습니다.');
                });

            window.location.href = `device_list.html?hive_id=${hiveId}`;
        }
    });
});

async function getDeviceById(id) {
    const url = `/honeybee/api/device?deviceId=${id}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
        return null;
    }

    // data 배열에서 id에 맞는 device 찾기
    const device = data.find(device => device.id === parseInt(id));

    // device가 존재하면 반환, 없으면 null
    return device && device.name ? device : null;
}