// public/js/modal.js
document.addEventListener('DOMContentLoaded', () => {
    fetch('components/modal.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('modal').innerHTML = data;

            // 모달 제어
            const modal = document.getElementById('deleteModal');
            const closeButton = document.querySelector('.close-button');
            const cancelButton = document.getElementById('cancelDelete');
            const confirmButton = document.getElementById('confirmDelete');

            closeButton.addEventListener('click', () => {
                modal.style.display = 'none';
            });

            cancelButton.addEventListener('click', () => {
                modal.style.display = 'none';
            });

            // 전역 함수 설정
            window.showDeleteModal = () => {
                modal.style.display = 'block';
            };

            window.closeDeleteModal = () => {
                modal.style.display = 'none';
            };

            // 커스텀 이벤트 발생 - 모달이 로드되었음을 알림
            document.dispatchEvent(new Event('modalLoaded'));
        })
        .catch(error => console.error('Error loading modal:', error));
});
