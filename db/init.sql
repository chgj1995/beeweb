CREATE DATABASE IF NOT EXISTS hive_data;

USE hive_data;

-- CHIRPSTACK_DATA 테이블 생성
CREATE TABLE IF NOT EXISTS chirpstack_data (
    entry_id INT(11) NOT NULL,
    group_id INT(11) NOT NULL,
    field1 VARCHAR(255) NULL DEFAULT NULL,
    field2 VARCHAR(255) NULL DEFAULT NULL,
    field3 VARCHAR(255) NULL DEFAULT NULL,
    field4 VARCHAR(255) NULL DEFAULT NULL,
    field5 VARCHAR(255) NULL DEFAULT NULL,
    field6 VARCHAR(255) NULL DEFAULT NULL,
    created_at DATETIME NULL DEFAULT NULL,
    PRIMARY KEY (entry_id, group_id) USING BTREE
);

-- INOUT_DATA 테이블 생성
CREATE TABLE IF NOT EXISTS inout_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id INT NOT NULL,
    in_field INT,
    out_field INT,
    time DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_device_time (device_id, time)
);

-- SENSOR_DATA 테이블 생성
CREATE TABLE IF NOT EXISTS sensor_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id INT NOT NULL,
    temp FLOAT,
    humi FLOAT,
    co2 FLOAT,
    weigh FLOAT,
    time DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_device_time (device_id, time)
);

-- CAMERA_DATA 테이블 생성
CREATE TABLE IF NOT EXISTS camera_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id INT NOT NULL,
    camera VARCHAR(255),
    time DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_device_time (device_id, time)
);

-- HIVES 테이블 생성
CREATE TABLE IF NOT EXISTS hives (
    id INT AUTO_INCREMENT PRIMARY KEY,
    area_id INT NOT NULL,
    name VARCHAR(255),
    UNIQUE KEY unique_hive (area_id, name)
);

-- AREAS 테이블 생성 및 초기 데이터 삽입
CREATE TABLE IF NOT EXISTS areas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255)
);

INSERT INTO areas (id, name) VALUES
    (1, '인천대'),
    (2, '안동대'),
    (3, '농과원')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- DEVICES 테이블 생성
CREATE TABLE IF NOT EXISTS devices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hive_id INT NOT NULL,
    type_id INT NOT NULL
);

-- DEVICE_TYPES 테이블 생성 및 초기 데이터 삽입
CREATE TABLE IF NOT EXISTS device_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255)
);

INSERT INTO device_types (id, name) VALUES
    (1, 'CAMERA'),
    (2, 'SENSOR'),
    (3, 'INOUT')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 제약조건 및 인덱스 설정
ALTER TABLE inout_data
    ADD CONSTRAINT fk_inout_device FOREIGN KEY (device_id) REFERENCES devices(id);

ALTER TABLE sensor_data
    ADD CONSTRAINT fk_sensor_device FOREIGN KEY (device_id) REFERENCES devices(id);

ALTER TABLE camera_data
    ADD CONSTRAINT fk_camera_device FOREIGN KEY (device_id) REFERENCES devices(id);

ALTER TABLE hives
    ADD CONSTRAINT fk_hives_area FOREIGN KEY (area_id) REFERENCES areas(id);

ALTER TABLE devices
    ADD CONSTRAINT fk_devices_hive FOREIGN KEY (hive_id) REFERENCES hives(id),
    ADD CONSTRAINT fk_devices_type FOREIGN KEY (type_id) REFERENCES device_types(id);
