(()=>{'use strict';
const URL='https://ytkrnimysbyszuuwipzs.supabase.co';
const KEY='sb_publishable_HJv1WfGWg30chTRGiuyunA_T3oTIghZ';
const api=window.supabase?.createClient(URL,KEY);
let user=null,version=0,ready=false,busy=false,queued=null,hooks=null,tick=null,statusText='A ligar…',lastSaved=null,conflict=false,storageError=false;
const blank=()=>({leads:[],projects:[],transactions:[],goals:[],events:[],tasks:[],clients:[],clientTasks:[],clientFiles:[],ideas:[],followups:[],bankBalance:0});
const root=()=>document.getElementById('root');
const message=s=>{statusText=s;const el=document.getElementById('sync-status');if(el)el.textContent=s};
const key=s=>'lifeos-'+s+'-'+user.id;
function read(s,fallback){try{return JSON.parse(localStorage.getItem(key(s)))||fallback}catch{return fallback}}
function write(s,value){try{localStorage.setItem(key(s),JSON.stringify(value));return true}catch{storageError=true;message('Armazenamento local cheio — exporta um backup');return false}}
function snapshot(data){if(!user)return;const copies=read('backups',[]);if(copies[0]&&JSON.stringify(copies[0].data)===JSON.stringify(data))return;write('backups',[{at:new Date().toISOString(),data:structuredClone(data)},...copies].slice(0,5))}
function synced(){message('Guardado na conta às '+new Date(lastSaved).toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit'})+(storageError?' · cópia local indisponível':''))}
function gate(error=''){ready=false;window.lifeosSync.ready=false;root().innerHTML=`<main class="login"><div class="login-card"><h1>LifeOS</h1><p class="muted">Entra na tua conta para sincronizar os dados entre dispositivos.</p>${error?`<p class="notice" id="login-error"></p>`:''}<form id="login-form"><label>Email</label><input class="field" type="email" name="email" required autocomplete="email"><label>Palavra-passe</label><input class="field" type="password" name="password" minlength="6" required autocomplete="current-password"><button class="btn primary" type="submit">Entrar</button></form><p class="muted mini">Cria primeiro o teu utilizador em Supabase → Authentication → Users → Add user.</p></div></main>`;if(error)document.getElementById('login-error').textContent=error;document.getElementById('login-form').onsubmit=async e=>{e.preventDefault();const btn=e.target.querySelector('button');btn.disabled=true;const f=new FormData(e.target);const {error}=await api.auth.signInWithPassword({email:f.get('email'),password:f.get('password')});if(error){gate('Não foi possível entrar: '+error.message)}else await boot();};}

async function boot(useRemote=false){if(!api){gate('Não foi possível carregar a biblioteca Supabase. Verifica a ligação à internet.');return}
const {data,error}=await api.auth.getUser();if(error||!data.user){gate();return}user=data.user;
const {data:row,error:readError}=await api.from('lifeos_documents').select('data,version,updated_at').eq('user_id',user.id).maybeSingle();
if(readError){gate('Não foi possível carregar os dados: '+readError.message);return}
if(useRemote)localStorage.removeItem(key('pending'));version=row?.version||0;let payload=row?.data||blank();const pending=read('pending',null);conflict=false;queued=null;
if(pending){queued=pending.data;if(JSON.stringify(queued)===JSON.stringify(payload)){queued=null;localStorage.removeItem(key('pending'))}else{snapshot(payload);payload=queued;conflict=pending.version!==version}}
ready=true;window.lifeosSync.ready=true;lastSaved=row?.updated_at||null;
hooks.set(payload);snapshot(payload);
if(conflict)message('Conflito entre dispositivos — exporta os dados antes de atualizar');else if(queued)flush();else if(lastSaved)synced();else message('Conta pronta — ainda sem dados guardados');
if(tick)clearInterval(tick);tick=setInterval(()=>{if(queued)flush();else pull()},7000)}
async function pull(){if(!ready||busy||queued||conflict||document.hidden||document.querySelector('.modal-back'))return;busy=true;
try{const {data,error}=await api.from('lifeos_documents').select('data,version,updated_at').eq('user_id',user.id).maybeSingle();if(error)throw error;
if(queued)return;
if(data&&data.version>version){snapshot(hooks.get());version=data.version;lastSaved=data.updated_at;hooks.set(data.data);snapshot(data.data)}else if(!data&&version>0){conflict=true;message('Dados removidos do servidor — exporta uma cópia');return}
if(lastSaved)synced();
}catch{message('Sem ligação — última gravação: '+(lastSaved?new Date(lastSaved).toLocaleString('pt-PT'):'nenhuma'))}finally{busy=false;if(queued)flush()}}
async function flush(){if(busy||!queued||!ready||conflict)return;busy=true;
try{while(queued&&ready){const current=queued;queued=null;message('A guardar na conta…');let result;
try{result=await api.rpc('lifeos_save',{p_data:current,p_expected_version:version})}catch(e){result={error:e}}
const {data,error}=result;
if(error){queued=queued||current;write('pending',{data:queued,version});message(storageError?'Erro ao guardar — exporta um backup agora':'Pendente de sincronização — cópia neste dispositivo');break}
if(data===null){queued=queued||current;conflict=true;write('pending',{data:queued,version});message('Conflito entre dispositivos — exporta antes de atualizar');break}
version=data;lastSaved=new Date().toISOString();snapshot(current);
if(queued)write('pending',{data:queued,version});else localStorage.removeItem(key('pending'));synced();
}}finally{busy=false}}
window.lifeosSync={ready:false,client:api,status:()=>statusText,backups:()=>user?read('backups',[]):[],snapshot,
start:async h=>{hooks=h;gate();if(!api){gate('Biblioteca Supabase indisponível.');return}await boot()},
save:data=>{if(!ready){alert('A conta ainda não está pronta.');return}queued=structuredClone(data);write('pending',{data:queued,version});if(conflict){message('Conflito — alterações guardadas neste dispositivo; exporta um backup');return}flush()},
useRemote:async()=>{if(busy)return;if(!confirm('Carregar os dados da conta e guardar uma cópia local do que está nesta página?'))return;snapshot(hooks.get());await boot(true)},
retry:async()=>{if(conflict){alert('Existe um conflito. Exporta primeiro os dados desta página. Depois atualiza a página e escolhe qual a cópia que queres manter.');return}if(queued)await flush();else await pull()},
logout:async()=>{if(queued||busy){alert('Espera pela sincronização antes de sair. Se existir um erro, exporta um backup.');return}if(tick)clearInterval(tick);await api.auth.signOut();user=null;gate()}};
window.addEventListener('online',()=>{if(queued)flush();else pull()});
window.addEventListener('offline',()=>message(queued?'Sem ligação — alterações pendentes neste dispositivo':'Sem ligação — dados carregados neste dispositivo'));
window.addEventListener('beforeunload',e=>{if(queued||busy){e.preventDefault();e.returnValue=''}});
})();
