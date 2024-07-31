let chart_datas = [];
let chart_list = [];
let chart_index = 0;
let chart_refs = [];
// 옵션은 오브젝트 배열로 받기

// ================== 동적 차트 관리 ==================

// 새 차트 블록 추가 함수
function addChartBlock(selectedOptions = []) {
    const chartGrid = document.querySelector('.chart-grid');
    const chartBlock = document.createElement('div');
    chartBlock.className = 'chart-block';
    chartBlock.id = `chart${chart_index++}`;
    console.log('Selected options:', selectedOptions);

    const checklistHTML = chart_datas.map(data => {
        const isChecked = selectedOptions.includes(String(data.device.id)) ? 'checked' : '';
        return `
            <input type="checkbox" id="${data.device.id}" ${isChecked} onchange="updateChart(this)">
            <label>[${data.device.type}] ${data.device.name}(${data.device.hive_name})</label>
        `;
    }).join('');

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
function deleteChartBlock(button, isNeedUpdateURL = true) {
    const chartBlock = button.closest('.chart-block');
    const id = chartBlock.id;

    // 차트 참조에서 제거 및 삭제
    const chartRefEntry = chart_refs.find(ref => ref.id === id);
    if (chartRefEntry) {
        chartRefEntry.value.destroy();
        chart_refs = chart_refs.filter(ref => ref.id !== id);
    }

    chartBlock.remove();
    if(isNeedUpdateURL) { updateURLParams(); }
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
function createChartWithDynamicPadding(chartRef, ctx, labels, datasets, minTime, maxTime, yMin, yMax) {
    console.log('chartRef1');
    console.log(chartRef);
    console.log(ctx);

    if (chartRef) {
        chartRef.destroy();
    }

    console.log('chartRef2');
    console.log(chartRef);
    console.log(ctx);

    console.log(`yMin: ${yMin}, yMax: ${yMax}`);

    function getTimeUnit(minTime, maxTime) {
        const timeDiff = (new Date(maxTime) - new Date(minTime)) / 1000; // 시간 차이 (초 단위)
      
        if (timeDiff <= 3600) { // 1시간 이하
          return 'minute';
        } else if (timeDiff <= 86400) { // 1일 이하
          return 'hour';
        } else {
          return 'day';
        }
      }

    const timeUnit = getTimeUnit(minTime, maxTime);

    chartRef = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            plugins: {
                tooltip: {
                    mode: 'index',
                    intersect: false
                },
                crosshair: {
                    line: {
                        color: '#F66',  // crosshair line color
                        width: 1        // crosshair line width
                    },
                    sync: {
                        enabled: true,            // enable trace line syncing with other charts
                        group: 2,                 // chart group
                        suppressTooltips: false   // suppress tooltips when showing a synced tracer
                    },
                    zoom: {
                        enabled: false                                      // enable zooming
                    },
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: timeUnit,
                        tooltipFormat: 'MM-dd_HH:mm',
                        displayFormats: {
                            minute: 'HH:mm',
                            hour: 'dd_HH',
                            day: 'MM-dd'
                        }
                    },
                    title: {
                        display: false,
                        text: 'Time'
                    },
                    ticks: {
                        source: 'auto',
                        autoSkip: false,
                        maxTicksLimit: 10,
                    },
                    min: minTime,
                    max: maxTime
                },
                y: {
                    min: yMin,
                    max: yMax,
                    ticks: {
                        callback: function(value) {
                            if (typeof value === 'number') {
                                return value.toFixed(1);
                            }
                            return value;
                        }
                    }
                }
            },
            responsive: true,
            maintainAspectRatio: false,
        }
    });

    console.log('chartRef3');
    console.log(chartRef);
    console.log(ctx);

    return chartRef;
}

// Helper function to get random color
function getRandomColor(alpha = 1) {
    const r = Math.floor(Math.random() * 255);
    const g = Math.floor(Math.random() * 255);
    const b = Math.floor(Math.random() * 255);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function initializeSlider(chartBlock, min, max, updateCallback) {
    const slider = chartBlock.querySelector('.y-axis-range');
    console.log('min:', min);
    console.log('max:', max);

    // 슬라이더가 이미 초기화되어 있는지 확인
    if (slider.noUiSlider) {
        slider.noUiSlider.updateOptions({
            range: {
                'min': min,
                'max': max
            },
            start: [min, max]
        });
    } else {
        noUiSlider.create(slider, {
            start: [min, max],
            connect: true,
            orientation: 'vertical', // 세로 슬라이더로 설정
            direction: 'rtl', // 슬라이더 방향을 반전
            range: {
                'min': min,
                'max': max
            },
            step: 1
        });

        slider.noUiSlider.on('update', function(values, handle) {
            // 반환된 값을 소수점 첫째 자리까지만 표시
            console.log(`Slider values: ${values}`);
            const roundedValues = values.map(value => parseFloat(value).toFixed(1));
            console.log(`Rounded values: ${roundedValues}`);
            updateCallback(roundedValues);
        });
    }
}

function getValueRangeFromDatas(datas) {
    let maxValue = 0;
    let minValue = 0;

    if (datas.length > 0) {
        const dataValues = datas.flatMap(dataItem => dataItem.data.map(d => d.value));
        console.log('dataValues1:', dataValues);
        if (dataValues.length > 0) {
            console.log('dataValues2:', dataValues);
            maxValue = Math.max(...dataValues);
            minValue = Math.min(...dataValues);
        }
    }

    console.log('maxValue:', maxValue);
    console.log('minValue:', minValue);
    return { minValue, maxValue };
}

function getTimeRangeFromURL() {
    const urlSearchParams = new URLSearchParams(window.location.search);
    let sTime = urlSearchParams.get('sTime');
    let eTime = urlSearchParams.get('eTime');
    
    if (!sTime || !eTime) {
        const now = new Date();
        const twoMonthAgo = new Date();
        twoMonthAgo.setMonth(now.getMonth() - 2);
      
        const defaultSTime = twoMonthAgo.toISOString().split('.')[0] + 'Z';
        const defaultETime = now.toISOString().split('.')[0] + 'Z';
        
        sTime = sTime || defaultSTime;
        eTime = eTime || defaultETime;
      }      
      const sTimeDate = new Date(sTime);
      const eTimeDate = new Date(eTime);

      console.log('sTime:', sTime);
      console.log('eTime:', eTime);
    return { sTimeDate, eTimeDate };
}

// 차트 업데이트를 위한 함수
function initializeChartData(chartBlock) {
    const options = getSelectedOptions(chartBlock);
    const datas = chart_datas.filter(data => options.includes(String(data.device.id)));
    const { minValue, maxValue } = getValueRangeFromDatas(datas);
    // updateChartData(chartBlock, minValue, maxValue);

    return { minValue, maxValue };
}

function updateChartData(chartBlock, minValue, maxValue) {
    const options = getSelectedOptions(chartBlock);
    const canvas = chartBlock.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const id = chartBlock.id;
    console.log('Updating chart with options:', options);

    const datas = chart_datas.filter(data => options.includes(String(data.device.id)));
    // 시간 획득
    const { sTimeDate, eTimeDate } = getTimeRangeFromURL();

    const datasets = datas.map(dataItem => ({
        label: `[${dataItem.device.type}] ${dataItem.device.name}(${dataItem.device.hive_name})`,
        data: dataItem.data.map(d => ({ x: new Date(d.time), y: d.value })),
        borderColor: getRandomColor(),
        backgroundColor: getRandomColor(0.2),
        fill: false,
        pointRadius: 0,
        borderWidth: 1
    }));

    let chartRefEntry = chart_refs.find(ref => ref.id === id);
    let chartRef = chartRefEntry?.value;

    const labels = datas.length > 0 ? datas[0].data.map(d => new Date(d.time)) : [];
    chartRef = createChartWithDynamicPadding(chartRef, ctx, labels, datasets, sTimeDate, eTimeDate, minValue, maxValue);
    if (chartRefEntry) {
        chartRefEntry.value = chartRef;
    } else {
        chart_refs.push({ id: id, value: chartRef });
    }
}

// chart-block 내의 checklist 목록을 얻는 함수
function getSelectedOptions(chartBlock) {
    return Array.from(chartBlock.querySelectorAll('.chart-device-checklist input:checked')).map(cb => cb.id);
}

// 체크박스 상태에 따라 차트 업데이트하는 함수
function updateChart(checkbox, isNeedUpdateURL = true) {
    const chartBlock = checkbox.closest('.chart-block');

    const selectedTypes = Array.from(chartBlock.querySelectorAll('.chart-device-checklist input:checked')).map(cb => chart_datas.find(data => data.device.id == cb.id).device.type);

    // 선택된 아이템이 있을 경우, 해당 유형만 체크리스트에 표시
    if (selectedTypes.length > 0) {
        updateChecklist(chartBlock, selectedTypes[0]);
    } else {
        updateChecklist(chartBlock, null);
    }

    const { minValue, maxValue } = initializeChartData(chartBlock);
    initializeSlider(chartBlock, minValue, maxValue, (newMinValue, newMaxValue) => {
        updateChartData(chartBlock, newMinValue, newMaxValue);
    });

    if(isNeedUpdateURL) { updateURLParams(); }
}

// ================== URL 파라미터 관리 ==================

// URL 파라미터 업데이트 함수
function updateURLParams() {
    const params = new URLSearchParams(window.location.search);

    let chart_list = [];

    // 본문에서 chart 검색
    const chartBlocks = Array.from(document.querySelectorAll('.chart-block'));

    // chart로부터 chart_list 배열 생성
    for (let i = 0; i < chartBlocks.length; i++) {
        const selectedOptions = Array.from(chartBlocks[i].querySelectorAll('.chart-device-checklist input:checked')).map(cb => cb.id);
        if (selectedOptions.length > 0) {
            const id = i;
            chart_list.push({ id, value: selectedOptions });
        }
    }

    // Chart 파라미터 초기화
    for (const key of params.keys()) {
        if (key.startsWith('chart')) {
            params.delete(key);
        }
    }

    // chart_list 배열을 URL 파라미터로 변환
    for (const chart of chart_list) {
        params.set(`chart${chart.id}`, chart.value.join(','));
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
            const selectedOptions = value.split(','); // "2,3" -> ["2", "3"]
            chart_list.push({ id, value: selectedOptions });
        }
    }

    // 기존 차트 전부 삭제
    const chartBlocks = Array.from(document.querySelectorAll('.chart-block'));
    chartBlocks.forEach(chartBlock => {
        deleteChartBlock(chartBlock.querySelector('.delete-button'), false);
    });

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