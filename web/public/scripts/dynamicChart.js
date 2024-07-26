let chart_datas = [];
// 옵션은 오브젝트 배열로 받기

// ================== 동적 차트 관리 ==================

// 새 차트 블록 추가 함수
function addChartBlock(chartIndex, selectedOptions) {
    const chartGrid = document.querySelector('.chart-grid');
    const chartBlock = document.createElement('div');
    chartBlock.className = 'chart-block';
    chartBlock.id = `chart${chartIndex}`;
    const checklistHTML = chart_datas.map(data => `
                <input type="checkbox" id="${data.device.id}" onchange="updateChart(this)">
                <label>[${data.device.type}] ${data.device.name}(${data.device.hive_name})</label>
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
function updateChart(checkbox) {
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
    updateURLParams();
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
    for(const chart of chartBlocks) {
        const selectedOptions = Array.from(chart.querySelectorAll('.chart-device-checklist input:checked')).map(cb => cb.id);
        if(selectedOptions.length > 0) {
            params.append(chart.id, selectedOptions.join(','));
        }
    }


    // 기존 chart 파라미터 대체
    for (const [key, value] of urlSearchParams.entries()) {
        if (key.startsWith('chart')) {

            // 문서 에서 chart 검색
            const chartBlock = document.getElementById(key);
            if (!chartBlock) { // 없으면 삭제
                params.delete(key);
            }


            // chartBlock에 선택된 옵션들 획득
            const selectedOptions = Array.from(chartBlock.querySelectorAll('.chart-device-checklist input:checked')).map(cb => cb.id);



            if (!chartBlock) { // 없으면 삭제
                params.delete(key);
            } else { // 있으면 대체
                const selectedOptions = Array.from(chartBlock.querySelectorAll('.chart-device-checklist input:checked')).map(cb => cb.id);
                if (selectedOptions.length > 0) {
                    params.set(key, selectedOptions.join(','));
                } else {
                    params.delete(key);
                }
            }
        }
    }

    // 새로운 chart 파라미터 추가
    chartBlocks.forEach((block, index) => {
        const selectedOptions = Array.from(block.querySelectorAll('.chart-device-checklist input:checked')).map(cb => cb.id);
        if (selectedOptions.length > 0) {
            params.append(`${block.id}`, selectedOptions.join(','));
        }
    });

    const newURL = window.location.pathname + '?' + params.toString();
    window.history.replaceState(null, '', newURL);
}

// URL 파라미터로부터 차트 렌더링 함수
async function fetchAndRenderCharts() {
    const urlSearchParams = new URLSearchParams(window.location.search);

    for (const [key, value] of urlSearchParams.entries()) {
        if (key.startsWith('chart')) {

            // chartN에서 N값 획득
            const chartIndex = key.replace('chart', '');

            const selectedOptions = value.split(',');
            addChartBlock(chartIndex, selectedOptions);
            
            console.log(`Key: ${key}, Value: ${value}, Selected Options: ${selectedOptions}`);
        }
    }
}

// ================== 이벤트 리스너 ==================

document.addEventListener('DOMContentLoaded', () => {

    // // 차트 블록에 이벤트 리스너 추가
    // document.querySelectorAll('.chart-device-checklist input').forEach(checkbox => {
    //     checkbox.addEventListener('change', () => {
    //         updateChart(checkbox);
    // });
    // });
});

// ================== 차트에서 쓸 테스트용 이벤트 리스너 ==================
// 디바이스 로드 완료 시
document.addEventListener('dataUpdated', (event) => {
    console.log('dataLoaded:', event.detail);
    chart_datas = event.detail;

    // URL 파라미터로부터 차트 렌더링
    fetchAndRenderCharts();
});