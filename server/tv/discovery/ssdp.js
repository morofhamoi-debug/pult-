import { Client } from 'node-ssdp';

const SSDP_TIMEOUT = 5000;

export function discoverSSDP(timeout = SSDP_TIMEOUT) {
  return new Promise((resolve) => {
    const devices = [];
    const client = new Client();
    const timer = setTimeout(() => {
      client.stop();
      resolve(devices);
    }, timeout);

    client.on('response', (headers, statusCode, rinfo) => {
      const ip = rinfo.address;
      const usn = headers.USN || '';
      const server = headers.SERVER || '';
      const location = headers.LOCATION || '';

      // Фильтруем только ТВ
      const isTV =
        server.toLowerCase().includes('samsung') ||
        server.toLowerCase().includes('lg') ||
        usn.toLowerCase().includes('samsung') ||
        usn.toLowerCase().includes('lg') ||
        location.toLowerCase().includes('tv') ||
        usn.toLowerCase().includes('mediarenderer');

      if (!isTV) return;
      if (devices.find((d) => d.ip === ip)) return;

      let brand = 'generic';
      let name = `TV (${ip})`;

      if (server.toLowerCase().includes('samsung') || usn.toLowerCase().includes('samsung')) {
        brand = 'samsung';
        name = 'Samsung TV';
      } else if (server.toLowerCase().includes('lg') || usn.toLowerCase().includes('lg')) {
        brand = 'lg';
        name = 'LG TV';
      } else if (server.toLowerCase().includes('sony')) {
        brand = 'sony';
        name = 'Sony TV';
      } else if (server.toLowerCase().includes('philips')) {
        brand = 'philips';
        name = 'Philips TV';
      }

      devices.push({
        id: `${brand}_${ip.replace(/\./g, '_')}`,
        name,
        brand,
        ip,
        model: headers.MODEL || headers.MODELNAME || '',
        protocol: brand === 'samsung' ? 'websocket' : brand === 'lg' ? 'ssap' : 'upnp',
        raw: { headers, statusCode }
      });
    });

    client.search('ssdp:all');
  });
}
