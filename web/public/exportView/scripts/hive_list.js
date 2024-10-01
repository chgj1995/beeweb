// script/hive_list.js
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