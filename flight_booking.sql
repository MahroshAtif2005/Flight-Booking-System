-- Create Database
CREATE DATABASE IF NOT EXISTS flight_booking;
USE flight_booking;

-- Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Flights Table
CREATE TABLE flights (
    id INT AUTO_INCREMENT PRIMARY KEY,
    flight_number VARCHAR(20) NOT NULL,
    airline VARCHAR(100) NOT NULL,
    departure_city VARCHAR(100) NOT NULL,
    arrival_city VARCHAR(100) NOT NULL,
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    available_seats INT DEFAULT 100
);

-- Bookings Table
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_reference VARCHAR(20) UNIQUE NOT NULL,
    user_id INT,
    flight_id INT NOT NULL,
    passenger_count INT DEFAULT 2,
    flight_class VARCHAR(50) NOT NULL,
    meal_passenger1 VARCHAR(50),
    meal_passenger2 VARCHAR(50),
    total_price DECIMAL(10, 2) NOT NULL,
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'confirmed',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE CASCADE
);

-- sample flights
INSERT INTO flights (flight_number, airline, departure_city, arrival_city, departure_time, arrival_time, price) VALUES
('BA101', 'British Airways', 'London', 'Dubai', '08:00:00', '18:30:00', 450.00),
('BA102', 'British Airways', 'Dubai', 'London', '22:00:00', '04:30:00', 420.00),
('EK203', 'Emirates', 'London', 'Dubai', '10:30:00', '21:00:00', 520.00),
('EK204', 'Emirates', 'Dubai', 'London', '03:00:00', '07:30:00', 500.00),
('QR305', 'Qatar Airways', 'London', 'Dubai', '14:00:00', '00:30:00', 480.00),
('QR306', 'Qatar Airways', 'Dubai', 'London', '08:30:00', '13:00:00', 460.00),
('BA111', 'British Airways', 'London', 'New York', '11:00:00', '14:00:00', 650.00),
('AA202', 'American Airlines', 'New York', 'London', '18:00:00', '06:00:00', 620.00),
('EK501', 'Emirates', 'Dubai', 'Paris', '09:00:00', '13:30:00', 380.00),
('AF402', 'Air France', 'Paris', 'Dubai', '15:30:00', '23:45:00', 400.00);

-- sample users
INSERT INTO users (email, password, name) VALUES
('cassidy73@gmail.com', '7YHU3', 'Cassidy Doe');
('damian768@gmail.com', 'WYrbV', 'Damian Miller');