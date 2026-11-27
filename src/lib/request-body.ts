export async function readBytesBounded(request:Request,maximum:number){
 const declared=Number(request.headers.get('content-length')||0);if(!Number.isFinite(declared)||declared>maximum)throw new Error('Anfrage zu groß.');
 if(!request.body)return new Uint8Array();const reader=request.body.getReader(),chunks:Uint8Array[]=[];let length=0;
 try{while(true){const next=await reader.read();if(next.done)break;length+=next.value.byteLength;if(length>maximum){await reader.cancel();throw new Error('Anfrage zu groß.');}chunks.push(next.value);}}finally{reader.releaseLock();}
 const result=new Uint8Array(length);let offset=0;for(const chunk of chunks){result.set(chunk,offset);offset+=chunk.byteLength;}return result;
}
export async function readTextBounded(request:Request,maximum:number){return new TextDecoder('utf-8',{fatal:true}).decode(await readBytesBounded(request,maximum));}
