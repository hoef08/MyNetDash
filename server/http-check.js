import net from 'node:net';

export async function httpCheck(device, timeoutSec = 4) {
  const proto = device.protocol || 'http';
  const host  = device.host;
  const port  = device.port ? `:${device.port}` : '';
  const url   = `${proto}://${host}${port}/`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutSec * 1000);
  const start = performance.now();

  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'manual',
    });
    clearTimeout(timer);
    const latency = Math.round(performance.now() - start);
    return {
      status: 'online',
      latency,
      at: Date.now(),
      metrics: { httpStatus: res.status }
    };
  } catch (err) {
    clearTimeout(timer);
    // Fall back to TCP check on port if HTTP fails
    if (device.port) {
      const tcp = await tcpCheck({ host: device.host, port: device.port }, timeoutSec);
      if (tcp.status === 'online') return tcp;
    }
    return {
      status: 'offline',
      latency: null,
      at: Date.now(),
      error: err.name === 'AbortError' ? 'timeout' : (err.message || String(err))
    };
  }
}

export async function tcpCheck(device, timeoutSec = 4) {
  return new Promise((resolve) => {
    const start = performance.now();
    const socket = new net.Socket();
    let settled = false;
    const done = (status, extra = {}) => {
      if (settled) return;
      settled = true;
      try { socket.destroy(); } catch {}
      resolve({ status, latency: extra.latency ?? null, at: Date.now(), ...extra });
    };
    socket.setTimeout(timeoutSec * 1000);
    socket.once('connect', () => {
      const latency = Math.round(performance.now() - start);
      done('online', { latency });
    });
    socket.once('timeout',  () => done('offline', { error: 'timeout' }));
    socket.once('error',    (err) => done('offline', { error: err.message || String(err) }));
    socket.connect(Number(device.port) || 80, device.host);
  });
}
