// 옵션은 오브젝트 배열로 받기
const datas = [
    {device: {id: 1, name: 'device 1', type: 'I/O', hive: 'hive1'}, data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]},
    {device: {id: 2, name: 'device 2', type: 'I/O', hive: 'hive2'}, data: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]},
    {device: {id: 3, name: 'device 3', type: 'TEMP', hive: 'hive1'}, data: [5, 6, 7, 8, 9, 10, 1, 2, 3, 4]},
    {device: {id: 4, name: 'device 4', type: 'TEMP', hive: 'hive2'}, data: [4, 3, 2, 1, 10, 9, 8, 7, 6, 5]},
    {device: {id: 5, name: 'device 5', type: 'HUMI', hive: 'hive1'}, data: [9, 8, 7, 6, 5, 4, 3, 2, 1, 10]},
    {device: {id: 6, name: 'device 6', type: 'HUMI', hive: 'hive2'}, data: [6, 7, 8, 9, 10, 1, 2, 3, 4, 5]}
];

// ================== 동적 차트 관리 ==================

// 새 차트 블록 추가 함수
function addChartBlock(selectedOptions = []) {
    const chartGrid = document.querySelector('.chart-grid');
    const chartBlock = document.createElement('div');
    chartBlock.className = 'chart-block';

    const checklistHTML = datas.map(data => `
                <input type="checkbox" id="${data.device.id}" ${selectedOptions.includes(String(data.device.id)) ? 'checked' : ''} onchange="updateChart(this)">
                <label>[${data.device.type}] ${data.device.name}(${data.device.hive})</label>
            `).join('');

    chartBlock.innerHTML = `
                <div class="chart-header">
                    <div>
                        <button class="toggle-button" onclick="toggleChecklist(this)">►</button>
                        <span class="chart-title">New Chart</span>
                    </div>
                    <div>
                        <button class="delete-button" onclick="deleteChartBlock(this)">[-]</button>
                    </div>
                    <div class="checklist">
                        ${checklistHTML}
                    </div>
                </div>
                <div class="chart-body">
                    <div class="slider-container">
                        <label for="y-axis-range">Y</label>
                        <div class="y-axis-range"></div>
                    </div>
                    <div class="chart-container">
                        <canvas></canvas>
                    </div>
                </div>
            `;
    chartGrid.appendChild(chartBlock);

    // 초기 선택된 옵션에 따라 차트 업데이트
    if (selectedOptions.length > 0) {
        updateChart(chartBlock.querySelector('input'));
    }
}

// 차트 블록 삭제 함수
function deleteChartBlock(button) {
    button.closest('.chart-block').remove();
    updateURLParams();
}

// ================== 차트 아이템 관리 ==================

// 체크리스트 토글 함수
function toggleChecklist(button) {
    const checklist = button.closest('.chart-header').querySelector('.checklist');
    if (checklist) {
        if (checklist.style.display === 'none' || checklist.style.display === '') {
            checklist.style.display = 'block';
            button.textContent = '▼';
        } else {
            checklist.style.display = 'none';
            button.textContent = '►';
        }
    }
}

// 체크리스트 상태에 따라 체크리스트 업데이트하는 함수
function updateChecklist(chartBlock, selectedType) {
    const checklist = chartBlock.querySelector('.checklist');
    const selectedIds = Array.from(checklist.querySelectorAll('input:checked')).map(cb => cb.id);

    const checklistHTML = datas
        .filter(data => !selectedType || data.device.type === selectedType)
        .map(data => `
            <input type="checkbox" id="${data.device.id}" ${selectedIds.includes(String(data.device.id)) ? 'checked' : ''} onchange="updateChart(this)">
            <label>[${data.device.type}] ${data.device.name}(${data.device.hive})</label>
        `).join('');

    checklist.innerHTML = checklistHTML;
}

// 체크박스 상태에 따라 차트 업데이트하는 함수
function updateChart(checkbox) {
    const chartBlock = checkbox.closest('.chart-block');
    const canvas = chartBlock.querySelector('canvas');
    const ctx = canvas.getContext('2d');

    const selectedOptions = Array.from(chartBlock.querySelectorAll('.checklist input:checked')).map(cb => cb.id);
    const selectedTypes = Array.from(chartBlock.querySelectorAll('.checklist input:checked')).map(cb => datas.find(data => data.device.id == cb.id).device.type);

    // 선택된 아이템이 있을 경우, 해당 유형만 체크리스트에 표시
    if (selectedTypes.length > 0) {
        updateChecklist(chartBlock, selectedTypes[0]);
    } else {
        updateChecklist(chartBlock, null);
    }

    // 차트 업데이트를 위한 예시 함수 - 실제 차트 업데이트 로직으로 대체 필요
    const updateChartData = (ctx, options) => {
        console.log('Updating chart with options:', options);
        // 예시 업데이트 - 실제 차트 업데이트 코드로 대체 필요
        // new Chart(ctx, {...});
    };

    updateChartData(ctx, selectedOptions);
    updateURLParams();
}

// ================== URL 파라미터 관리 ==================

// URL 파라미터 업데이트 함수
function updateURLParams() {
    const chartBlocks = document.querySelectorAll('.chart-block');
    const params = [];

    chartBlocks.forEach((block, index) => {
        const selectedOptions = Array.from(block.querySelectorAll('.checklist input:checked')).map(cb => cb.id);
        if (selectedOptions.length > 0) {
            params.push(`chart${index + 1}=${selectedOptions.join(',')}`);
        }
    });

    const newURL = window.location.pathname + '?' + params.join('&');
    window.history.replaceState(null, '', newURL);
}

// URL 파라미터로부터 차트 렌더링 함수
async function fetchAndRenderCharts(urlParams) {
    const urlSearchParams = new URLSearchParams(urlParams);

    for (const [key, value] of urlSearchParams.entries()) {
        if (key.startsWith('chart')) {
            const selectedOptions = value.split(',');
            addChartBlock(selectedOptions);
        }
    }
}

// ================== 이벤트 리스너 ==================

document.addEventListener('DOMContentLoaded', () => {
    // 페이지 로드 시 URL 파라미터로부터 차트 렌더링
    fetchAndRenderCharts(window.location.search);

    // 차트 블록에 이벤트 리스너 추가
    document.querySelectorAll('.checklist input').forEach(checkbox => {
        checkbox.addEventListener('change', () => updateChart(checkbox));
    });
});
