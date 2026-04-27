// hashed password for testing
const bcrypt = require('bcrypt');
                   
async function GenerateHashes() {
    const passwords = ['admin1', 'admin2', 'admin3', 'admin4', 'admin5',
                   'admin6', 'admin7', 'admin8', 'admin9', 'admin10',
                   'student1', 'student2', 'student3', 'student4', 'student5',
                   'student6', 'student7', 'student8', 'student9', 'student10'];

    for (const pw of passwords) {
        const hash = await bcrypt.hash(pw, 10);
        console.log(`${pw} → ${hash}`);
    }
}

GenerateHashes();