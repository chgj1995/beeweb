### Honeybee REST API

이 문서는 Honeybee REST API에서 사용 가능한 엔드포인트와 예제 요청에 대해 설명합니다.

## 기본 URL

모든 API 엔드포인트의 기본 URL은 다음과 같습니다:
```
http://{{SERVER_IP}}/honeybee/api
```

## 엔드포인트

### 지역 벌집

#### 지역 벌집 조회
```
GET /areahive
```
- **설명**: 지역 벌집 목록을 조회합니다.
- **URL**: `{{SERVER_IP}}/honeybee/api/areahive`
- **메서드**: `GET`

### 장치

#### 장치 추가
```
POST /device
```
- **설명**: 새로운 장치를 추가합니다.
- **URL**: `{{SERVER_IP}}/honeybee/api/device`
- **메서드**: `POST`
- **요청 본문**:
    ```json
    {
      "hiveId": 2,
      "typeId": 1
    }
    ```

#### 장치 조회
```
GET /device?hiveId=3
```
- **설명**: 특정 벌집에 대한 장치를 조회합니다.
- **URL**: `{{SERVER_IP}}/honeybee/api/device?hiveId=3`
- **메서드**: `GET`

### 벌집

#### 벌집 추가
```
POST /hive
```
- **설명**: 새로운 벌집을 추가합니다.
- **URL**: `{{SERVER_IP}}/honeybee/api/hive`
- **메서드**: `POST`
- **요청 본문**:
    ```json
    {
      "areaId": 2,
      "name": "Hive 1"
    }
    ```

### 데이터

#### 출입 데이터 조회
```
GET /inout?deviceId=1&sTime=2024-05-09 13:15:11&eTime=2024-07-09 13:15:11
```
- **설명**: 특정 장치의 출입 데이터를 시간 범위 내에서 조회합니다.
- **URL**: `{{SERVER_IP}}/honeybee/api/inout?deviceId=1&sTime=2024-05-09 13:15:11&eTime=2024-07-09 13:15:11`
- **메서드**: `GET`

#### 센서 데이터 조회
```
GET /sensor?deviceId=11&sTime=2024-05-09 13:15:11&eTime=2024-07-09 13:15:11
```
- **설명**: 특정 장치의 센서 데이터를 시간 범위 내에서 조회합니다.
- **URL**: `{{SERVER_IP}}/honeybee/api/sensor?deviceId=11&sTime=2024-05-09 13:15:11&eTime=2024-07-09 13:15:11`
- **메서드**: `GET`

#### 카메라 데이터 조회
```
GET /camera?deviceId=7&sTime=2024-05-09 13:15:11&eTime=2024-07-09 13:15:11
```
- **설명**: 특정 장치의 카메라 데이터를 시간 범위 내에서 조회합니다.
- **URL**: `{{SERVER_IP}}/honeybee/api/camera?deviceId=7&sTime=2024-05-09 13:15:11&eTime=2024-07-09 13:15:11`
- **메서드**: `GET`

#### 출입 데이터 업로드
```
POST /upload
```
- **설명**: 출입 데이터를 업로드합니다.
- **URL**: `{{SERVER_IP}}/honeybee/api/upload`
- **메서드**: `POST`
- **요청 본문**:
    ```json
    {
      "type": 3,
      "data": [
        {
          "id": 1,
          "time": "2024-06-23 10:00:00",
          "inField": 10,
          "outField": 20
        },
        {
          "id": 2,
          "time": "2024-06-23 11:00:00",
          "inField": 15,
          "outField": 25
        }
      ]
    }
    ```

#### 출입 데이터 업링크
```
POST /uplink
```
- **설명**: 출입 데이터를 업링크합니다.
- **URL**: `{{SERVER_IP}}/honeybee/api/uplink`
- **메서드**: `POST`
- **요청 본문**:
    ```json
    {
      "id": 3,
      "type": 3,
      "inField": 10,
      "outField": 10
    }
    ```

#### 센서 데이터 업링크
```
POST /uplink
```
- **설명**: 센서 데이터를 업링크합니다.
- **URL**: `{{SERVER_IP}}/honeybee/api/uplink`
- **메서드**: `POST`
- **요청 본문**:
    ```json
    {
      "id": 11,
      "type": 2,
      "temp": 11,
      "humi": 12,
      "co2": 13,
      "weigh": 14
    }
    ```

#### 센서 데이터 업로드
```
POST /upload
```
- **설명**: 센서 데이터를 업로드합니다.
- **URL**: `{{SERVER_IP}}/honeybee/api/upload`
- **메서드**: `POST`
- **요청 본문**:
    ```json
    {
      "type": 2,
      "data": [
        {
          "id": 10,
          "time": "2024-06-23 10:00:00",
          "temp": 25.5,
          "humi": 60.0,
          "co2": 400,
          "weigh": 50.0
        },
        {
          "id": 11,
          "time": "2024-06-23 11:00:00",
          "temp": 26.0,
          "humi": 58.0,
          "co2": 410,
          "weigh": 51.0
        }
      ]
    }
    ```

---

## 환경 변수

- `SERVER_IP`: 서버의 IP 주소.

---
이 문서는 주요 엔드포인트를 다루며, POST 엔드포인트에 대한 예제 요청 본문을 제공합니다. 더 자세한 사용법과 추가 엔드포인트에 대한 내용은 전체 API 문서나 Postman 컬렉션 파일 honeybeeREST.json을 참조하십시오.