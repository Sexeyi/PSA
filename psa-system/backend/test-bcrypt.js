const bcrypt = require('bcryptjs');

async function testBcrypt() {
    try {
        console.log('Testing bcrypt...');
        const salt = await bcrypt.genSalt(10);
        console.log('Salt generated:', salt);

        const hash = await bcrypt.hash('password123', salt);
        console.log('Hash generated:', hash);

        const compare = await bcrypt.compare('password123', hash);
        console.log('Compare result:', compare);

        console.log('✅ bcrypt is working!');
    } catch (error) {
        console.error('❌ bcrypt error:', error);
    }
}

testBcrypt();