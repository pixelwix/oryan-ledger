import {settingsError} from './settings-format.mjs?v=2.11.2';

const errors={
 invalid_helper_url:'Enter the HTTPS Apps Script web app URL ending in /exec.',
 invalid_enabled:'Choose whether documents should be on or off.',
 invalid_secret:'Enter a valid shared secret.',
 recipient_limit:'You can add up to five alert recipients.',
 settings_changed:'These settings changed. Reload the page and try again.',
 invalid_settings:'Check the email address or booking number and try again.',
 test_email_failed:'The test email could not be sent. Try again.'
};

export function phase2Error(error){
 if(Object.hasOwn(errors,error.code))return errors[error.code];
 if(error.status===403)return 'You no longer have permission to change these settings.';
 if(error.status===429)return 'Too many requests. Wait a few minutes and try again.';
 if(error.status===503&&error.code!=='settings_key_unavailable')return 'Settings are temporarily unavailable. Try again in a few minutes.';
 if(error.status===400||error.status===409){
  if(error.code==='undo_unavailable')return settingsError(error);
  return 'Check your changes and try again.';
 }
 return settingsError(error);
}

export function helperStatus(ping){
 if(!ping)return ['Not checked yet','Unknown','unpriced'];
 if(ping.ok)return [ping.helperVersion?'Helper version '+ping.helperVersion:'The helper answered','Connected','paid'];
 const messages={
  unreachable:'The helper did not answer.',
  rejected:'The shared secret does not match the helper.',
  helper_too_old:'The helper needs an update before it can answer this check.'
 };
 return [Object.hasOwn(messages,ping.error)?messages[ping.error]:messages.unreachable,'Unavailable','due'];
}

export function healthStatus(check,key){
 switch(check?.status){
  case 'ok':return [key==='backup'?'Fresh':'OK','paid'];
  case 'warn':
   if(key==='backup'){
    if(check.state==='old')return ['Old','due'];
    if(check.detail==='Drive copy failed')return ['Copy failed','due'];
    if(check.detail==='Latest backup failed')return ['Backup failed','due'];
   }
   return ['Needs attention','due'];
  case 'down':return ['Failing','due'];
  case 'not_set_up':return ['Not set up','unpriced'];
  default:return ['Unknown','unpriced'];
 }
}

export function backupSize(bytes){
 if(!Number.isFinite(bytes)||bytes<0)return 'Unknown';
 if(bytes<1000)return bytes+' B';
 if(bytes<1000000)return (bytes/1000).toFixed(1)+' KB';
 if(bytes<1000000000)return (bytes/1000000).toFixed(1)+' MB';
 return (bytes/1000000000).toFixed(1)+' GB';
}

export function phase2Date(value){
 const date=new Date(value);
 if(!value||!Number.isFinite(+date))return 'Unknown';
 return new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',month:'short',day:'numeric',
  hour:'numeric',minute:'2-digit',timeZoneName:'short'}).format(date);
}
