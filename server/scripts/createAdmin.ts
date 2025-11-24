import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

async function createAdmin() {
    const username = process.argv[2] || 'admin';
    const password = process.argv[3] || 'admin123';

    try {
        const existingUser = await prisma.user.findUnique({
            where: { username },
        });

        if (existingUser) {
            console.log(`User ${username} already exists.`);
            process.exit(0);
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const user = await prisma.user.create({
            data: {
                username,
                passwordHash,
                role: 'admin'
            }
        });

        console.log(`Admin user created: ${user.username}`);
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin user:', error);
        process.exit(1);
    }
}

createAdmin();
