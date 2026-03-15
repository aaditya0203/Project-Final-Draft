import dns from 'dns';

console.log('Testing dns.resolveSrv...');
dns.resolveSrv('_mongodb._tcp.cluster0.4rrkabe.mongodb.net', (err, addresses) => {
    if (err) {
        console.error('SRV Error:', err);
    } else {
        console.log('SRV Success:', addresses);
    }
});
