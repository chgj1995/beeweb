// 격자에 데이터를 동적으로 추가하는 함수
function loadPictures(pictures) {
    const gridContainer = document.getElementById('pictureGrid');
    gridContainer.innerHTML = "";  // 기존 데이터 초기화

    pictures.forEach(picture => {
        const gridItem = document.createElement('div');
        gridItem.classList.add('grid-item');

        const img = document.createElement('img');
        img.src = picture.url;

        const timestamp = document.createElement('div');
        timestamp.classList.add('timestamp');
        timestamp.innerText = picture.time;

        gridItem.appendChild(img);
        gridItem.appendChild(timestamp);

        gridContainer.appendChild(gridItem);
    });
}

// 이벤트 받아서 처리
document.addEventListener('dataUpdated', (event) => {
    console.log('dataUpdated:', event.detail);
    loadPictures(event.detail);
});