# Honeybee REST API README

## 소개

이 문서는 Honeybee REST API 사용에 대한 종합적인 가이드를 제공합니다. API를 사용하여 사용자는 지역, 벌통, 장치 및 꿀벌 활동과 관련된 데이터를 관리할 수 있습니다. 이 README에는 각 엔드포인트에 대한 쿼리 예제와 응답 예제가 포함되어 있습니다.

## 기본 URL

```
{{SERVER_IP}}/honeybee/api
```

`{{SERVER_IP}}`를 실제 서버 IP 주소로 대체하십시오.

## 엔드포인트

### 1. 지역 및 벌통

#### 지역 및 벌통 정보 가져오기

**엔드포인트:** `/areahive`  
**메소드:** `GET`

**요청 예제:**
```http
GET {{SERVER_IP}}/honeybee/api/areahive
```

**응답 예제:**
```json
[
    {
        "areaId": 1,
        "areaName": "Area 1",
        "hives": [
            {
                "hiveId": 1,
                "hiveName": "Hive 1"
            },
            {
                "hiveId": 2,
                "hiveName": "Hive 2"
            }
        ]
    }
]
```

### 2. 장치

#### 장치 추가

**엔드포인트:** `/device`  
**메소드:** `POST`

**요청 예제:**
```http
POST {{SERVER_IP}}/honeybee/api/device
Content-Type: application/json

{
  "hiveId": 2,
  "typeId": 1
}
```

**응답 예제:**
```json
{
    "message": "Device added successfully",
    "deviceId": 10
}
```

#### 장치 정보 가져오기

**엔드포인트:** `/device`  
**메소드:** `GET`

**요청 예제:**
```http
GET {{SERVER_IP}}/honeybee/api/device?hiveId=3
```

**응답 예제:**
```json
[
    {
        "deviceId": 1,
        "hiveId": 3,
        "typeId": 1,
        "typeName": "CAMERA"
    }
]
```

#### 장치 삭제

**엔드포인트:** `/device`  
**메소드:** `DELETE`

**요청 예제:**
```http
DELETE {{SERVER_IP}}/honeybee/api/device?deviceId=25
```

**응답 예제:**
```json
{
    "message": "Device deleted successfully",
    "deviceId": 25
}
```

### 3. 데이터

#### 카메라 데이터 가져오기

**엔드포인트:** `/camera`  
**메소드:** `GET`

**요청 예제:**
```http
GET {{SERVER_IP}}/honeybee/api/camera?deviceId=7&sTime=2024-05-09T13:15:11Z&eTime=2024-07-09T13:15:11Z
```

**응답 예제:**
```json
[
    {
        "deviceId": 7,
        "time": "2024-06-10T10:00:00Z",
        "picture": "base64encodedstring"
    }
]
```

#### InOut 데이터 가져오기

**엔드포인트:** `/inout`  
**메소드:** `GET`

**요청 예제:**
```http
GET {{SERVER_IP}}/honeybee/api/inout?deviceId=1&sTime=2024-05-09T13:15:11Z&eTime=2024-07-09T13:15:11Z
```

**응답 예제:**
```json
[
    {
        "deviceId": 1,
        "time": "2024-06-10T10:00:00Z",
        "inField": 10,
        "outField": 20
    }
]
```

#### 센서 데이터 가져오기

**엔드포인트:** `/sensor`  
**메소드:** `GET`

**요청 예제:**
```http
GET {{SERVER_IP}}/honeybee/api/sensor?deviceId=24&sTime=2024-05-09T13:15:11Z&eTime=2024-07-09T13:15:11Z
```

**응답 예제:**
```json
[
    {
        "deviceId": 24,
        "time": "2024-06-10T10:00:00Z",
        "temp": 25.5,
        "humi": 60.0,
        "co2": 400,
        "weigh": 50.0
    }
]
```

#### 데이터 업링크

**엔드포인트:** `/uplink`  
**메소드:** `POST`

**요청 예제 (센서 데이터):**
```http
POST {{SERVER_IP}}/honeybee/api/uplink
Content-Type: application/json

{
  "id": 11,
  "type": 2,
  "temp": 11,
  "humi": 12,
  "co2": 13,
  "weigh": 14
}
```

**응답 예제:**
```json
{
    "message": "Data inserted successfully"
}
```

**요청 예제 (InOut 데이터):**
```http
POST {{SERVER_IP}}/honeybee/api/uplink
Content-Type: application/json

{
  "id": 2,
  "type": 3,
  "inField": 10,
  "outField": 10
}
```

**응답 예제:**
```json
{
    "message": "Data inserted successfully"
}
```

#### 데이터 업로드

**엔드포인트:** `/upload`  
**메소드:** `POST`

**요청 예제 (센서 데이터):**
```http
POST {{SERVER_IP}}/honeybee/api/upload
Content-Type: application/json

{
  "type": 2,
  "data": [
    {
      "id": 10,
      "time": "2024-06-23T10:00:00Z",
      "temp": 25.5,
      "humi": 60.0,
      "co2": 400,
      "weigh": 50.0
    },
    {
      "id": 11,
      "time": "2024-06-23T11:00:00Z",
      "temp": 26.0,
      "humi": 58.0,
      "co2": 410,
      "weigh": 51.0
    }
  ]
}
```

**응답 예제:**
```json
{
    "message": "Data inserted successfully"
}
```

**요청 예제 (InOut 데이터):**
```http
POST {{SERVER_IP}}/honeybee/api/upload
Content-Type: application/json

{
  "type": 3,
  "data": [
    {
      "id": 1,
      "time": "2024-06-23T10:00:00Z",
      "inField": 10,
      "outField": 20
    },
    {
      "id": 2,
      "time": "2024-06-23T11:00:00Z",
      "inField": 15,
      "outField": 25
    }
  ]
}
```

**응답 예제:**
```json
{
    "message": "Data inserted successfully"
}
```

### 4. 벌통

#### 벌통 추가

**엔드포인트:** `/hive`  
**메소드:** `POST`

**요청 예제:**
```http
POST {{SERVER_IP}}/honeybee/api/hive
Content-Type: application/json

{
  "areaId": 2,
  "name": "Hive 1"
}
```

**응답 예제:**
```json
{
    "message": "Hive added successfully",
    "hiveId": 10
}
```

#### 벌통 정보 가져오기

**엔드포인트:** `/hive`  
**메소드:** `GET`

**요청 예제:**
```http
GET {{SERVER_IP}}/honeybee/api/hive?areaId=3
```

**응답 예제:**
```json
[
    {
        "hiveId": 1,
        "areaId": 3,
        "hiveName": "Hive 1"
    }
]
```

#### 벌통 삭제

**엔드포인트:** `/hive`  
**메소드:** `DELETE`

**요청 예제:**
```http
DELETE {{SERVER_IP}}/honeybee/api/hive?hiveId=21
```

**응답 예제:**
```json
{
    "message": "Hive deleted successfully",
    "hiveId": 21
}
```

## 오류 처리

API는 다음과 같은 오류 코드를 반환합니다:

- `400 Bad Request`: 누락되거나 잘못된 요청 매개변수.
- `404 Not Found`: 리소스를 찾을 수 없음.
- `409 Conflict`: 리소스가 이미 존재함.
- `500 Internal Server Error`: 서버 오류.

## 결론

이 README는 Honeybee REST API와 상호 작용하는 데 필요한 정보를 제공하며, 추가 정보는 Postman Collection honeybeeREST.json을 참고하세요