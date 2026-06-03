import fs from 'fs';
async function test() {
  const req = await fetch("https://nyayegnnjwbdtmvvkhau.supabase.co/functions/v1/lalamove-quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ destinationCep: "05001000" })
  });
  const data = await req.json();
  fs.writeFileSync('debug.txt', JSON.stringify(data, null, 2), 'utf-8');
}
test();
