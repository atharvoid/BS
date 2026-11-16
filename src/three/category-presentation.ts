/** Renderer-free retained still/phase pairs, isolated by motif and asset version. */
export type PresentationPair={version:string;phase:number;bounded:boolean;image:string;height:number;dpr:number}
export function createPresentationStore(motif:string,version:string) {
  const key=`bs:${motif}:${version}`,listeners=new Set<()=>void>()
  let pair:PresentationPair|null=null,loaded=false
  return {
    version,
    subscribe:(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn)}},
    get:()=>{
      if(!loaded){loaded=true;try{pair=JSON.parse(sessionStorage.getItem(key)||'null')}catch{pair=null}}
      return pair
    },
    valid:(value:unknown,height:number,dpr:number,bounded:boolean):value is PresentationPair=>{
      const p=value as PresentationPair|null
      return !!p&&p.version===version&&Number.isFinite(p.phase)&&p.phase>=0&&p.bounded===bounded&&
        Math.abs(p.height-height)<1&&Math.abs(p.dpr-dpr)<.01&&typeof p.image==='string'&&
        p.image.startsWith('data:image/png;base64,')&&p.image.length<500_000
    },
    retain:(next:PresentationPair)=>{pair=next;loaded=true;listeners.forEach(fn=>fn())},
    persist:()=>{try{if(pair)sessionStorage.setItem(key,JSON.stringify(pair))}catch{/* Privacy/quota failures keep the canonical pair available. */}},
  }
}
export type PresentationStore=ReturnType<typeof createPresentationStore>
export const WHEAT_VERSION='golden-wheat-v1'
export const TEXTILE_VERSION='indigo-roll-v2'
export const WHEAT_PRESENTATION=createPresentationStore('agriculture',WHEAT_VERSION)
export const TEXTILE_PRESENTATION=createPresentationStore('textiles',TEXTILE_VERSION)
