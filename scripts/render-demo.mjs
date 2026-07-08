import fs from 'node:fs';
import handler from '../.tmp/index.js';

const cases = ['zh-TW', 'en', 'ja', 'ko'];

fs.mkdirSync('demo', { recursive: true });

for (const lang of cases) {
  const headers = {};
  let statusCode = 0;
  let body = '';
  const req = {
    query: { meritCount: '1024', lang },
    url: `http://local?meritCount=1024&lang=${lang}`
  };
  const res = {
    setHeader: (key, value) => {
      headers[key] = value;
    },
    status: (code) => {
      statusCode = code;
      return res;
    },
    send: (value) => {
      body = value;
    }
  };

  handler(req, res);

  if (statusCode !== 200 || !body.startsWith('<svg')) {
    throw new Error(`bad response for ${lang}`);
  }

  fs.writeFileSync(`demo/${lang}.svg`, body, 'utf8');
  console.log(JSON.stringify({ lang, length: body.length, contentType: headers['Content-Type'] }));
}
