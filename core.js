export const LIMITS=Object.freeze({bytes:12*1024*1024,pixels:16000000,edge:8192,zones:50});
export const PNG_SIGNATURE=new Uint8Array([137,80,78,71,13,10,26,10]);
const crcTable=Uint32Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
export function crc32(bytes){let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0;}
const fail=message=>{throw new Error(message);};
function dimensions(width,height){if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>LIMITS.edge||height>LIMITS.edge||width*height>LIMITS.pixels)fail('Image dimensions exceed 8,192 pixels per side or 16 megapixels.');}
export function parsePNG(bytes,{output=false}={}){
  if(bytes.length<33||!PNG_SIGNATURE.every((v,i)=>bytes[i]===v))fail('This is not a supported PNG.');
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);let offset=8,chunks=[],width,height,ended=false,seenData=false,dataEnded=false;
  while(offset<bytes.length){if(offset+12>bytes.length)fail('Truncated PNG chunk.');const size=view.getUint32(offset);if(size>bytes.length-offset-12)fail('Invalid PNG chunk length.');const type=String.fromCharCode(...bytes.subarray(offset+4,offset+8));if(!/^[A-Za-z]{4}$/.test(type))fail('Invalid PNG chunk type.');if(crc32(bytes.subarray(offset+4,offset+8+size))!==view.getUint32(offset+8+size))fail('PNG checksum failed.');
    if(chunks.length===0&&type!=='IHDR')fail('PNG header is missing.');
    if(type==='acTL'||type==='fcTL'||type==='fdAT')fail('Animated PNG is not supported. Use a static PNG or JPEG.');
    if(type==='IHDR'){if(chunks.length||size!==13)fail('Invalid PNG header.');width=view.getUint32(offset+8);height=view.getUint32(offset+12);dimensions(width,height);const d=bytes.subarray(offset+8,offset+21);if(d[8]!==8||![0,2,3,4,6].includes(d[9])||d[10]!==0||d[11]!==0||d[12]!==0)fail('Use a non-interlaced, 8-bit PNG.');if(output&&![2,6].includes(d[9]))fail('Unexpected export PNG color type.');}
    if(type==='IDAT'){if(dataEnded)fail('Nonconsecutive PNG image chunks.');seenData=true;}else if(seenData)dataEnded=true;
    if(!['IHDR','PLTE','IDAT','IEND'].includes(type)&&type[0]===type[0].toUpperCase())fail('Unsupported critical PNG chunk.');
    if(output&&!['IHDR','IDAT','IEND'].includes(type))fail('Unexpected metadata in the export.');
    chunks.push({type,start:offset,end:offset+12+size});offset+=size+12;
    if(type==='IEND'){if(size||!seenData)fail('Invalid PNG ending.');ended=true;break;}
  }
  if(!ended||offset!==bytes.length)fail('PNG is incomplete or has data after its end.');
  return{format:'PNG',width,height,chunks,metadata:chunks.filter(c=>!['IHDR','PLTE','IDAT','IEND','tRNS'].includes(c.type)).map(c=>c.type)};
}
export function stripPNG(bytes){const p=parsePNG(bytes);const keep=p.chunks.filter(c=>['IHDR','IDAT','IEND'].includes(c.type));const clean=new Uint8Array(8+keep.reduce((s,c)=>s+c.end-c.start,0));clean.set(PNG_SIGNATURE);let pos=8;for(const c of keep){clean.set(bytes.subarray(c.start,c.end),pos);pos+=c.end-c.start;}parsePNG(clean,{output:true});return clean;}
export function parseJPEG(bytes){
  if(bytes.length<4||bytes[0]!==255||bytes[1]!==216)fail('This is not a supported JPEG.');let i=2,width,height,scanned=false,ended=false;
  while(i<bytes.length){if(bytes[i++]!==255)fail('Malformed JPEG marker.');while(bytes[i]===255)i++;const marker=bytes[i++];if(marker===217){ended=true;break;}if(marker===216||marker===0)fail('Invalid JPEG structure.');if(marker>=208&&marker<=215)continue;if(i+2>bytes.length)fail('Truncated JPEG.');const len=(bytes[i]<<8)|bytes[i+1];if(len<2||i+len>bytes.length)fail('Invalid JPEG segment.');
    if(marker===226&&String.fromCharCode(...bytes.subarray(i+2,i+6))==='MPF\0')fail('Multi-picture JPEG is not supported.');
    if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)){if(![192,194].includes(marker)||len<8||bytes[i+2]!==8)fail('Use an 8-bit baseline or progressive JPEG.');if(width)fail('Multiple JPEG frames are not supported.');height=(bytes[i+3]<<8)|bytes[i+4];width=(bytes[i+5]<<8)|bytes[i+6];dimensions(width,height);}
    i+=len;
    if(marker===218){scanned=true;while(i<bytes.length-1){if(bytes[i]===255){const next=bytes[i+1];if(next===0||(next>=208&&next<=215)){i+=2;continue;}break;}i++;}}
  }
  if(!ended||i!==bytes.length||!scanned||!width)fail('JPEG is incomplete, unsupported, or has trailing data.');return{format:'JPEG',width,height,metadata:['JPEG segments are not copied to export']};
}
export function inspectInput(bytes){if(bytes.length>LIMITS.bytes)fail('Choose an image under 12 MiB.');if(PNG_SIGNATURE.every((v,i)=>bytes[i]===v))return parsePNG(bytes);if(bytes[0]===255&&bytes[1]===216)return parseJPEG(bytes);fail('Choose a static PNG or JPEG. SVG, GIF, PDF and animated images are not supported.');}
export function normalizeRect(x1,y1,x2,y2,width,height){const a=Math.max(0,Math.floor(Math.min(x1,x2))),b=Math.max(0,Math.floor(Math.min(y1,y2))),c=Math.min(width,Math.ceil(Math.max(x1,x2))),d=Math.min(height,Math.ceil(Math.max(y1,y2)));if(![a,b,c,d].every(Number.isFinite)||c<=a||d<=b)fail('A region needs at least one pixel inside the image.');return{x:a,y:b,width:c-a,height:d-b};}
export function checkRects(rects,width,height){if(!rects.length)fail('Add at least one region before checking the PNG.');if(rects.length>LIMITS.zones)fail('Use no more than 50 regions.');for(const r of rects){if(!['x','y','width','height'].every(k=>Number.isInteger(r[k]))||r.x<0||r.y<0||r.width<1||r.height<1||r.x+r.width>width||r.y+r.height>height)fail('A region is outside the image or uses invalid coordinates.');}}
export async function decodeLocal(file){if(file.size>LIMITS.bytes)fail('Choose an image under 12 MiB.');const bytes=new Uint8Array(await file.arrayBuffer());const info=inspectInput(bytes);const bitmap=await createImageBitmap(new Blob([bytes],{type:info.format==='PNG'?'image/png':'image/jpeg'}),{imageOrientation:'from-image',premultiplyAlpha:'none'});dimensions(bitmap.width,bitmap.height);const canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0);bitmap.close();return{canvas,info:{...info,width:canvas.width,height:canvas.height}};}
export async function makeCheckedPNG(source,rects){
  checkRects(rects,source.width,source.height);const work=document.createElement('canvas');work.width=source.width;work.height=source.height;const ctx=work.getContext('2d',{willReadFrequently:true});ctx.fillStyle='#fff';ctx.fillRect(0,0,work.width,work.height);ctx.drawImage(source,0,0);ctx.fillStyle='#171d20';for(const r of rects)ctx.fillRect(r.x,r.y,r.width,r.height);
  const blob=await new Promise((resolve,reject)=>work.toBlob(b=>b?resolve(b):reject(Error('PNG encoding failed.')),'image/png'));
  const bytes=stripPNG(new Uint8Array(await blob.arrayBuffer()));const structure=parsePNG(bytes,{output:true});const resultBlob=new Blob([bytes],{type:'image/png'});const bitmap=await createImageBitmap(resultBlob);const check=document.createElement('canvas');check.width=bitmap.width;check.height=bitmap.height;const cc=check.getContext('2d',{willReadFrequently:true});cc.drawImage(bitmap,0,0);bitmap.close();if(check.width!==source.width||check.height!==source.height)fail('Export dimensions changed.');
  const pixels=cc.getImageData(0,0,check.width,check.height).data;for(let i=3;i<pixels.length;i+=4)if(pixels[i]!==255)fail('Export still contains transparent pixels.');let covered=0;
  for(const r of rects)for(let y=r.y;y<r.y+r.height;y++)for(let x=r.x;x<r.x+r.width;x++){const i=(y*check.width+x)*4;if(pixels[i]!==23||pixels[i+1]!==29||pixels[i+2]!==32||pixels[i+3]!==255)fail('A covered pixel did not match the opaque fill.');covered++;}
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
  return{blob:resultBlob,canvas:check,report:{tool:'Covercheck',version:'0.1.0',sha256:hash,bytes:bytes.length,width:check.width,height:check.height,regions:rects.length,covered_pixel_checks:covered,overlap_counted_per_region:true,chunks:structure.chunks.map(c=>c.type),checks:{dimensions:true,opaque_pixels:true,selected_pixels_match:true,only_required_png_chunks:true,no_trailing_bytes:true},limits:'Checks apply only to selected regions and this file structure. Unselected information, original files and contextual identification are not assessed.'}};
}
