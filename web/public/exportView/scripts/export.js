// 전역 변수 설정
let sTime;
let eTime;
// 폴링을 관리하기 위한 객체
const pollingJobs = {};

// 페이지 로드 시 작업 목록을 가져오고, 주기적인 폴링 설정
document.addEventListener('DOMContentLoaded', () => {
    loadJobs();
});

// '내보내기' 버튼 클릭 이벤트 리스너
document.getElementById('exportBtn').addEventListener('click', createExportJob);

// 시간 범위 업데이트 이벤트 리스너
document.addEventListener('timeRangeUpdated', (event) => {
    sTime = event.detail.sTime;
    eTime = event.detail.eTime;
    console.log(`시간 범위 업데이트: ${sTime} ~ ${eTime}`);
});

// 서버에서 모든 작업 목록을 가져와 테이블에 표시하는 함수
async function loadJobs() {
    try {
        const response = await fetch('/api/export/jobs');
        const jobs = await response.json();
        const tbody = document.getElementById('jobHistoryTable').querySelector('tbody');
        tbody.innerHTML = ''; // 기존 목록 초기화
        jobs.forEach(job => {
            addJobToTable(job);
            // 진행 중인 작업은 폴링 시작
            if (job.status === 'processing') {
                startPolling(job.jobId);
            }
        });
    } catch (error) {
        console.error('작업 목록 로딩 실패:', error);
    }
}

// 새로운 내보내기 작업을 생성하는 함수
async function createExportJob() {
    const selectedHiveIds = getSelectedHiveIds();
    if (selectedHiveIds.length === 0) {
        alert('하나 이상의 HIVE를 선택하세요.');
        return;
    }

    const dataTypes = getSelectedDataTypes();
    if (dataTypes.length === 0) {
        alert('하나 이상의 데이터 종류를 선택하세요.');
        return;
    }

    const params = {
        hiveIds: selectedHiveIds,
        sTime: sTime,
        eTime: eTime,
        dataTypes: dataTypes
    };

    try {
        const response = await fetch('/api/export', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });
        const newJob = await response.json();
        addJobToTable(newJob, true); // 테이블 상단에 새 작업 추가
        startPolling(newJob.jobId); // 새 작업에 대한 폴링 시작
    } catch (error) {
        console.error('내보내기 작업 생성 실패:', error);
    }
}

// 특정 작업의 상태를 폴링 시작
function startPolling(jobId) {
    if (pollingJobs[jobId]) return; // 이미 폴링 중이면 중복 실행 방지

    pollingJobs[jobId] = setInterval(async () => {
        try {
            const response = await fetch(`/api/export/status?jobId=${jobId}`);
            const job = await response.json();
            updateJobInTable(job);
            // 작업이 완료되거나 실패하면 폴링 중지
            if (job.status === 'completed' || job.status === 'failed') {
                stopPolling(jobId);
            }
        } catch (error) {
            console.error(`Job ${jobId} 상태 업데이트 실패:`, error);
            stopPolling(jobId); // 에러 발생 시 폴링 중지
        }
    }, 2000); // 2초마다 상태 업데이트
}

// 특정 작업의 상태 폴링 중지
function stopPolling(jobId) {
    if (pollingJobs[jobId]) {
        clearInterval(pollingJobs[jobId]);
        delete pollingJobs[jobId];
    }
}

// 작업 이력 테이블에 작업을 추가하거나 업데이트하는 함수
function addJobToTable(job, prepend = false) {
    const tbody = document.getElementById('jobHistoryTable').querySelector('tbody');
    const row = document.createElement('tr');
    row.setAttribute('data-job-id', job.jobId);
    row.innerHTML = `
        <td>${job.jobId}</td>
        <td class="status">${job.status}</td>
        <td class="progress">${job.progress}%</td>
        <td>${new Date(job.createdAt).toLocaleString()}</td>
        <td class="actions"></td>
    `;

    if (prepend) {
        tbody.prepend(row);
    } else {
        tbody.appendChild(row);
    }
    updateJobActions(job);
}

function updateJobInTable(job) {
    const row = document.querySelector(`#jobHistoryTable tr[data-job-id="${job.jobId}"]`);
    if (row) {
        row.querySelector('.status').textContent = job.status;
        row.querySelector('.progress').textContent = `${job.progress}%`;
        updateJobActions(job);
    }
}

// 작업 상태에 따라 다운로드/삭제 버튼을 업데이트하는 함수
function updateJobActions(job) {
    const row = document.querySelector(`#jobHistoryTable tr[data-job-id="${job.jobId}"]`);
    const actionsCell = row.querySelector('.actions');
    actionsCell.innerHTML = ''; // 기존 버튼 초기화

    if (job.status === 'completed') {
        const downloadBtn = document.createElement('button');
        downloadBtn.textContent = '다운로드';
        downloadBtn.onclick = () => window.location.href = `/api/export/download?jobId=${job.jobId}`;
        actionsCell.appendChild(downloadBtn);
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '삭제';
    deleteBtn.onclick = async () => {
        if (confirm(`Job ${job.jobId}를 삭제하시겠습니까?`)) {
            try {
                await fetch(`/api/export?jobId=${job.jobId}`, { method: 'DELETE' });
                row.remove();
                stopPolling(job.jobId);
            } catch (error) {
                console.error(`Job ${job.jobId} 삭제 실패:`, error);
            }
        }
    };
    actionsCell.appendChild(deleteBtn);
}

// 선택된 HIVE ID 목록을 반환하는 함수
function getSelectedHiveIds() {
    const checkboxes = document.querySelectorAll('#hiveTable .selectItem:checked');
    // 각 체크박스의 부모 <tr>에서 HIVE ID를 포함하는 두 번째 <td>의 텍스트를 추출
    return Array.from(checkboxes).map(cb => cb.closest('tr').children[1].textContent);
}


// 선택된 데이터 종류 목록을 반환하는 함수
function getSelectedDataTypes() {
    const checkboxes = document.querySelectorAll('.data-type-selector input:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}
