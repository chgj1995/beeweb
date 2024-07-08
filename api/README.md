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
- **응답**:
  - **200 OK**:
    ```json
    [
      {
        "id": 1,
        "name": "Area 1",
        "hives": [
          {
            "id": 1,
            "name": "Hive 1"
          },
          {
            "id": 2,
            "name": "Hive 2"
          }
        ]
      },
      {
        "id": 2,
        "name": "Area 2",
        "hives": []
      }
    ]
    ```
  - **500 Internal Server Error**:
    ```json
    {
      "message": "Internal Server Error"
    }
    ```

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
- **응답**:
  - **201 Created**:
    ```json
    {
      "message": "Device added successfully",
      "deviceId": 5
    }
    ```
  - **400 Bad Request**:
    ```json
    {
      "message": "Bad Request: Missing required fields"
    }
    ```
  - **409 Conflict**:
    ```json
    {
      "message": "Device already exists",
      "deviceId": 3
    }
    ```
  - **500 Internal Server Error**:
    ```json
    {
      "message": "Internal Server Error"
    }
    ```

#### 장치 조회
```
GET /device?hiveId=3
```
- **설명**: 특정 벌집에 대한 장치 목록을 조회합니다.
- **URL**: `{{SERVER_IP}}/honeybee/api/device?hiveId=3`
- **메서드**: `GET`
- **응답**:
  - **200 OK**:
    ```json
    [
      {
        "id": 1,
        "type": 2
      },
      {
        "id": 2,
        "type": 1
      }
    ]
    ```
  - **400 Bad Request**:
    ```json
    {
      "message": "Bad Request: Missing hiveId"
    }
    ```
  - **500 Internal Server Error**:
    ```json
    {
      "message": "Internal Server Error"
    }
    ```

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
- **응답**:
  - **201 Created**:
    ```json
    {
      "message": "Hive added successfully",
      "hiveId": 3
    }
    ```
  - **400 Bad Request**:
    ```json
    {
      "message": "Bad Request: Missing required fields"
    }
    ```
  - **409 Conflict**:
    ```json
    {
      "message": "Hive already exists",
      "hiveId": 2
    }
    ```
  - **500 Internal Server Error**:
    ```json
    {
      "message": "Internal Server Error"
    }
    ```

### 데이터

#### 출입 데이터 조회
```
GET /inout?deviceId=1&sTime=2024-05-09T13:15:11Z&eTime=2024-07-09T13:15:11Z
```
- **설명**: 특정 장치의 출입 데이터를 지정된 시간 범위 내에서 조회합니다.
- **URL**: `{{SERVER_IP}}/honeybee/api/inout?deviceId=1&sTime=2024-05-09T13:15:11Z&eTime=2024-07-09T13:15:11Z`
- **메서드**: `GET`
- **응답**:
  - **200 OK**:
    ```json
    [
      {
        "id": 1,
        "in_field": 10,
        "out_field": 20,
        "time": "2024-06-23T10:00:00Z"
      },
      {
        "id": 2,
        "in_field": 15,
        "out_field": 25,
        "time": "2024-06-23T11:00:00Z"
      }
    ]
    ```
  - **400 Bad Request**:
    ```json
    {
      "message": "Bad Request: Missing required fields"
    }
    ```
  - **500 Internal Server Error**:
    ```json
    {
      "message": "Internal Server Error"
    }
    ```

#### 센서 데이터 조회
```
GET /sensor?deviceId=11&sTime=2024-05-09T13:15:11Z&eTime=2024-07-09T13:15:11Z
```
- **설명**: 특정 장치의 센서 데이터를 지정된 시간 범위 내에서 조회합니다.
- **URL**: `{{SERVER_IP}}/honeybee/api/sensor?deviceId=11&sTime=2024-05-09T13:15:11Z&eTime=2024-07-09T13:15:11Z`
- **메서드**: `GET`
- **응답**:
  - **200 OK**:
    ```json
    [
      {
        "id": 11,
        "temp": 25.5,
        "humi": 60.0,
        "co2": 400,
        "weigh": 50.0,
        "time": "2024-06-23T10:00:00Z"
      },
      {
        "id": 12,
        "temp": 26.0,
        "humi": 58.0,
        "co2": 410,
        "weigh": 51.0,
        "time": "2024-06-23T11:00:00Z"
      }
    ]
    ```
  - **400 Bad Request**:
    ```json
    {
      "message": "Bad Request: Missing required fields"
    }
    ```
  - **500 Internal Server Error**:
    ```json
    {
      "message": "Internal Server Error"
    }
    ```

#### 카메라 데이터 조회
```
GET /camera?deviceId=7&sTime=2024-05-09T13:15:11Z&eTime=2024-07-09T13:15:11Z
```
- **설명**: 특정 장치의 카메라 데이터를 지정된 시간 범위 내에서 조회합니다.
- **URL**: `{{SERVER_IP}}/honeybee/api/camera?deviceId=7&sTime=2024-05-09T13:15:11Z&eTime=2024-07-09T13:15:11Z`
- **메서드**: `GET`
- **응답**:
  - **200 OK**:
    ```json
    [
      {
        "id": 7,
        "picture": "base64encodedstring",
        "time": "2024-06-23T10:00:00Z"
      },
      {
        "id": 8,
        "picture": "base64encodedstring",
        "time": "2024-06-23T11:00:00Z"
      }
    ]
    ```
  - **400 Bad Request**:
    ```json
    {
      "message": "Bad Request: Missing required fields"
    }
    ```
  - **500 Internal Server Error**:
    ```json
    {
      "message": "Internal Server Error"
    }
    ```

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
- **응답**:
  - **201 Created**:
    ```json
    {
      "message": "Data inserted successfully"
    }
    ```
  - **400 Bad Request**:
    ```json
    {
      "message": "Bad Request: Missing required fields"
    }
    ```
  - **500 Internal Server Error**:
    ```json
    {
      "message": "Internal Server Error"
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
- **응답**:
  - **201 Created**:
    ```json
    {
      "message": "Data inserted successfully"
    }
    ```
  - **400 Bad Request**:
    ```json
    {
      "message": "Bad Request: Missing required fields"
    }
    ```
  - **500 Internal Server Error**:
    ```json
    {
      "message": "Internal Server Error"
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
- **응답**:
  - **201 Created**:
    ```json
    {
      "message": "Data inserted successfully"
    }
    ```
  - **400 Bad Request**:
    ```json
    {
      "message": "Bad Request: Missing required fields"
    }
    ```
  - **500 Internal Server Error**:
    ```json
    {
      "message": "Internal Server Error"
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
- **응답**:
  - **201 Created**:
    ```json
    {
      "message": "Data inserted successfully"
    }
    ```
  - **400 Bad Request**:
    ```json
    {
      "message": "Bad Request: Missing required fields"
    }
    ```
  - **500 Internal Server Error**:
    ```json
    {
      "message": "Internal Server Error"
    }
    ```

---

## 환경 변수

- `SERVER_IP`: 서버의 IP 주소.

---
이 문서는 주요 엔드포인트를 다루며, POST 엔드포인트에 대한 예제 요청 본문을 제공합니다. 더 자세한 사용법과 추가 엔드포인트에 대한 내용은 전체 API 문서나 Postman 컬렉션 파일 honeybeeREST.json을 참조하십시오.