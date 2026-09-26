import multicastDNS from 'multicast-dns';

const MDNS_TIMEOUT = 5000;

export function discoverMDNS(timeout = MDNS_TIMEOUT) {
  return new Promise((resolve) => {
    const devices = [];
    const mdns = multicastDNS();
    const timer = setTimeout(() => {
      mdns.destroy();
      resolve(devices);
    }, timeout);

    mdns.on('response', (response) => {
      for (const answer of response.answers) {
        const name = (answer.name || '').toLowerCase();
        const type = answer.type;

        // Android TV Remote v2
        if (name.includes('_androidtvremote2._tcp') && type === 'PTR') {
          const target = answer.data;
          // Ищем SRV-запись для этого target
          const srv = response.additionals.find(
            (r) => r.type === 'SRV' && r.name.toLowerCase() === target.toLowerCase()
          );
          const aRecord = response.additionals.find(
            (r) => r.type === 'A' && srv && r.name.toLowerCase() === srv.data.target.toLowerCase()
          );

          if (aRecord) {
            const ip = aRecord.data;
            if (!devices.find((d) => d.ip === ip)) {
              devices.push({
                id: `androidtv_${ip.replace(/\./g, '_')}`,
                name: 'Android TV',
                brand: 'androidtv',
                ip,
                model: '',
                protocol: 'atvremote2',
                port: srv.data.port || 6467
              });
            }
          }
        }

        // Google Cast (для Google TV)
        if (name.includes('_googlecast._tcp') && type === 'PTR') {
          const target = answer.data;
          const aRecord = response.additionals.find(
            (r) => r.type === 'A' && r.name.toLowerCase() === target.toLowerCase()
          );
          if (aRecord) {
            const ip = aRecord.data;
            if (!devices.find((d) => d.ip === ip)) {
              devices.push({
                id: `googletv_${ip.replace(/\./g, '_')}`,
                name: 'Google TV',
                brand: 'googletv',
                ip,
                model: '',
                protocol: 'cast',
                port: 8009
              });
            }
          }
        }
      }
    });

    mdns.query([
      { name: '_androidtvremote2._tcp.local', type: 'PTR' },
      { name: '_googlecast._tcp.local', type: 'PTR' }
    ]);
  });
}
