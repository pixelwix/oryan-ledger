import {actions,badge,button,card,checkbox,field,group,heading,node,statusRow} from './settings-controls.mjs?v=2.11.0';
import {credentialStatus,storageWarning} from './settings-format.mjs?v=2.11.0';
import {helperStatus,phase2Date,phase2Error} from './settings-phase2-format.mjs?v=2.11.0';

const path='/settings/helper';

export function helperSettings({content,banner,apiCall,write,change,modal,confirm,actor,mask,showError,load,signal}){
 const save=(suffix,body,options)=>change(path+suffix,'PUT',body,{errorMessage:phase2Error,...options});

 function rotate(){
  const input=node('input','form-input');
  input.type='password';
  input.autocomplete='new-password';
  input.required=true;
  input.spellcheck=false;
  const steps=node('ol','rotation-steps');
  for(const step of ['Save the new secret in the ledger.',
   'Update the shared secret in the helper’s Apps Script properties.',
   'Return to Settings and choose Ping helper to test the connection.']){
   steps.append(node('li','',step));
  }
  modal('Rotate shared secret',[steps,group('settings-note',field('New shared secret','new-helper-secret',input))],
   'Continue',handle=>{
    if(!input.reportValidity())return;
    write(()=>apiCall(path+'/secret','PUT',{value:input.value}),handle,async()=>{
     input.value='';
     handle.close(true);
     try{await load();}
     finally{if(!signal.aborted)nextStep();}
    },phase2Error);
   });
 }

 function nextStep(){
  content.querySelector('.settings-rotate')?.focus({preventScroll:true});
  const next=modal('Update the helper',[
   node('p','','The new secret is saved in the ledger. Update the shared secret in the helper’s Apps Script properties to match.'),
   node('p','settings-note','Then choose Ping helper to test the connection.')
  ],'Done',done=>done.close());
  next.footer.firstElementChild.hidden=true;
 }

 return function render(data){
  const url=node('input','form-input');
  url.type='url';
  url.required=true;
  url.spellcheck=false;
  url.value=data.url||'';
  const connection=card('Connection',field('Helper URL','helper-url',url),
   actions(button('Save',()=>{if(url.reportValidity())save('/url',{url:url.value.trim()});},{primary:true})));
  const outcome=group('helper-outcome');
  outcome.setAttribute('role','status');
  function status(ping){
   const [message,label,tone]=helperStatus(ping);
   outcome.replaceChildren(statusRow(message,badge(label,tone)));
   if(ping?.checkedAt)outcome.append(node('p','muted settings-note','Checked '+phase2Date(ping.checkedAt)));
  }
  status(data.lastPing);
  const ping=button('Ping helper',async()=>{
   ping.disabled=true;
   try{await write(()=>apiCall(path+'/ping','POST',{}),null,status,phase2Error);}
   finally{ping.disabled=false;}
  });
  const enabled=checkbox('Documents',data.enabled,value=>{
   if(value)save('/enabled',{enabled:value});
   else confirm('Turn off documents?','Staff can no longer make or send booking documents while this is off.',
    'Turn off documents',handle=>save('/enabled',{enabled:false},{handle}));
  },{switchControl:true});
  const secret=data.secret||{};
  const rotation=button('Rotate shared secret',rotate);
  rotation.classList.add('settings-rotate');
  const secretActions=actions(rotation);
  if(secret.canUndo)secretActions.append(button('Undo last change',()=>{
   confirm('Undo last change','Restore the previous secret in the ledger? Update the helper to match, then choose Ping helper.',
    'Undo last change',handle=>change(path+'/secret/undo','POST',{},{
     handle,message:'Previous secret restored',errorMessage:phase2Error
    }));
  }));
  content.replaceChildren(heading('Contract helper'),banner,connection,card('Helper status',outcome,actions(ping)),
   card('Documents',statusRow(node('p','muted','Let staff generate and send booking documents from the ledger.'),enabled)),
   card('Shared secret',node('p','muted','The ledger and the helper use a matching secret.'),
    node('p','muted settings-note',credentialStatus(secret,actor,mask)),secretActions));
  if(secret.warning)showError(storageWarning);
 };
}
