import ssim from 'ssim.js';

console.log('ssim import:', ssim);
console.log('ssim type:', typeof ssim);
if (typeof ssim === 'object') {
    console.log('ssim keys:', Object.keys(ssim));
}

try {
    const data1 = { data: new Uint8Array(100), width: 10, height: 10, channels: 1 };
    const data2 = { data: new Uint8Array(100), width: 10, height: 10, channels: 1 };

    if (typeof ssim === 'function') {
        const result = ssim(data1, data2);
        console.log('ssim() result:', result);
    } else if (ssim.default && typeof ssim.default === 'function') {
        const result = ssim.default(data1, data2);
        console.log('ssim.default() result:', result);
    } else {
        console.log('Cannot find ssim function');
    }
} catch (err) {
    console.error('Error:', err);
}
