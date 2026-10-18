// Static-only development server, adapted from the original Six-Ball Review local server.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('./dist/',import.meta.url));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'};
const csp="default-src 'self'; connect-src 'none'; img-src 'self' blob: data:; style-src 'self'; script-src 'self'; font-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'";
http.createServer(async(req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'}).end();return;}
  let target;try{let name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(name.includes('\\')||name.includes('\0'))throw Error();target=path.resolve(root,'.'+(name==='/'?'/index.html':name));if(!target.startsWith(root)||target===root)throw Error();}catch{res.writeHead(400).end('Invalid path');return;}
  try{const b=await readFile(target);res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream','Content-Length':b.length,'Cache-Control':'no-store','Content-Security-Policy':csp,'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});res.end(req.method==='HEAD'?undefined:b);}catch{res.writeHead(404).end('Not found');}
}).listen(Number(process.env.PORT||4188),'127.0.0.1',()=>process.stdout.write('Covercheck: http://127.0.0.1:'+Number(process.env.PORT||4188)+'\n'));
