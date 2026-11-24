import {SECTION_IDS,validateClauses,renderMarkup} from './contract-clauses.mjs?v=2.11.0';

export const wordingPath='/settings/contract/wording';
export const tabs={cover:['cover'],terms:['terms-a','terms-b','terms-c'],checkoff:['addendum']};
export const sectionNames={cover:'Cover page','terms-a':'Terms · page 2','terms-b':'Terms · page 3','terms-c':'Terms · page 4',addendum:'Check-off list'};
export const tabNames={cover:'Cover page',terms:'Terms',checkoff:'Check-off list'};
export const tabFor=id=>Object.keys(tabs).find(key=>tabs[key].includes(id));
export const versionName=version=>'wording-'+Number(version);
export const pinned=(section,clause)=>section.id==='cover'&&['intro','fee-followup'].includes(clause?.id);

export function emptyDocument(){
 return {version:1,sections:SECTION_IDS.map(id=>({id,heading:'',clauses:[]}))};
}

export function paragraphs(value){
 return value.split(/\n\s*\n/).map(text=>text.trim().replace(/\n/g,'[br]')).filter(Boolean);
}

export function numbering(document){
 const numbers=new Map();
 for(const section of document.sections)for(const clause of section.clauses)numbers.set(clause.id,numbers.size+1);
 return numbers;
}

export function wrapSelection(value,start,end,tag){
 if(start===end||!['b','u'].includes(tag))return null;
 const selected=value.slice(start,end);
 if(!selected.trim()||/\n\s*\n/.test(selected))return null;
 return '['+tag+']'+selected+'[/'+tag+']';
}

export function editClause(document,section,index,action,{id,destination}={}){
 const entries=section.clauses,entry=entries[index];
 switch(action){
  case 'up':
  case 'down': {
   const next=index+(action==='up'?-1:1);
   if(!entries[next]||pinned(section,entry)||pinned(section,entries[next]))return null;
   entries.splice(next,0,entries.splice(index,1)[0]);
   return entry;
  }
  case 'relocate': {
   if(!destination||destination===section||destination.clauses.length>=40)return null;
   const before=destination.id!=='cover'?-1:entry.id==='intro'?0:
    destination.clauses.findIndex(clause=>clause.id==='fee-followup');
   destination.clauses.splice(before<0?destination.clauses.length:before,0,entries.splice(index,1)[0]);
   return entry;
  }
  case 'remove': return entries.splice(index,1)[0];
  case 'restore':
   if(entries.length>=40)return null;
   entries.splice(index,0,destination);
   return destination;
  case 'add': {
   if(entries.length>=40)return null;
   const clause={id,heading:'',body:[],items:[],needsInitials:false};
   const before=section.id==='cover'&&entry?.id==='fee-followup'?index:index+1;
   entries.splice(before,0,clause);
   return clause;
  }
  case 'item':
   if(entry.items.length>=24)return null;
   entry.items.push({label:String.fromCharCode(97+entry.items.length)+'.',body:[]});
   return entry;
  default:return null;
 }
}

export function wordingError(error){
 switch(error?.code||error?.message){
  case 'unknown_placeholder':return 'Unknown field. Choose a field from the list above.';
  case 'invalid_markup':return 'Use paired Bold and Underline markers within each paragraph.';
  case 'Invalid wording field':return 'Use up to 4,000 characters per paragraph and remove unsupported characters.';
  case 'Invalid list':return 'Use up to 24 paragraphs in each field.';
  case 'Invalid heading':return 'Use up to 240 characters in a heading.';
  case 'Invalid sub-item':
  case 'Empty clause':
  case 'invalid_clauses':return 'Enter wording for this clause and each sub-item.';
  case 'Clause document too large':return 'Draft exceeds the 48 KiB wording limit.';
  case 'wording_conflict':return 'Someone else changed this draft.';
  case 'invalid_note':return 'Enter a single line of up to 500 characters.';
  case 'version_not_found':return 'This version could not be found.';
  case 'helper_unavailable':return 'The contract helper could not make a preview. Try again.';
  default:return 'Contract wording could not complete that request. Try again.';
 }
}

export function validation(document){
 const errors=new Map();
 for(const section of document.sections){
  for(const clause of section.clauses){
   try{
    for(const text of [clause.heading,...clause.body,...clause.items.reduce((all,item)=>all.concat(item.body),[])]){
     if(text)renderMarkup(text);
    }
    if((!clause.heading&&!clause.body.length&&!clause.items.length)||clause.items.some(item=>!item.body.length)){
     throw Error('Empty clause');
    }
   }catch(error){errors.set(clause.id,wordingError(error));}
  }
 }
 let message='';
 try{validateClauses(document,true);}
 catch(error){
  if(error.location?.clauseId){
   const id=error.location.clauseId;
   if(!errors.has(id))errors.set(id,wordingError(error));
  }else if(!errors.size)message=wordingError(error);
 }
 return {errors,message,valid:!errors.size&&!message};
}

export function referenceLabels(document,references){
 const numbers=numbering(document);
 return references.map(reference=>{
  const source=numbers.has(reference.clauseId)?'Clause '+numbers.get(reference.clauseId):sectionNames[reference.sectionId];
  const field=reference.field==='item'?' · sub-item '+(reference.itemIndex+1):'';
  return source+field+' refers to '+reference.number;
 });
}

export function wordingSnapshot(document){
 return JSON.stringify(document);
}

export function hasWordingChange(document,published,etag){
 return Boolean(etag)&&wordingSnapshot(document)!==wordingSnapshot(published);
}
