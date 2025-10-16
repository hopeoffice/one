(async () => {
  const phone = '+15551234567';
  try {
    const send = await fetch('http://localhost:3000/api/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    const sendJson = await send.json();
    console.log('send-code response:', sendJson);

    // wait a moment
    await new Promise(r => setTimeout(r, 300));

    // read db.json to find the code
    const fs = require('fs');
    const db = JSON.parse(fs.readFileSync('db.json', 'utf8'));
    const codeEntry = db.codes.find(c => c.phone === phone);
    console.log('codeEntry from db:', codeEntry);
    const code = codeEntry ? codeEntry.code : null;

    if (!code) {
      console.error('no code found, aborting');
      process.exit(1);
    }

    const verify = await fetch('http://localhost:3000/api/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code })
    });
    console.log('verify response:', await verify.json());

    const setpw = await fetch('http://localhost:3000/api/set-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password: 'secret123' })
    });
    console.log('set-password response:', await setpw.json());

    const db2 = JSON.parse(fs.readFileSync('db.json', 'utf8'));
    console.log('final db users:', db2.users);
  } catch (err) {
    console.error(err);
  }
})();
