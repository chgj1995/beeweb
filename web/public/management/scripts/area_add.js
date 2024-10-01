// public/js/area_add.js
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const hiveId = urlParams.get('hive_id');

    const title = document.getElementById('areaAddTitle');
    const addButton = document.getElementById('addAreaButton');

    // if (hiveId) {
    //     title.textContent = 'AREA 수정';
        
    //     // 예시 데이터
    //     document.getElementById('areaName').value = 'Example Area';
    // }

    const form = document.getElementById('areaAddForm');

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const areaName = document.getElementById('areaName').value.trim();

        if (areaName === '') {
            alert('지역 이름을 입력해주세요.');
            return;
        }

        // API 호출 로직 (예시)
        // fetch('/api/areas', { method: 'POST', body: JSON.stringify({ name: areaName }) })
        //     .then(response => response.json())
        //     .then(data => {
        //         alert('AREA가 추가되었습니다.');
        //         window.location.href = 'hive_list.html';
        //     })
        //     .catch(error => {
        //         console.error('Error adding AREA:', error);
        //         alert('AREA 추가에 실패했습니다.');
        //     });

        // 데이터 처리 부분을 제외하고 UI 동작만 구현
        alert('AREA추가에 실패했습니다.');
        window.location.href = 'hive_list.html';
    });
});
