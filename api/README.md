## API 문서

### 기본 URL

```
http://localhost:8090
```

### API 엔드포인트

#### 지역 및 벌통 정보 조회

**엔드포인트:**

```
GET /api/areahive
```

**설명:**

지역과 해당 지역의 벌통 목록을 조회합니다.

**응답 예시:**

```json
[
  {
    "id": 1,
    "name": "인천대",
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
    "name": "안동대",
    "hives": [
      {
        "id": 3,
        "name": "Hive 3"
      }
    ]
  }
]
```

#### 입출 데이터 조회

**엔드포인트:**

```
GET /api/inout
```

**설명:**

특정 장치의 주어진 시간 범위 내의 입출 데이터를 조회합니다.

**파라미터:**

| 이름     | 타입   | 설명                        |
|----------|--------|-----------------------------|
| deviceID | Number | 장치 ID                     |
| sTime    | String | 시작 시간 (YYYY-MM-DD HH:MM:SS) |
| eTime    | String | 종료 시간 (YYYY-MM-DD HH:MM:SS) |

**요청 예시:**

```json
GET /api/inout?deviceID=1&sTime=2024-01-01%2000:00:00&eTime=2024-12-31%2023:59:59
```

**응답 예시:**

```json
[
  {
    "id": 1,
    "in_field": 10,
    "out_field": 20,
    "time": "2024-06-23 10:00:00"
  },
  {
    "id": 2,
    "in_field": 15,
    "out_field": 25,
    "time": "2024-06-23 11:00:00"
  }
]
```

#### 센서 데이터 조회

**엔드포인트:**

```
GET /api/sensor
```

**설명:**

특정 장치의 주어진 시간 범위 내의 센서 데이터를 조회합니다.

**파라미터:**

| 이름     | 타입   | 설명                        |
|----------|--------|-----------------------------|
| deviceID | Number | 장치 ID                     |
| sTime    | String | 시작 시간 (YYYY-MM-DD HH:MM:SS) |
| eTime    | String | 종료 시간 (YYYY-MM-DD HH:MM:SS) |

**요청 예시:**

```json
GET /api/sensor?deviceID=22&sTime=2024-01-01%2000:00:00&eTime=2024-12-31%2023:59:59
```

**응답 예시:**

```json
[
  {
    "id": 1,
    "temp": 25.5,
    "humi": 60.0,
    "co2": 400,
    "weigh": 50.0,
    "time": "2024-06-23 10:00:00"
  },
  {
    "id": 2,
    "temp": 26.0,
    "humi": 58.0,
    "co2": 410,
    "weigh": 51.0,
    "time": "2024-06-23 11:00:00"
  }
]
```

#### 업링크 데이터 전송

**엔드포인트:**

```
POST /api/uplink
```

**설명:**

특정 장치의 입출 데이터 또는 센서 데이터를 전송합니다. 데이터 타입은 `type` 필드에 의해 결정됩니다.

**요청 바디:**

INOUT 타입의 경우:

```json
{
  "id": 1,
  "type": 3,
  "inField": 10,
  "outField": 20
}
```

SENSOR 타입의 경우:

```json
{
  "id": 7,
  "type": 2,
  "temp": 10,
  "humi": 20,
  "co2": 30,
  "weigh": 40
}
```

**응답:**

- **성공:**

```json
{
  "message": "Data inserted successfully"
}
```

- **오류:**

```json
{
  "message": "Bad Request: Missing required fields"
}
```

또는

```json
{
  "message": "Internal Server Error"
}
```

#### 업로드 데이터 전송

**엔드포인트:**

```
POST /api/upload
```

**설명:**

여러 장치의 입출 데이터 또는 센서 데이터를 일괄 전송합니다. 데이터 타입은 `type` 필드에 의해 결정됩니다.

**요청 바디:**

INOUT 타입의 경우:

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

SENSOR 타입의 경우:

```json
{
  "type": 2,
  "data": [
    {
      "id": 7,
      "time": "2024-06-23 10:00:00",
      "temp": 25.5,
      "humi": 60.0,
      "co2": 400,
      "weigh": 50.0
    },
    {
      "id": 8,
      "time": "2024-06-23 11:00:00",
      "temp": 26.0,
      "humi": 58.0,
      "co2": 410,
      "weigh": 51.0
    }
  ]
}
```

**응답:**

- **성공:**

```json
{
  "message": "Data inserted successfully"
}
```

- **오류:**

```json
{
  "message": "Bad Request: Missing required fields or data"
}
```

또는

```json
{
  "message": "Internal Server Error"
}
```

#### 벌통 추가

**엔드포인트:**

```
POST /api/hive
```

**설명:**

새로운 벌통을 추가합니다.

**요청 바디:**

```json
{
  "areaId": 1,
  "name": "Hive 1"
}
```

**응답:**

- **성공:**

```json
{
  "message": "Hive added successfully",
  "hiveId": 4
}
```

- **중복된 경우:**

```json
{
  "message": "Hive already exists",
  "hiveId": 1
}
```

- **오류:**

```json
{
  "message": "Bad Request: Missing required fields"
}
```

또는

```json
{
  "message": "Internal Server Error"
}
```


#### 장치 조회

**엔드포인트:**

```
GET /api/device
```

**설명:**

특정 벌통의 모든 장치 목록을 조회합니다.

**파라미터:**

| 이름   | 타입   | 설명    |
|--------|--------|---------|
| hiveId | Number | 벌통 ID |

**요청 예시:**

```json
GET /api/device?hiveId=1
```

**응답 예시:**

- **성공:**

```json
[
  {
    "id": 1,
    "type": 2
  },
  {
    "id": 2,
    "type": 3
  }
]
```

- **오류:**

```json
{
  "message": "Bad Request: Missing hiveId"
}
```

또는

```json
{
  "message": "Internal Server Error"
}
```

#### 장치 추가

**엔드포인트:**

```
POST /api/device
```

**설명:**

새로운 장치를 추가합니다.

**요청 바디:**

```json
{
  "hiveId": 1,
  "typeId": 2
}
```

**응답:**

- **성공:**

```json
{
  "message": "Device added successfully",
  "deviceId": 5
}
```

- **중복된 경우:**

```json
{
  "message": "Device already exists",
  "deviceId": 1
}
```

- **오류:**

```json
{
  "message": "Bad Request: Missing required fields"
}
```

또는

```json
{
  "message": "Internal Server Error"
}
```