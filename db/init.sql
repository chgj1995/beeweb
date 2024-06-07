-- init.sql
CREATE DATABASE IF NOT EXISTS thingspeak_data;

USE thingspeak_data;

CREATE TABLE IF NOT EXISTS data (
    entry_id INT PRIMARY KEY,
    field1 VARCHAR(255),
    field2 VARCHAR(255),
    field3 VARCHAR(255),
    field4 VARCHAR(255),
    field5 VARCHAR(255),
    field6 VARCHAR(255),
    created_at DATETIME
);
