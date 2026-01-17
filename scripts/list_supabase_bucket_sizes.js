import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

async function maybeFetch(url, options = {}) {
  if (typeof fetch === 'function') {
    return fetch(url, { method: 'HEAD', ...options });
  }
  const { default: fetchFn } = await import('node-fetch');
  return fetchFn(url, { method: 'HEAD', ...options });
}

function joinPath(prefix, name) {
  if (!prefix) return name;
  return `${prefix.replace(/\/+$/, '')}/${name}`;
}

async function listAllFiles(supabase, bucket) {
  const all = [];
  const queue = [''];
  const limit = 1000;

  while (queue.length) {
    const prefix = queue.shift();
    let offset = 0;
    while (true) {
      const res = await supabase.storage.from(bucket).list(prefix, { limit, offset });
      if (res.error) throw res.error;
      const data = res.data || [];
      for (const item of data) {
        const fullPath = joinPath(prefix, item.name);
        const isFile = Boolean(item.id || item.metadata);
        if (isFile) {
          all.push({ ...item, fullPath });
        } else {
          queue.push(fullPath);
        }
      }
      if (data.length < limit) break;
      offset += data.length;
    }
  }

  return all;
}

function humanSize(bytes) {
  if (!bytes) return '0 B';
  const units = ['B','KB','MB','GB','TB'];
  let i = 0;
  let b = Number(bytes);
  while (b >= 1024 && i < units.length-1) {
    b /= 1024;
    i++;
  }
  return `${b.toFixed(2)} ${units[i]}`;
}

(async () => {
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
    || process.env.SUPABASE_SERVICE_ROLE
    || process.env.SUPABASE_SERVICE_KEY;
  const BUCKETS = (process.env.BUCKETS || 'videos,video,dietas,avatars').split(',').map(s=>s.trim()).filter(Boolean);

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Set SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_ROLE/SUPABASE_SERVICE_KEY).');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  for (const bucket of BUCKETS) {
    console.log(`\n=== Bucket: ${bucket} ===`);
    try {
      const files = await listAllFiles(supabase, bucket);
      if (!files.length) {
        console.log('No files found.');
        continue;
      }
      const results = [];
      let total = 0;
      for (const f of files) {
        const filePath = f.fullPath || f.name;
        const { data: signed, error: sErr } = await supabase.storage.from(bucket).createSignedUrl(filePath, 60);
        if (sErr) {
          console.warn('Skipped', filePath, 'createSignedUrl error:', sErr.message || sErr);
          continue;
        }
        try {
          const resp = await maybeFetch(signed.signedUrl);
          const len = resp.headers.get('content-length');
          const size = len ? parseInt(len, 10) : 0;
          results.push({ name: filePath, size });
          total += size;
        } catch (err) {
          console.warn('HEAD failed for', filePath, err.message || err);
          results.push({ name: filePath, size: 0 });
        }
      }

      results.sort((a,b)=>b.size-a.size);
      console.log('Total bucket size:', humanSize(total));
      console.log('Top 20 largest files:');
      for (const r of results.slice(0,20)) {
        console.log('-', humanSize(r.size).padEnd(12), r.name);
      }
      if (results.length > 20) {
        console.log(`... ${results.length - 20} more files`);
      }
    } catch (err) {
      console.error('Error listing bucket', bucket, err.message || err);
    }
  }
})();
