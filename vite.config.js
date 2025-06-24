import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    plugins: [
        tailwindcss(),
    ],
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        rollupOptions: {
            input: {
                main: './index.html',
                mypage: './mypage.html',
                reservation: './reservation.html',
                reservationInquiry: './reservationInquiry.html',
                contact_us: './contact_us.html'
            }
        }
    },
    server: {
        port: 3000,
        open: true
    }
})