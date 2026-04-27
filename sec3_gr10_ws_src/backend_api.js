const express = require('express');
const dotenv = require("dotenv");
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require('cors');
const bcrypt = require('bcrypt');

dotenv.config();
const app = express();
const router = express.Router();

app.use(express.json()); // Essential for parsing JSON from your frontend
app.use(express.urlencoded({ extended: true }));
app.use('/', router);
app.use(cors()); 

let dbConn = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
});

dbConn.connect((err) => {
    if (err) throw err;
    console.log(`Connected to DB: ${process.env.MYSQL_DATABASE}`);
});

/* --- Gemini Configuration --- */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash-lite",
    systemInstruction: `
        You are the AI Assistant for ICT-RENTALS, a Mahidol University equipment rental system.
        Use the following app map to help users navigate:

        GENERAL:
        - / : The initial Login Choice page.
        - /login-admin and /login-student : Specific login portals.

        STUDENT FLOW:
        - Dashboard (/student/dashboard): Main hub to see available gear.
        - Search (/student/search): Find specific items.
        - Cart & Rent (/student/cart, /student/rent): Review and finalize rentals.
        - Profile (/student/profile): View personal account details and rental history.

        ADMIN FLOW:
        - Dashboard (/admin/dashboard): Admin overview.
        - Controls: Brand Control, Category Control, and Product Control are for managing the inventory list.
        - Management: Add Brand/Category/Product pages are for adding new stock.
        - Penalty (/admin/penalty): Manage student late returns or damages.

        When asked "How do I navigate?", identify if they are likely a student or admin and guide them to the correct route. 
        Keep answers concise and helpful.
    `
});

/* --- AI Helper Route --- */
// Use this to get AI assistance anywhere in your app
router.post('/api/ai-assist', async (req, res) => {
    try {
        const { prompt } = req.body;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        res.json({ success: true, text: response.text() });
    } catch (error) {
        console.error("Gemini Error:", error.message); // This prints the REAL error in your terminal
        res.status(500).json({ success: false, error: error.message });
    }
});

/* --- Auth / Login Route --- */
app.post('/api/login-admin', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ error: true, message: 'Please provide email and password.' });

    db.query('SELECT * FROM Administrators WHERE email = ?', [email], async (err, results) => {
        if (err) return res.status(500).json({ error: true, message: err.message });
        if (results.length === 0)
            return res.status(401).json({ error: true, message: 'Invalid email or password.' });

        const admin = results[0];
        const match = await bcrypt.compare(password, admin.password);
        if (!match)
            return res.status(401).json({ error: true, message: 'Invalid email or password.' });

        db.query(
            'INSERT INTO Admin_Activity_Logs (action_type, action_details, admin_id) VALUES (?, ?, ?)',
            ['Login', `Admin logged in: ${admin.email}`, admin.admin_id]
        );

        const { password: _, ...adminData } = admin;
        return res.json({ error: false, message: 'Login successful.', data: adminData });
    });
});

app.post('/api/login-student', (req, res) => {
    const { student_id, password } = req.body;
    if (!student_id || !password)
        return res.status(400).json({ error: true, message: 'Please provide student ID and password.' });

    db.query('SELECT * FROM Students WHERE student_id = ?', [student_id], async (err, results) => {
        if (err) return res.status(500).json({ error: true, message: err.message });
        if (results.length === 0)
            return res.status(401).json({ error: true, message: 'Invalid student ID or password.' });

        const student = results[0];
        const match = await bcrypt.compare(password, student.password);
        if (!match)
            return res.status(401).json({ error: true, message: 'Invalid student ID or password.' });

        const { password: _, ...studentData } = student;
        return res.json({ error: false, message: 'Login successful.', data: studentData });
    });
});

/* --- Admin Routes --- */

/* --- Student Routes --- */

app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});
