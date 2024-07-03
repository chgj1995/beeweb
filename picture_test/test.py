import requests

# 파일과 메타데이터 정보
files = {
    'file1': ('image1.jpg', open('./T3_ID7_F1.jpg', 'rb'), 'image/jpeg'),
    'file2': ('image2.jpg', open('./T3_ID8_F2.jpg', 'rb'), 'image/jpeg')
}

metadata = {
    'type': '1',
    'file1_id': '7',
    'file1_time': '2024-07-09T13:15:11',
    'file2_id': '8',
    'file2_time': '2024-07-09T13:15:12'
}

# 서버 URL
url = 'http://127.0.0.1/honeybee/api/upload'

# 멀티파트 폼 데이터 요청 보내기
response = requests.post(url, files={
    'file1': files['file1'],
    'file1_id': (None, metadata['file1_id']),
    'file1_time': (None, metadata['file1_time']),
    'file2': files['file2'],
    'file2_id': (None, metadata['file2_id']),
    'file2_time': (None, metadata['file2_time']),
}, data={
    'type': metadata['type']
})

# 응답 확인
print('Status code:', response.status_code)
print('Response body:', response.text)