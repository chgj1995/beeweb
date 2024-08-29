// 로그인 실패 시 서버로부터의 메시지를 표시하기 위한 스크립트
document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    if (error) {
        document.getElementById('error-message').textContent = 'Invalid credentials. Please try again.';
    }
});

document.getElementById('loginForm').addEventListener('submit', function (event) {
    event.preventDefault(); // 기본 폼 제출을 막습니다.

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // 비밀번호를 SHA-256으로 해시
    const hashedPassword = CryptoJS.SHA256(password).toString(CryptoJS.enc.Base64); // Base64로 인코딩
    // 해시된 비밀번호와 사용자 이름을 서버로 전송
    fetch('/honeybee/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: username, pw: hashedPassword })
    }).then(response => {
        if (response.ok) {
            console.log('Login successful');
            window.location.href = '/honeybee'; // 성공 시 메인 페이지로 이동
        } else {
            console.log('Login failed');
            window.location.href = '/honeybee/login?error=1'; // 실패 시 다시 로그인 페이지로 이동
        }
    }).catch(error => {
        console.error('Error:', error);
        document.getElementById('error-message').textContent = 'An error occurred. Please try again.';
    });
});