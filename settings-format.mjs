const messages={
 user_exists:'That person is already listed.',
 user_not_found:'That person could not be found.',
 not_found:'That person could not be found.',
 invalid_email:'Enter a valid email address.',
 invalid_location:'Enter a valid Square Location ID.',
 invalid_secret:'Enter a valid Square credential.',
 last_owner:'At least one owner must remain active.',
 locked_owner:'This person is set in Worker config.',
 undo_unavailable:'There is no previous value to restore.',
 production_confirmation_required:'Type PRODUCTION to confirm.',
 reauth_required:'Use your current Google account to confirm your identity.'
};
export const storageWarning='Secret storage is not set up yet. Ask the person who manages the ledger to check its configuration.';
export function settingsError(error){
 if(error.status===403||error.code==='super_admin_required')return "You don't have permission to change owners.";
 if(error.code==='settings_key_unavailable')return storageWarning;
 if(error.status===429)return 'Too many changes. Wait a few minutes and try again.';
 return Object.hasOwn(messages,error.code)?messages[error.code]:'Settings could not complete that request. Try again.';
}

export function settingsDate(value,{time=false}={}){
 const date=new Date(value);
 if(!value||!Number.isFinite(+date))return 'none';
 return new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',month:'short',day:'numeric',
  ...(time?{hour:'numeric',minute:'2-digit'}:{})}).format(date);
}

export function visiblePeople(users,elevated){
 return users.filter(user=>user.role==='owner'||user.role==='staff'||(elevated&&user.role==='super_admin'));
}

export function personStatus(person){
 if(person.status==='disabled')return ['Disabled','cancelled'];
 if(!person.lastLoginAt&&!person.locked&&!person.activeSessions)return ['Invited','due'];
 return ['Active','paid'];
}

export function credentialStatus(status,actor,mask){
 if(!status?.set)return 'Not set';
 const parts=['Set'];
 if(status.hint)parts.push('ends in ...'+status.hint.replace(/^[.…]+/,''));
 if(status.updatedAt)parts.push('changed '+settingsDate(status.updatedAt)+(status.updatedBy?' by '+(status.updatedBy===actor?'you':mask(status.updatedBy)):''));
 if(status.source==='config')parts.push('from Cloudflare');
 return parts.join(', ');
}

const auditLabels={
 user_added:'Added person',user_updated:'Updated access for',user_removed:'Removed person',
 user_role_changed:'Changed role for',user_disabled:'Disabled',user_enabled:'Enabled',
 user_imported:'Imported person',sessions_revoked:'Signed out',all_sessions_revoked:'Signed out everyone',session_started:'Signed in',session_revoked:'Signed out',
 session_reauthenticated:'Confirmed identity',setting_changed:'Updated Square settings',setting_adopted:'Imported Square settings',
 secret_replaced:'Replaced',secret_undone:'Restored',secret_adopted:'Imported Square credentials',
 connection_tested:'Tested the Square connection'
};
const bindingLabels={
 SQUARE_ACCESS_TOKEN:'Square access token',SQUARE_WEBHOOK_SIGNATURE_KEY:'Square webhook signing key',
 SQUARE_ENV:'Square environment',SQUARE_LOCATION_ID:'Square Location ID'
};
export function auditDescription(entry,mask){
 const label=Object.hasOwn(auditLabels,entry.action)?auditLabels[entry.action]:'Changed settings';
 if(entry.area==='helper'){
  if(entry.action==='secret_replaced')return 'Rotated the shared secret';
  if(entry.action==='secret_undone')return 'Restored the shared secret';
  if(entry.action==='connection_tested')return 'Pinged the helper'+(entry.detail==='Connection succeeded'?' successfully':' (failed)');
  return 'Updated contract helper settings';
 }
 if(entry.area==='email'){
  if(entry.action==='recipients_updated')return 'Updated alert recipients';
  if(entry.action==='test_email_sent')return 'Sent a test email';
  if(entry.action==='test_email_failed')return 'Test email failed';
  return 'Updated email settings';
 }
 if(!entry.detail)return label;
 if(entry.area==='people')return label+' '+mask(entry.detail);
 const binding=entry.detail.split(',')[0];
 if(Object.hasOwn(bindingLabels,binding))return label+' '+bindingLabels[binding];
 if(entry.detail==='Environment set to sandbox')return 'Switched Square to Sandbox';
 if(entry.detail==='Environment set to production')return 'Switched Square to Production';
 if(entry.detail==='Location updated'||entry.detail==='Location adopted')return label+' (Location ID)';
 if(entry.action==='connection_tested')return label+(entry.detail==='Connection succeeded'?' successfully':' (failed)');
 return label;
}
