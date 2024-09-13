// public/js/hive_add.js
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const hiveId = urlParams.get('hive_id');

    const title = document.getElementById('hiveAddTitle');
    const addButton = document.getElementById('addHiveButton');

    if (hiveId) {
        title.textContent = 'HIVE 수정';
        
        // 예시 데이터
        document.getElementById('hiveName').value = 'Example Hive';
        document.getElementById('areaSelect').value = '1';

        // 기존 Hive 데이터 로드 (API 호출 필요)
        const hive = await getHiveById(hiveId);
        if (hive) {
            document.getElementById('hiveName').value = hive.name;
            document.getElementById('areaSelect').value = hive.area_id;
        } else {
            alert('존재하지 않는 HIVE입니다.');
            window.location.href = 'hive_list.html';
        }
    } else {
        title.textContent = 'HIVE 추가';
    }

    const form = document.getElementById('hiveAddForm');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const hiveName = document.getElementById('hiveName').value.trim();
        const areaId = document.getElementById('areaSelect').value;

        if (hiveName === '' || areaId === '') {
            alert('모든 필드를 입력해주세요.');
            return;
        }

        if (hiveId) {
            await fetch('/honeybee/api/hive', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hiveId: hiveId, name: hiveName, areaId: areaId })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.message === 'Hive updated successfully') {
                        alert('HIVE가 수정되었습니다.');
                        window.location.href = 'hive_list.html';
                    } else if (data.message === 'Hive not found') {
                        alert('존재하지 않는 HIVE입니다.');
                    }
                })
                .catch(error => {
                    console.error('Error updating HIVE:', error);
                    alert('HIVE 수정에 실패했습니다.');
                });
            return;
        } else {
            await fetch('/honeybee/api/hive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: hiveName, areaId: areaId })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.message === 'Hive added successfully') {
                        alert('HIVE가 추가되었습니다.');
                        window.location.href = 'hive_list.html';
                    } else if (data.message === 'Hive already exists') {
                        alert('이미 존재하는 HIVE입니다.');
                    }
                })
                .catch(error => {
                    console.error('Error adding HIVE:', error);
                    alert('HIVE 추가에 실패했습니다.');
                });
            window.location.href = 'hive_list.html';
        }
    });
});

async function getHiveById(id) {
    const url = `/honeybee/api/hive?hiveId=${id}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
        return null;
    }

    // data 배열에서 id에 맞는 hive 찾기
    const hive = data.find(hive => hive.id === parseInt(id));

    // hive가 존재하면 반환, 없으면 null
    return hive || hive.name ? hive : null;
}