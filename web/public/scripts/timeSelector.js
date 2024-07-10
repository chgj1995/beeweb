document.addEventListener("DOMContentLoaded", function() {
    // 페이지 로드 시 URL에서 시간 가져와 업데이트
    const urlParams = new URLSearchParams(window.location.search);
    const sTime = urlParams.get('sTime');
    const eTime = urlParams.get('eTime');
    
    if (sTime) {
      document.getElementById('startDate').value = convertToLocalDateTime(new Date(sTime));
    }
    if (eTime) {
      document.getElementById('endDate').value = convertToLocalDateTime(new Date(eTime));
    }
});

function updateUrlWithCustomPeriod() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (startDate && endDate) {
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('sTime', new Date(startDate).toISOString().split('.')[0] + 'Z');
        newUrl.searchParams.set('eTime', new Date(endDate).toISOString().split('.')[0] + 'Z');
        window.location.href = newUrl.toString(); // 페이지를 새로고침
    }
}

function setPreset(period) {
    const endDate = new Date();
    let startDate;
  
    switch (period) {
        case 'day':
            startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
            break;
        case 'week':
            startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case 'month':
            startDate = new Date(endDate.setMonth(endDate.getMonth() - 1));
            break;
    }
  
    document.getElementById('startDate').value = convertToLocalDateTime(startDate);
    document.getElementById('endDate').value = convertToLocalDateTime(endDate);
  
    // URL 업데이트 및 페이지 새로고침
    const newUrl = new URL(window.location);
    newUrl.searchParams.set('sTime', startDate.toISOString().split('.')[0] + 'Z');
    newUrl.searchParams.set('eTime', endDate.toISOString().split('.')[0] + 'Z');
    window.location.href = newUrl.toString(); // 페이지를 새로고침
}

// Helper function to format date-time for input fields
function convertToLocalDateTime(date) {
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
    return localISOTime;
}
