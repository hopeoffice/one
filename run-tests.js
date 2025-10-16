const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));
const fs = require('fs');

(async function(){
  const phone = '+19998887766';
  console.log('1) Sending first code...');
  let r = await fetch('http://localhost:3000/api/send-code',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone})});
  console.log('resp1', await r.json());

  console.log('2) Sending again immediately (should hit cooldown)');
  r = await fetch('http://localhost:3000/api/send-code',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone})});
  console.log('resp2', await r.json());

  console.log("3) Waiting 6 seconds (simulate short wait; in real test we'd wait 60s)");
  await new Promise(r=>setTimeout(r,6000));

  const db = JSON.parse(fs.readFileSync('db.json','utf8'));
  const codeEntry = db.codes.find(c => c.phone === phone);
  if (!codeEntry) {
    console.error('no code generated'); process.exit(2);
  }
  const code = codeEntry.code;
  console.log('4) Verifying code', code);
  r = await fetch('http://localhost:3000/api/verify-code',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone,code})});
  console.log('verify', await r.json());

  console.log('5) Setting password');
  r = await fetch('http://localhost:3000/api/set-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone,password:'x-test'} )});
  console.log('setpw', await r.json());

  console.log('6) Final db users:');
  const db2 = JSON.parse(fs.readFileSync('db.json','utf8'));
  console.log(JSON.stringify(db2.users,null,2));

  console.log('All tests done (note: cooldown shortened in test wait).');
})();
