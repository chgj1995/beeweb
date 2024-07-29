let chart_datas = [];
let chart_list = [];
// 옵션은 오브젝트 배열로 받기

// ================== 동적 차트 관리 ==================

// 새 차트 블록 추가 함수
function addChartBlock(selectedOptions = []) {
    const chartGrid = document.querySelector('.chart-grid');
    const chartBlock = document.createElement('div');
    chartBlock.className = 'chart-block';
    const checklistHTML = chart_datas.map(data => `
        <input type="checkbox" id="${data.device.id}" ${selectedOptions.includes(String(data.device.id)) ? 'checked' : ''} onchange="updateChart(this)">
        <label>[${data.device.type}] ${data.device.name}(${data.device.hive})</label>
            `).join('');

    chartBlock.innerHTML = `
                <div class="chart-header">
                    <div>
                        <button class="toggle-button" onclick="toggleChartDeviceChecklist(this)">►</button>
                        <span class="chart-title">New Chart</span>
                    </div>
                    <div>
                        <button class="delete-button" onclick="deleteChartBlock(this)">[-]</button>
                    </div>
                    <div class="chart-device-checklist">
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
        updateChart(chartBlock.querySelector('input'), false);
    }
}

// 차트 블록 삭제 함수
function deleteChartBlock(button) {
    button.closest('.chart-block').remove();
    updateURLParams();
}

// ================== 차트 아이템 관리 ==================

// 체크리스트 토글 함수
function toggleChartDeviceChecklist(button) {
    const checklist = button.closest('.chart-header').querySelector('.chart-device-checklist');
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
    const checklist = chartBlock.querySelector('.chart-device-checklist');
    const selectedIds = Array.from(checklist.querySelectorAll('input:checked')).map(cb => cb.id);
    
    const checklistHTML = chart_datas
        .filter(data => {
            let res = false;
            if(selectedType == 'In' || selectedType == 'Out') {
                res = data.device.type == 'In' || data.device.type == 'Out';
            }
            else if(selectedType == 'Temp' || selectedType == 'Humi') {
                res = data.device.type == 'Temp' || data.device.type == 'Humi';
            } else {
                res = data.device.type == selectedType;
            }
            return !selectedType || res;
        })
        .map(data => {
            const isChecked = selectedIds.includes(String(data.device.id)) ? 'checked' : '';
            return `
                <input type="checkbox" id="${data.device.id}" ${isChecked} onchange="updateChart(this)">
                <label>[${data.device.type}] ${data.device.name}(${data.device.hive_name})</label>
            `;
        })
        .join('');

    checklist.innerHTML = checklistHTML;
}

// 체크박스 상태에 따라 차트 업데이트하는 함수
function updateChart(checkbox, isNeedUpdateURL = true) {
    const chartBlock = checkbox.closest('.chart-block');
    const canvas = chartBlock.querySelector('canvas');
    const ctx = canvas.getContext('2d');

    const selectedOptions = Array.from(chartBlock.querySelectorAll('.chart-device-checklist input:checked')).map(cb => cb.id);
    const selectedTypes = Array.from(chartBlock.querySelectorAll('.chart-device-checklist input:checked')).map(cb => chart_datas.find(data => data.device.id == cb.id).device.type);

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
    
    if(isNeedUpdateURL) { updateURLParams(); }
}

// ================== URL 파라미터 관리 ==================

// URL 파라미터 업데이트 함수
function updateURLParams() {
    const params = new URLSearchParams(window.location.search);

    // Chart 파라미터 초기화
    for (const key of params.keys()) {
        if (key.startsWith('chart')) {
            params.delete(key);
        }
    }

    // 본문에서 chart 검색
    const chartBlocks = Array.from(document.querySelectorAll('.chart-block'));

    for (let i = 0; i < chartBlocks.length; i++) {
        const selectedOptions = Array.from(chartBlocks[i].querySelectorAll('.chart-device-checklist input:checked')).map(cb => cb.id);
        if (selectedOptions.length > 0) {
            console.log(`Chart ${i + 1}:`, selectedOptions);
            params.append(`chart${i + 1}`, selectedOptions.join(','));
        }
    }

    const newURL = window.location.pathname + '?' + params.toString();
    window.history.replaceState(null, '', newURL);
}

// URL 파라미터로부터 차트 렌더링 함수
async function fetchAndRenderCharts() {
    const urlSearchParams = new URLSearchParams(window.location.search);

    chart_list = [];

        // URL 파라미터로부터 chart_list 배열 생성
    for (const [key, value] of urlSearchParams.entries()) {
        if (key.startsWith('chart')) {
            const id = parseInt(key.replace('chart', ''), 10); // chart1 -> 1
            const selectedOptions = value.split(',').map(Number); // "2,3" -> [2, 3]
            chart_list.push({ id, value: selectedOptions });
        }
    }

    for (const chart of chart_list) {
        addChartBlock(chart.value);
    }
}

// ================== 이벤트 리스너 ==================
// 디바이스 로드 완료 시
document.addEventListener('dataUpdated', (event) => {
    console.log('dataLoaded:', event.detail);
    chart_datas = event.detail;

    // URL 파라미터로부터 차트 렌더링
    fetchAndRenderCharts();
});