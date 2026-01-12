import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.constructify.app',
    appName: 'Constructify',
    webDir: 'dist',
    server: {
        androidScheme: 'https',
        // For development on physical device, uncomment and use your computer's IP:
        // url: 'http://YOUR_COMPUTER_IP:5173',
        // cleartext: true
    },
    plugins: {
        Camera: {
            saveToGallery: true,
            correctOrientation: true
        }
    }
};

export default config;
