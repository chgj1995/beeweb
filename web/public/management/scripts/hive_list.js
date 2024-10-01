// public/js/hive_list.js
document.addEventListener('DOMContentLoaded', async () => {
    // 예시: 실제로는 API를 통해 데이터를 가져와야 합니다.
    // 여기서는 하드코딩된 데이터를 사용합니다.

    let hives = await getHives();

    const tableBody = document.querySelector('#hiveTable tbody');
    tableBody.innerHTML = ''; // 기존 데이터 초기화

    hives.forEach(hive => {
        const row = document.createElement('tr');

        // HIVE ID
        const idCell = document.createElement('td');
        idCell.textContent = hive.id;
        row.appendChild(idCell);

        // HIVE 이름 (링크)
        const nameCell = document.createElement('td');
        const link = document.createElement('a');
        link.href = `device_list.html?hive_id=${hive.id}`;
        link.textContent = hive.name;
        nameCell.appendChild(link);
        row.appendChild(nameCell);

        // 지역 이름
        const areaCell = document.createElement('td');
        areaCell.textContent = hive.area_name;
        row.appendChild(areaCell);

        // 작업 버튼
        const actionsCell = document.createElement('td');
        actionsCell.classList.add('actions');

        const editButton = document.createElement('button');
        editButton.textContent = '수정';
        editButton.onclick = () => {
            window.location.href = `hive_add.html?hive_id=${hive.id}`;
        };
        actionsCell.appendChild(editButton);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = '삭제';
        deleteButton.classList.add('delete');
        deleteButton.onclick = () => {
            prepareDelete('hive', hive.id);
        };
        actionsCell.appendChild(deleteButton);

        row.appendChild(actionsCell);

        tableBody.appendChild(row);
    });
});

async function getHives() {
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

// 삭제 준비 함수
function prepareDelete(type, id) {
    // 삭제할 항목의 타입과 ID를 저장
    window.deleteType = type;
    window.deleteId = id;
    showDeleteModal();
}

// 삭제 확인 후 실행될 함수
document.addEventListener('modalLoaded', () => {
    const confirmButton = document.getElementById('confirmDelete');
    
    if (confirmButton) {
        confirmButton.addEventListener('click', async () => {
            const type = window.deleteType;
            const id = window.deleteId;

            if (type === 'hive') {

                await fetch(`/honeybee/api/hive?hiveId=${id}`, { method: 'DELETE' })
                    .then(response => response.json())
                    .then(data => {
                        alert('HIVE가 삭제되었습니다.');
                        closeDeleteModal();
                        location.reload();
                    })
                    .catch(error => {
                        console.error('Error deleting HIVE:', error);
                        alert('HIVE 삭제에 실패했습니다.');
                    });

                closeDeleteModal();
                location.reload(); // 실제로는 테이블에서 해당 행을 제거하는 로직 필요
            }
        });
    }
});
