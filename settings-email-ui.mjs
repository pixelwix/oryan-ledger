import {actions,button,card,checkbox,field,group,heading,node,statusRow} from './settings-controls.mjs?v=2.11.0';
import {phase2Error} from './settings-phase2-format.mjs?v=2.11.0';

const path='/settings/email';

export function emailSettings({content,banner,apiCall,write,change,actor}){
 let lastTest;
 const save=(suffix,body)=>change(path+suffix,'PUT',body,{errorMessage:phase2Error});

 function editableList(values,remove,{label,id,action,type='text',placeholder,add}){
  const list=group('',...values.map(value=>statusRow(node('span','muted',value),
   button('Remove',()=>remove(value),{small:true}))));
  const input=node('input','form-input');
  input.type=type;
  input.required=true;
  input.spellcheck=false;
  if(placeholder)input.placeholder=placeholder;
  function submit(){
   if(input.reportValidity()&&input.value.trim())add(input.value.trim());
  }
  input.addEventListener('keydown',event=>{
   if(event.key==='Enter'){event.preventDefault();submit();}
  });
  return [list,group('settings-note',field(label,id,input)),actions(button(action,submit))];
 }

 return function render(data){
  const result=node('p','alert square-result');
  result.setAttribute('role','status');
  function showResult(){
   result.hidden=lastTest===undefined;
   result.classList.toggle('alert-info',lastTest===true);
   result.classList.toggle('alert-danger',lastTest===false);
   result.textContent=lastTest===undefined?'':lastTest?'Sent to '+actor:'The test email could not be sent. Try again.';
  }
  showResult();
  const test=button('Send test email to me',async()=>{
   test.disabled=true;
   lastTest=undefined;
   showResult();
   try{
    await write(async()=>{
     try{return (await apiCall(path+'/test','POST',{})).ok===true;}
     catch(error){if(error.code==='test_email_failed')return false;throw error;}
    },null,ok=>{lastTest=ok;showResult();},phase2Error);
   }finally{test.disabled=false;}
  });
  const alerts=editableList(data.recipients,email=>save('/recipients',{action:'remove',email}),{
   label:'Add email',id:'new-recipient',type:'email',action:'Add email',
   add:email=>save('/recipients',{action:'add',email})
  });
  const {paymentReceived,webhookFailure}=data;
  const {enabled,exempt}=data.reminders;
  const reminders=editableList(exempt,value=>save('/reminders',{enabled,exempt:exempt.filter(item=>item!==value)}),{
   label:'Add sample booking',id:'new-exemption',placeholder:'EX-112',action:'Add',
   add:value=>save('/reminders',{enabled,exempt:[...new Set([...exempt,value])]})
  });
  content.replaceChildren(heading('Email and reminders',test),banner,result,
   card('Owner alerts',...alerts,group('settings-note settings-alert-options',
    checkbox('Failed Square webhook',webhookFailure,value=>save('/alerts',{paymentReceived,webhookFailure:value})),
    checkbox('Payment received',paymentReceived,value=>save('/alerts',{paymentReceived:value,webhookFailure})))),
   card('Reminders',statusRow(node('p','muted','Controls the manual “Email reminder” button. Staff cannot send reminders when this is off or for exempt bookings.'),
    checkbox('Reminders',enabled,value=>save('/reminders',{enabled:value,exempt}),{switchControl:true})),
    node('h4','settings-note','Sample bookings exempt from reminders'),...reminders),
   card('Access emails',statusRow(node('p','muted','Send “You now have access” when a person is added.'),
    checkbox('Access emails',data.accessEmailEnabled,value=>save('/access-email',{enabled:value}),{switchControl:true}))));
 };
}
