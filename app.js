const express = require('express');
const dotenv = require("dotenv");
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();
const app = express();
const router = express.Router();

app.use(express.json()); // Essential for parsing JSON from your frontend
app.use(express.urlencoded({ extended: true }));
app.use('/', router);

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

/* --- Helper Function for HTML --- */
const serveHTML = (fileName, subfolder = '') => (req, res) => {
    res.sendFile(path.join(__dirname, 'template', subfolder, fileName));
};

/* --- AUTH / LOGIN ROUTES --- */
router.get('/', serveHTML('Login Choice.html'));
router.get('/login-admin', serveHTML('Login Admin.html'));
router.get('/login-student', serveHTML('Login Student.html'));

/* --- ADMIN ROUTES (in /template/admin/) --- */
router.get('/admin/dashboard', serveHTML('Dashboard.html', 'admin'));
router.get('/admin/add-brand', serveHTML('Add Brand.html', 'admin'));
router.get('/admin/add-category', serveHTML('Add Category.html', 'admin'));
router.get('/admin/add-product', serveHTML('Add Product.html', 'admin'));
router.get('/admin/brand-control', serveHTML('Brand Control.html', 'admin'));
router.get('/admin/category-control', serveHTML('Category Control.html', 'admin'));
router.get('/admin/edit-brand', serveHTML('Edit Brand.html', 'admin'));
router.get('/admin/edit-category', serveHTML('Edit Category.html', 'admin'));
router.get('/admin/edit-product', serveHTML('Edit Product.html', 'admin'));
router.get('/admin/penalty', serveHTML('Penalty Page.html', 'admin'));
router.get('/admin/product-control', serveHTML('Product Control.html', 'admin'));
router.get('/admin/team', serveHTML('Team Page.html', 'admin'));

/* --- STUDENT ROUTES (in /template/student/) --- */
router.get('/student/dashboard', serveHTML('Dashboard.html', 'student'));
router.get('/student/cart', serveHTML('Cart Page.html', 'student'));
router.get('/student/justification', serveHTML('Justification Page.html', 'student'));
router.get('/student/product', serveHTML('Product Page.html', 'student'));
router.get('/student/profile', serveHTML('Profile.html', 'student'));
router.get('/student/rent', serveHTML('Rent.html', 'student'));
router.get('/student/search', serveHTML('Search.html', 'student'));
router.get('/student/search-results', serveHTML('Search Result.html', 'student'));
router.get('/student/team', serveHTML('Team Page.html', 'student'));

/* Server Start */
app.listen(process.env.PORT, () => {
    console.log(`Server listening on port: ${process.env.PORT}`);
    console.log(`Visit the website: http://localhost:${process.env.PORT}`);
});
