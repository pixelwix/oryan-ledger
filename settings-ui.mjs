import {auditDescription,credentialStatus,personStatus,settingsDate,settingsError,storageWarning,visiblePeople} from './settings-format.mjs?v=2.9.0';

const sections={people:'People',square:'Square',audit:'Audit log'};
const squarePath='/settings/square';
const pageSize=50;

function node(tag,className='',text){
 const element=document.createElement(tag);
 if(className)element.className=className;
 if(text!==undefined)element.textContent=text;
 return element;
}

function button(text,action,{primary=false,small=false,disabled=false}={}){
 const control=node('button','btn btn-'+(primary?'primary':'quiet')+(small?' btn-sm':''),text);
 control.type='button';
 control.disabled=disabled;
 control.addEventListener('click',action);
 return control;
}

function group(className,...children){
 const element=node('div',className);
 element.append(...children);
 return element;
}

function heading(label,...actions){
 const header=group('page-header',group('page-title-group',node('h2','',label)));
 if(actions.length)header.append(group('page-actions',...actions));
 return header;
}

function table(labels,rows){
 const grid=node('table','ledger-table');
 const header=grid.createTHead().insertRow();
 for(const label of labels)header.append(node('th','',label));
 grid.createTBody().append(...rows);
 return group('ledger-table-wrap',grid);
}

function row(...cells){
 const result=node('tr','ledger-row');
 for(const content of cells)result.insertCell().append(content);
 return result;
}

function field(label,id,input){
 input.id=id;
 const caption=node('label','form-label',label);
 caption.htmlFor=id;
 return group('form-group',caption,input);
}

function select(options,value){
 const input=node('select','form-select');
 for(const [key,label] of options)input.add(new Option(label,key));
 input.value=value;
 return input;
}

function resultPanel(result,success='Success'){
 const panel=group('card square-result',node('span','badge badge-'+(result.ok?'paid':'overdue'),result.ok?success:'Failed'));
 panel.setAttribute('role','status');
 const failure=result.error==='credentials_rejected'?'Square said the token was not accepted.':'Square could not verify the connection.';
 panel.append(result.ok?' Connected: '+[result.locationName,result.currency].filter(Boolean).join(', '):' '+failure);
 return panel;
}

export async function mountSettings({api,auth,route,access,actor,signal,toast,refresh}){
 const screen=document.querySelector('#settings-screen');
 const content=node('section','settings-content');
 const label=sections[route.section];
 content.setAttribute('aria-label',label);
 const title=group('page-header settings-page-header',group('page-title-group',node('h1','','Settings')));
 const sidebar=node('aside');
 const nav=node('nav','settings-sections');
 nav.setAttribute('aria-label','Settings sections');
 for(const [key,name] of Object.entries(sections)){
  const link=node('a','nav-link'+(key===route.section?' active':''),name);
  link.href='#/settings/'+key;
  if(key===route.section)link.setAttribute('aria-current','page');
  nav.append(link);
 }
 sidebar.append(nav,node('p','muted settings-note','Coming next: Contract helper, Email, Backups and health'));
 const banner=node('div','alert alert-warning settings-banner');
 banner.hidden=true;
 banner.setAttribute('role','alert');
 screen.append(title,group('settings-grid',sidebar,content));
 let busy=false,currentDialog,square,people=[],entries=[],result,person='',area='';
 const apiCall=(path,method='GET',body)=>api.settings(path,{method,body,signal});
 const mask=value=>access.elevated?value:String(value).replace(/\bAdministrator\b/g,'Ledger account');
 const showError=message=>{banner.textContent=message;banner.hidden=false;};
 content.append(banner);

 function modal(title,body,label,action,disabled=false){
  const opener=document.activeElement;
  const previous=currentDialog;
  if(previous)previous.backdrop.hidden=true;
  const backdrop=node('div','modal-backdrop settings-dialog');
  const dialog=node('div','modal-dialog');
  dialog.setAttribute('role','dialog');
  dialog.setAttribute('aria-modal','true');
  const heading=node('h2','modal-title',title);
  heading.id=previous?'settings-confirm-title':'settings-dialog-title';
  dialog.setAttribute('aria-labelledby',heading.id);
  dialog.tabIndex=-1;
  const error=node('p','alert alert-warning');
  error.hidden=true;
  error.setAttribute('role','alert');
  const closeButton=node('button','modal-close-btn','×');
  closeButton.type='button';
  closeButton.setAttribute('aria-label','Close');
  const cancel=button('Cancel',()=>close());
  const submit=label?button(label,()=>action(handle),{primary:true,disabled}):null;
  const footer=group('modal-actions',cancel,...(submit?[submit]:[]));
  dialog.append(group('modal-header',heading,closeButton),...body,error,footer);
  backdrop.append(dialog);
  const siblings=[...document.body.children].filter(element=>!element.inert&&element!==previous?.backdrop);
  siblings.forEach(element=>{element.inert=true;});
  const handle={backdrop,footer,submit,close,error,locked:false};
  currentDialog=handle;
  document.body.append(backdrop);
  dialog.focus({preventScroll:true});
  function onKey(event){
   if(currentDialog!==handle)return;
   if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close();}
   if(event.key==='Tab'){
    const controls=[...dialog.querySelectorAll('button,input,select,textarea,iframe')].filter(control=>!control.disabled&&control.getClientRects().length);
    const first=controls[0],last=controls[controls.length-1];
    if(!dialog.contains(document.activeElement)||(event.shiftKey?document.activeElement===first:document.activeElement===last)){
     event.preventDefault();
     (event.shiftKey?last:first)?.focus();
    }
    event.stopImmediatePropagation();
   }
  }
  function close(force=false){
   if(handle.locked&&!force)return;
   for(const input of backdrop.querySelectorAll('input[type=password]'))input.value='';
   backdrop.replaceChildren();
   backdrop.remove();
   siblings.forEach(element=>{element.inert=false;});
   document.removeEventListener('keydown',onKey,true);
   signal.removeEventListener('abort',cleanup);
   currentDialog=previous;
   if(previous)previous.backdrop.hidden=false;
   if(opener?.isConnected)opener.focus({preventScroll:true});
   handle.onClose?.();
  }
  function cleanup(){close(true);}
  signal.addEventListener('abort',cleanup,{once:true});
  document.addEventListener('keydown',onKey,true);
  closeButton.addEventListener('click',()=>close());
  backdrop.addEventListener('click',event=>{if(event.target===backdrop){event.stopPropagation();close();}});
  return handle;
 }

 function confirmIdentity(){
  return new Promise((resolve,reject)=>{
   const holder=node('div','settings-reauth-google');
   const controller=new AbortController();
   const dialog=modal("Confirm it's you",[node('p','','This change requires a Google sign-in from the last 10 minutes. Sign in again with your owner account to continue.')],null);
   dialog.footer.append(holder);
   dialog.onClose=()=>{controller.abort();reject(controller.signal.reason);};
   async function prompt(){
    try{
     holder.replaceChildren();
     await apiCall('/settings/reauth','POST',{idToken:await auth.reauth(holder,{signal:controller.signal,
      theme:document.documentElement.dataset.theme==='dark'?'filled_black':'outline'})});
     resolve();
     dialog.close();
    }catch{
     if(controller.signal.aborted)return;
     dialog.error.hidden=false;
     dialog.error.textContent='Confirm your identity with your current Google account to continue.';
     holder.replaceChildren(button('Try again',prompt));
    }
   }
   prompt();
  });
 }

 async function write(action,handle,onSuccess){
  if(busy)return;
  busy=true;
  const inputs=handle?[...handle.backdrop.querySelectorAll('input,select,textarea')]:[];
  for(const input of inputs)input.disabled=true;
  if(handle){handle.locked=true;handle.submit.disabled=true;handle.error.hidden=true;}
  banner.hidden=true;
  const focused=document.activeElement;
  try{
   let response;
   try{response=await action();}
   catch(error){
    if(error.status!==401||error.code!=='reauth_required')throw error;
    await confirmIdentity();
    signal.throwIfAborted();
    response=await action();
   }
   signal.throwIfAborted();
   await onSuccess(response);
  }catch(error){
   if(signal.aborted||error?.name==='AbortError')return;
   if(error.code==='settings_key_unavailable')showError(storageWarning);
   if(handle&&handle.backdrop.isConnected){handle.error.textContent=settingsError(error);handle.error.hidden=false;}
   else showError(settingsError(error));
  }finally{
   busy=false;
   for(const input of inputs)input.disabled=false;
   if(handle){handle.locked=false;if(handle.submit.isConnected)handle.submit.disabled=false;}
   if(!signal.aborted&&!focused?.isConnected&&document.activeElement===document.body){
    (content.querySelector('button:not(:disabled), select')||nav.querySelector('.active'))?.focus({preventScroll:true});
   }
  }
 }

 function change(path,method,body,{handle,message='Saved',reload=true}={}){
  return write(()=>apiCall(path,method,body),handle,async response=>{
   if(path.startsWith(squarePath))result=null;
   if(response.environment)refresh(response.environment);
   handle?.close(true);
   if(reload)await load();
   else if(path==='/sessions/revoke-all'){await auth.signOut();location.reload();}
   if(!signal.aborted)toast(message);
  });
 }

 function confirm(title,message,label,action){
  modal(title,[node('p','',message)],label,action);
 }

 function roleEditor(personRow){
  const adding=!personRow;
  const email=node('input','form-input');
  email.type='email';email.required=true;email.autocomplete='off';
  const role=select([['staff','Staff'],['owner','Owner']],personRow?.role||'staff');
  const note=node('textarea','form-textarea');note.rows=2;
  const fields=adding?[field('Email','settings-email',email),field('Role','settings-role',role),field('Note (optional)','settings-note',note)]
   :[field('Role for '+personRow.email,'settings-role',role)];
  const label=adding?'Add person':'Change role';
  modal(label,fields,adding?label:'Save',handle=>{
   if(adding&&(!email.reportValidity()||!email.value.trim()))return;
   const path=adding?'/settings/users':memberPath(personRow);
   change(path,adding?'POST':'PATCH',adding?{email:email.value.trim(),role:role.value,note:note.value.trim()}:{role:role.value},{handle});
  });
 }

 function memberPath(personRow){return '/settings/users/'+encodeURIComponent(personRow.email);}
 function renderPeople(usingConfigAllowlist){
  const actions=[
   button('Sign out everyone',()=>confirm('Sign out everyone','End all active ledger sessions you can manage?','Sign out everyone',handle=>
    change('/sessions/revoke-all','POST',{},{
     handle,message:'Sessions signed out',reload:false
    }))),
   button('Add person',()=>roleEditor(),{primary:true})
  ];
  const rows=people.map(personRow=>{
   const path=memberPath(personRow);
   const you=personRow.label==='You'||personRow.email===actor;
   const info=group('',node('strong','',mask(personRow.email)+(you?' (you)':'')));
   if(personRow.locked)info.append(node('div','muted','Locked: set in Worker config'));
   const [status,tone]=personStatus(personRow);
   const small={small:true};
   const controls=[];
   if(personRow.canManage!==false){
    if(!personRow.locked)controls.push(
     button('Change role',()=>roleEditor(personRow),small),
     button(status==='Disabled'?'Enable':'Disable',()=>change(path,'PATCH',{status:status==='Disabled'?'active':'disabled'}),small),
     button('Remove',()=>confirm('Remove person','Remove access for '+personRow.email+'? Their active sessions end immediately.','Remove person',
      handle=>change(path,'DELETE',undefined,{handle,message:'Person removed'})),small)
    );
    controls.push(button('Sign out ('+Number(personRow.activeSessions||0)+')',()=>change(path+'/sessions/revoke','POST',{},{
     message:'Sessions signed out'
    }),{...small,disabled:!personRow.activeSessions}));
   }
   const role=access.elevated&&personRow.role==='super_admin'?'Super admin':personRow.role==='owner'?'Owner':'Staff';
   return row(info,role,node('span','badge badge-'+tone,status),
    node('span','person-status',personRow.lastLoginAt?settingsDate(personRow.lastLoginAt):'Has not signed in yet'),group('row-actions ledger-row-mobile-actions',...controls));
  });
  content.replaceChildren(heading('People',...actions),banner,
   rows.length?table(['Person','Role','Status','Last sign-in','Actions'],rows):group('card',node('h3','card-title','No people yet')),
   node('p','muted settings-note','Disabling or removing someone ends their sessions now.'));
  if(access.elevated){
   content.lastChild.append(' As super admin, you can add, change or remove owners. Owners never see you in this list or in the audit log.');
   if(usingConfigAllowlist)content.append(button('Import from config',()=>confirm('Import from config',
    'Keep the existing allowlist when you start managing people here.','Import from config',
    handle=>change('/settings/users/import-from-config','POST',{},{handle}))));
  }
 }

 function productionDialog(action,title='Switch to Production',submit='Switch'){
  const input=node('input','form-input');
  input.autocomplete='off';input.spellcheck=false;
  const dialog=modal(title,[node('p','settings-note','Production uses real money. Payment links can charge customers through your live Square account.'),
   field('Type PRODUCTION to confirm','settings-production',input)],submit,handle=>{
    if(input.value==='PRODUCTION')action(handle);
  },true);
  input.addEventListener('input',()=>{dialog.submit.disabled=input.value!=='PRODUCTION'||dialog.locked;});
 }

 function secretEditor(key,status){
  const token=key==='access-token';
  const input=node('input','form-input');
  input.type='password';input.autocomplete='new-password';input.spellcheck=false;input.required=true;
  const checkbox=node('input','form-checkbox');checkbox.type='checkbox';checkbox.checked=true;
  const testLabel=node('label','form-checkbox-label');
  testLabel.append(checkbox,' Test before saving');
  const outcome=group('');
  let force=false;
  const dialog=modal(token?(status.set?'Replace access token':'Set access token'):(status.set?'Replace webhook signing key':'Set webhook signing key'),
   [field(token?'New access token':'New signing key','settings-credential',input),...(token?[testLabel]:[]),outcome],'Save',handle=>{
   if(!input.reportValidity())return;
   write(()=>apiCall(squarePath+'/'+key,'PUT',{value:input.value,...(token?{test:checkbox.checked,force}:{})}),handle,async response=>{
    if(!response.saved){
     outcome.replaceChildren(resultPanel(response.test||{ok:false}));
     force=true;handle.submit.textContent='Save anyway';
     return;
    }
    handle.close(true);
    result=response.test&&{...response.test,successLabel:'Test passed',locationName:response.test.locationName&&mask(response.test.locationName)};
    await load();
    if(!signal.aborted)toast('Square credential saved');
   });
  });
  function reset(){force=false;outcome.replaceChildren();dialog.submit.textContent='Save';}
  input.addEventListener('input',reset);checkbox.addEventListener('change',reset);
 }

 function renderSquare(){
  const production=square.environment==='production';
  const sandbox=button('Sandbox',()=>{if(production)change(squarePath+'/environment','PUT',{environment:'sandbox'});},{primary:!production});
  const live=button('Production',()=>{if(!production)productionDialog(handle=>
   change(squarePath+'/environment','PUT',{environment:'production',confirm:'PRODUCTION'},{handle}));},{primary:production});
  sandbox.setAttribute('aria-pressed',String(!production));live.setAttribute('aria-pressed',String(production));
  const modes=group('page-actions square-mode-options',sandbox,live);
  modes.setAttribute('role','group');modes.setAttribute('aria-label','Square environment');
  function secret(label,key,status={}){
   const details=group('square-secret',node('strong','',label),node('p','muted',credentialStatus(status,actor,mask)));
   const undo=node(status.canUndo?'a':'span','secret-undo','Undo last change');
   if(status.canUndo){
    undo.href='#';
    undo.addEventListener('click',event=>{event.preventDefault();confirm('Undo last change','Restore the previous '+label.toLowerCase()+'?',
     'Undo last change',handle=>change(squarePath+'/undo','POST',{secret:key},{handle}));});
   }else{undo.setAttribute('role','link');undo.setAttribute('aria-disabled','true');}
   details.append(undo);
   return group('square-row',details,button(status.set?'Replace':key==='webhook-key'?'Set key':'Set token',
    ()=>secretEditor(key,status),{small:true}));
  }
  const locationId=node('input','form-input location-input');locationId.value=square.locationId||'';locationId.spellcheck=false;
  const test=button('Test connection',()=>write(()=>apiCall(squarePath+'/test','POST',{}),null,response=>{
   result={...response,locationName:response.locationName&&mask(response.locationName)};status.replaceChildren(resultPanel(result));
  }));
  const status=group('');
  if(result)status.append(resultPanel(result,result.successLabel));
  const connection=group('card',group('card-header',node('h3','card-title','Connection')),
   secret('Access token','access-token',square.accessToken),secret('Webhook signing key','webhook-key',square.webhookKey),
   field('Location ID','settings-location',locationId),group('page-actions',test,
    button('Save location',()=>change(squarePath+'/location','PUT',{locationId:locationId.value.trim()}),{primary:true})),status);
  const webhook=node('input','form-input webhook-url');webhook.id='settings-webhook';webhook.value=square.webhookUrl||'';webhook.readOnly=true;
  const webhookLabel=node('label','form-label','Webhook URL');webhookLabel.htmlFor=webhook.id;
  const hook=group('card',group('card-header',node('h3','card-title','Webhook')),webhookLabel,group('square-row',webhook,
   button('Copy',async()=>{
    try{await navigator.clipboard.writeText(webhook.value);toast('Webhook URL copied');}
    catch{webhook.select();toast('Select and copy the webhook URL.');}
   },{small:true})),node('p','muted settings-note','Last event '+settingsDate(square.lastEventAt,{time:true})+
   ', last failure '+settingsDate(square.lastFailureAt,{time:true})));
  content.replaceChildren(heading('Square'),banner,group('card',node('h3','card-title square-mode','Environment'),modes,
   node('p','muted settings-note',production?'Production is active. Payment links can collect real money.':'Sandbox is active. Payments use test money.')),connection,hook);
  if([square.accessToken,square.webhookKey].some(value=>value?.warning)||square.warning)showError(storageWarning);
  if([square.accessToken,square.webhookKey].some(value=>value?.source==='config')){
   const adopt=(body,handle)=>write(()=>apiCall(squarePath+'/adopt-config','POST',body),handle,async()=>{
    handle?.close(true);result=null;await load();if(!signal.aborted)toast('Square settings copied');
   });
   connection.append(group('page-actions settings-note',button('Use these values from Cloudflare',()=>production?
    productionDialog(handle=>adopt({confirm:'PRODUCTION'},handle),'Use production settings from Cloudflare','Use these values'):
    write(async()=>{
     try{return await apiCall(squarePath+'/adopt-config','POST',{});}
     catch(error){
      if(error.code!=='production_confirmation_required')throw error;
      return null;
     }
    },null,async response=>{
     if(response===null){productionDialog(handle=>adopt({confirm:'PRODUCTION'},handle),'Use production settings from Cloudflare','Use these values');return;}
     result=null;await load();if(!signal.aborted)toast('Square settings copied');
    }))));
  }
 }

 function renderAudit(){
  const peopleByEmail=new Map(people.map(user=>[user.email,user]));
  const actorLabel=email=>mask(email)+(actor===email?' (you)':'');
  const personSelect=select([['','All people'],...people.map(user=>[user.email,actorLabel(user.email)])],person);
  const areaSelect=select([['','All areas'],['people','People'],['square','Square']],area);
  const filters=group('audit-filters');
  for(const [label,control] of [['Person',personSelect],['Area',areaSelect]]){
   const field=node('label');field.append(node('span','form-label',label),control);filters.append(field);
   control.addEventListener('change',()=>{
    if(busy){personSelect.value=person;areaSelect.value=area;return;}
    person=personSelect.value;area=areaSelect.value;
    write(()=>fetchAudit(),null,()=>renderAudit());
   });
  }
  const rows=entries.map(entry=>{
   const text=group('',node('strong','',auditDescription(entry,mask)));
   if(access.elevated&&(entry.actor_super||peopleByEmail.get(entry.actor)?.role==='super_admin')){
    text.append(' ',node('span','badge badge-due','Only super admins see this'));
   }
   const time=node('time','',settingsDate(entry.at,{time:true}));time.dateTime=entry.at;
   return row(time,actorLabel(entry.actor),node('span','badge badge-unpriced',entry.area==='people'?'People':'Square'),text);
  });
  content.replaceChildren(heading('Audit log'),banner,filters,rows.length?table(['Time','Person','Area','Change'],rows):
   group('card',node('h3','card-title','No audit entries match these filters'),node('p','card-subtitle','Choose another person or area.')));
  if(entries.length&&hasMore)content.append(group('page-actions settings-note',button('Load more',()=>write(
   ()=>fetchAudit(entries[entries.length-1].id),null,()=>renderAudit()))));
  content.append(node('p','muted settings-note','Entries never contain secret values'));
 }

 let hasMore=false;
 async function fetchAudit(before){
  const params=new URLSearchParams({limit:String(pageSize)});
  if(person)params.set('person',person);
  if(area)params.set('area',area);
  if(before)params.set('before',before);
  const data=await apiCall('/settings/audit?'+params);
  signal.throwIfAborted();
  entries=before?[...entries,...data.entries]:data.entries;
  hasMore=data.entries.length===pageSize;
 }
 async function load(){
  if(route.section==='square'){
   square=await apiCall(squarePath);
   signal.throwIfAborted();
   renderSquare();
   await refresh(square.environment);
   return;
  }
  const data=await apiCall('/settings/users');
  signal.throwIfAborted();
  people=visiblePeople(data.users,access.elevated);
  if(route.section==='people')renderPeople(data.usingConfigAllowlist);
  else{await fetchAudit();renderAudit();}
 }
 try{await load();}
 catch(error){if(!signal.aborted){if(error.auth)throw error;showError(settingsError(error));}}
}
