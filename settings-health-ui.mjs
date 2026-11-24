import {badge,button,card,heading,node,statusRow} from './settings-controls.mjs?v=2.11.2';
import {VERSION} from './changelog.mjs?v=2.11.2';
import {backupSize,healthStatus,phase2Date,phase2Error} from './settings-phase2-format.mjs?v=2.11.2';

const path='/settings/health';
const checks={database:'Database',helper:'Contract helper',square:'Square',webhook:'Webhook',backup:'Backup'};
const warning=text=>{
 const element=node('p','alert alert-warning square-result',text);
 element.setAttribute('role','status');
 return element;
};

export function healthSettings({content,banner,apiCall,write}){
 return function render(data){
  const check=button('Check again',async()=>{
   check.disabled=true;
   try{await write(()=>apiCall(path+'/check','POST',{}),null,render,phase2Error);}
   finally{
    check.disabled=false;
    if(content.isConnected&&document.activeElement===document.body){
     content.querySelector('.page-header .btn')?.focus({preventScroll:true});
    }
   }
  });
  const {lastBackup,backup,versions}=data;
  const backupDetails=[];
  if(lastBackup){
   backupDetails.push(statusRow('Last successful backup',phase2Date(lastBackup.finishedAt)),
    statusRow('Size',backupSize(lastBackup.sizeBytes)),
    statusRow('Copy to Google Drive',lastBackup.driveOk===true?badge('OK'):
     lastBackup.driveOk===false?badge('Failed','due'):badge('Unknown','unpriced')));
  }else backupDetails.push(node('p','muted',backup.state==='old'?'No successful backup reported yet':'No backup report yet'));
  if(backup.detail==='Drive copy failed')backupDetails.push(warning('The latest backup could not be copied to Google Drive.'));
  if(backup.detail==='Latest backup failed')backupDetails.push(warning('The latest nightly backup failed.'));
  const problems=[];
  if(data.helper.status==='down')problems.push('The contract helper is unavailable');
  if(backup.state==='old')problems.push(problems.length?'the latest backup is overdue':'The latest backup is overdue');
  content.replaceChildren(heading('Backups and health',check),banner,
   ...(problems.length?[warning(problems.join(' and ')+'.')]:[]),
   card('Last nightly backup',...backupDetails),
   card('Versions',statusRow('Site','v'+VERSION),statusRow('Worker',node('span','settings-version',versions.worker??'Unknown')),
    statusRow('Helper',versions.helper==null?'Unknown':'Version '+versions.helper),
    statusRow('Database migration level',versions.migration??'Unknown')),
   card('Health checks',...Object.entries(checks).map(([key,label])=>statusRow(label,badge(...healthStatus(data[key],key)))),
    node('p','muted settings-note','Checked '+phase2Date(data.checkedAt))));
 };
}
