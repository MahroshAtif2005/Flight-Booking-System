const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
app.use(express.static(path.join(__dirname)));  

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',           
    password: 'mahroshatif6791',           
    database: 'flight_booking'
});

//Connecting to Database
db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to MySQL Database');
});


//new user
app.post('/api/signup', (req, res) => {
    const { email, password, name } = req.body;

    //Validation
    if (!email || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email and password are required' 
        });
    }

    //Insert user into database
    const query = 'INSERT INTO users (email, password, name) VALUES (?, ?, ?)';
    db.query(query, [email, password, name || 'Guest'], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Email already exists' 
                });
            }
            return res.status(500).json({ 
                success: false, 
                message: 'Database error' 
            });
        }

        res.json({ 
            success: true, 
            message: 'User registered successfully',
            userId: result.insertId 
        });
    });
});

//Authenticate user
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email and password are required' 
        });
    }

    //Checking credentials
    const query = 'SELECT id, email, name FROM users WHERE email = ? AND password = ?';
    db.query(query, [email, password], (err, results) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Database error' 
            });
        }

        if (results.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Login successful',
            user: results[0]
        });
    });
});

// Get available flights
app.get('/api/flights', (req, res) => {
    const { from, to, date } = req.query;

    // Basic search 
    let query = 'SELECT * FROM flights WHERE 1=1';
    const params = [];

    if (from) {
        query += ' AND LOWER(departure_city) LIKE ?';
        params.push(`%${from.toLowerCase()}%`);
    }

    if (to) {
        query += ' AND LOWER(arrival_city) LIKE ?';
        params.push(`%${to.toLowerCase()}%`);
    }

    db.query(query, params, (err, results) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Database error' 
            });
        }

        res.json({ 
            success: true, 
            flights: results 
        });
    });
});

//Store booking details
app.post('/api/bookings', (req, res) => {
    const { 
        userId, 
        flightId, 
        flightClass, 
        meal1, 
        meal2, 
        totalPrice 
    } = req.body;

    // Validation
    if (!flightId || !flightClass || !totalPrice) {
        return res.status(400).json({ 
            success: false, 
            message: 'Missing required booking information' 
        });
    }

    //Generate booking reference
    const bookingRef = 'SKY' + Date.now().toString().slice(-8);

    const query = `
        INSERT INTO bookings 
        (booking_reference, user_id, flight_id, flight_class, meal_passenger1, meal_passenger2, total_price) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(query, [
        bookingRef, 
        userId || null, 
        flightId, 
        flightClass, 
        meal1, 
        meal2, 
        totalPrice
    ], (err, result) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Failed to save booking' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Booking saved successfully',
            bookingReference: bookingRef,
            bookingId: result.insertId
        });
    });
});

//Retrieve bookings for logged-in user
app.get('/api/bookings/:userId', (req, res) => {
    const userId = req.params.userId;

    const query = `
        SELECT 
            b.*, 
            f.flight_number, 
            f.airline, 
            f.departure_city, 
            f.arrival_city, 
            f.departure_time, 
            f.arrival_time
        FROM bookings b
        JOIN flights f ON b.flight_id = f.id
        WHERE b.user_id = ? AND b.status = 'confirmed'
        ORDER BY b.booking_date DESC
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Database error' 
            });
        }

        res.json({ 
            success: true, 
            bookings: results 
        });
    });
});

//Retrieving  specific booking
app.get('/api/booking/:reference', (req, res) => {
    const reference = req.params.reference;

    const query = `
        SELECT 
            b.*, 
            f.flight_number, 
            f.airline, 
            f.departure_city, 
            f.arrival_city, 
            f.departure_time, 
            f.arrival_time
        FROM bookings b
        JOIN flights f ON b.flight_id = f.id
        WHERE b.booking_reference = ?
    `;

    db.query(query, [reference], (err, results) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Database error' 
            });
        }

        if (results.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Booking not found' 
            });
        }

        res.json({ 
            success: true, 
            booking: results[0] 
        });
    });
});

// Delete booking
app.delete('/api/bookings/:reference', (req, res) => {
    const reference = req.params.reference;

    const query = 'UPDATE bookings SET status = ? WHERE booking_reference = ?';
    db.query(query, ['cancelled', reference], (err, result) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Failed to cancel booking' 
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Booking not found' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Booking cancelled successfully' 
        });
    });
});

//starting server 
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});