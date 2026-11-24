import {actions,badge,button,card,field,group,heading,node} from './settings-controls.mjs?v=2.11.2';
import {settingsDate} from './settings-format.mjs?v=2.11.2';
import {editClause,emptyDocument,hasWordingChange,numbering,paragraphs,pinned,referenceLabels,sectionNames,
 tabFor,tabNames,tabs,validation,versionName,wordingError,wordingPath,wordingSnapshot,wrapSelection} from './settings-wording-format.mjs?v=2.11.2';

const timing='Changes appear on contracts created after you publish. Contracts already issued keep the wording they were created with.';
const publicationTiming='Staff see the new wording on contracts created after publication. Issued contracts keep their wording.';
const small={small:true};
const lockedBlocks={
 summary:['Booking summary','Booking number · Renter · Event date'],
 fees:['Rental fee and payment table','Rental fee · Amount paid · Remaining balance'],
 extras:['Extras list','Extra items and quantities'],
 signatures:['Signature blocks','Renter __________________ · Venue representative __________________']
};

function lockedBlock(key){
 const [title,detail]=lockedBlocks[key];
 const block=group('settings-note',card(title,node('p','muted','Locked · Filled in automatically for each booking. This block is read-only.'),
  node('p','muted settings-note',detail)));
 block.setAttribute('data-locked','');
 return block;
}

function toggleMenu(control,panel){
 panel.hidden=!panel.hidden;
 control.setAttribute('aria-expanded',String(!panel.hidden));
}

export function wordingSettings({content,banner,apiCall,write,modal,mask,actor,signal,toast,guardNavigation,route,access}){
 let showAllSections=route.query.get('view')==='locked-blocks';
 let current,published,documentValue,editable,revision=0,savedRevision=0,activeTab=showAllSections?'cover':'terms';
 let saving,timer,lastField,removed,undoToast,undoTimer,estimate,conflict=false,working=false,previewedRevision=-1;
 let referenceRequest=0,errorState,historyOpen=false,historyButton;
 const errors=new Map();
 const call=(suffix='',method='GET',body)=>apiCall(wordingPath+suffix,method,body);
 const unsaved=()=>revision!==savedRevision||Boolean(saving);
 guardNavigation(unsaved);
 function beforeUnload(event){
  if(unsaved()){event.preventDefault();event.returnValue='';}
 }
 window.addEventListener('beforeunload',beforeUnload);
 signal.addEventListener('abort',()=>window.removeEventListener('beforeunload',beforeUnload),{once:true});
 const status=node('span','muted');
 status.setAttribute('role','status');
 const announcement=node('p','wording-announcement');
 announcement.setAttribute('aria-live','polite');
 const entries=group('settings-note');
 const draftBanner=group('alert alert-warning square-result');
 const conflictBanner=group('alert alert-warning settings-note');
 conflictBanner.setAttribute('role','alert');
 const errorBanner=node('p','alert alert-danger settings-note');
 errorBanner.setAttribute('role','alert');
 const pages=node('p','muted settings-note');
 const warning=node('p','alert alert-warning settings-note','Over 6 pages. Preview before publishing.');
 const referenceResults=group('settings-note');
 referenceResults.setAttribute('aria-live','polite');
 const previewButton=button('Preview PDF',preview);
 const publishButton=button('Publish',()=>previewedRevision===revision?publishDialog():preview(),{primary:true});
 const discardButton=button('Discard draft',discard,small);
 const retryButton=button('Retry save',()=>save(),small);
 const rebaseButton=button('Save draft against current version',()=>{
  revision++;
  save();
 },small);
 const referencesButton=button('Check references',checkReferences,small);
 const tabControls={};
 const canPublish=()=>editable&&!conflict&&!working&&errorState.valid&&!staleDraft()&&
  (unsaved()?wordingSnapshot(documentValue)!==wordingSnapshot(published):hasWordingChange(documentValue,published,current.etag));

 function removeUndo(){
  clearTimeout(undoTimer);
  undoToast?.remove();
  removed=null;
 }
 signal.addEventListener('abort',()=>{clearTimeout(timer);removeUndo();},{once:true});

 function markConflict(){
  conflict=true;
  clearTimeout(timer);
  status.textContent='Draft could not be saved';
  update();
 }

 function staleDraft(){return Boolean(current.etag)&&current.draft?.base_version!==current.baseVersion;}

 function update(){
  errorState=validation(documentValue);
  for(const [id,{error,inputs}] of errors){
   error.textContent=errorState.errors.get(id)||'';
   error.hidden=!error.textContent;
   for(const input of inputs)input.setAttribute('aria-invalid',String(!error.hidden));
  }
  errorBanner.hidden=!errorState.message;
  errorBanner.textContent=errorState.message;
  conflictBanner.hidden=!conflict;
  draftBanner.hidden=!current.etag&&!unsaved();
  publishButton.disabled=!canPublish();
  rebaseButton.hidden=!editable||!staleDraft();
  rebaseButton.disabled=working||Boolean(saving)||conflict||!errorState.valid;
  previewButton.disabled=working||!errorState.valid;
  referencesButton.disabled=!editable||!errorState.valid;
  discardButton.disabled=working||Boolean(saving)||conflict;
  pages.textContent=estimate?.estimatedPages?'Pages estimate · About '+estimate.estimatedPages+' pages. Fee and signature pages are fixed.':'Pages estimate unavailable';
  warning.hidden=!estimate?.pageWarning;
 }

 async function save(){
  clearTimeout(timer);
  if(saving)return saving;
  if(!unsaved()||conflict||working||!validation(documentValue).valid)return false;
  const version=revision;
  const clauses=JSON.parse(wordingSnapshot(documentValue));
  banner.hidden=true;
  retryButton.hidden=true;
  status.textContent='Saving…';
  saving=(async()=>{
   try{
    const result=await call('/draft','PUT',{clauses,baseVersion:current.baseVersion,etag:current.etag});
    if(signal.aborted)return false;
    current.etag=result.etag;
    current.draft={base_version:result.baseVersion};
    savedRevision=version;
    estimate=result;
    status.textContent=version===revision?'Saved':'';
    return true;
   }catch(error){
    if(signal.aborted)return false;
    if(error.status===409)markConflict();
    else{
     status.textContent='Draft could not be saved';
     banner.textContent=wordingError(error);
     banner.hidden=false;
     retryButton.hidden=false;
    }
    return false;
   }finally{
    saving=null;
    if(!signal.aborted){
     update();
     if(version!==revision&&!conflict)queueSave();
    }
   }
  })();
  update();
  return saving;
 }

 function queueSave(){
  clearTimeout(timer);
  if(!conflict&&errorState.valid)timer=setTimeout(save,500);
 }

 function edited(message){
  revision++;
  status.textContent='';
  referenceResults.replaceChildren();
  referencesButton.setAttribute('aria-expanded','false');
  if(message)announcement.textContent=message;
  update();
  queueSave();
 }

 function selectTab(tab){
  activeTab=tab;
  showAllSections=false;
  renderEntries();
 }

 function renderEntries(focusId){
  errors.clear();
  lastField=null;
  for(const [key,control] of Object.entries(tabControls)){
   control.classList.toggle('btn-primary',key===activeTab);
   control.classList.toggle('btn-quiet',key!==activeTab);
   control.setAttribute('aria-pressed',String(key===activeTab));
  }
  const numbers=numbering(documentValue);
  entries.replaceChildren();
  for(const section of documentValue.sections){
   if(!showAllSections&&!tabs[activeTab].includes(section.id))continue;
   const label=sectionNames[section.id];
   const region=node('section','settings-note');
   region.setAttribute('aria-label',label);
   region.append(node('h3','card-title',label));
   if(section.id==='cover'&&section.clauses[0]?.id!=='intro')region.append(lockedBlock('summary'));
   for(const [index,clause] of section.clauses.entries()){
    if(section.id==='cover'&&clause.id==='fee-followup')region.append(lockedBlock('fees'));
    region.append(clauseCard(section,clause,index,numbers.get(clause.id)));
    if(section.id==='cover'&&index===0&&clause.id==='intro')region.append(lockedBlock('summary'));
   }
   if(!section.clauses.length)region.append(actions(button('Add clause',()=>operate(section,-1,'add'),small)));
   if(section.id==='cover'){
    if(!section.clauses.some(clause=>clause.id==='fee-followup'))region.append(lockedBlock('fees'));
    region.append(lockedBlock('extras'));
   }
   if(section.id==='terms-c'||section.id==='addendum')region.append(lockedBlock('signatures'));
   entries.append(region);
  }
  update();
  if(focusId)document.getElementById(focusId)?.focus();
 }

 function operate(section,index,action,destination){
  const clause=editClause(documentValue,section,index,action,{
   id:action==='add'?'c-'+crypto.randomUUID():undefined,destination
  });
  if(!clause)return;
  let focus='clause-'+clause.id+'-heading';
  if(action==='relocate'){activeTab=tabFor(destination.id);showAllSections=false;}
  if(action==='remove'){
   removeUndo();
   removed={clause,section,index};
   focus=null;
   undoToast=group('app-toast alert-info wording-undo',node('span','','Clause removed'));
   undoToast.append(button('Undo',()=>{
    if(!removed)return;
    const {section,index,clause}=removed;
    if(!editClause(documentValue,section,index,'restore',{destination:clause})){
     announcement.textContent='Make room in this section before restoring the clause.';
     return;
    }
    removeUndo();
    activeTab=tabFor(section.id);
    edited('Clause restored.');
    renderEntries('clause-'+clause.id+'-heading');
   },small));
   document.body.append(undoToast);
   undoTimer=setTimeout(()=>{
    if(undoToast.contains(document.activeElement))tabControls[activeTab].focus();
    removeUndo();
   },10000);
  }
  if(action==='item')focus='clause-'+clause.id+'-item-'+(clause.items.length-1);
  const messages={up:'Clause moved up.',down:'Clause moved down.',relocate:'Clause moved to '+sectionNames[destination?.id]+'.',
   remove:'Clause removed. Undo is available.',add:'Clause added.',item:'Sub-item added.'};
  edited(messages[action]);
  renderEntries(focus);
  if(action==='remove')undoToast.querySelector('button').focus();
 }

 function clauseCard(section,clause,index,number){
  const id='clause-'+clause.id;
  const element=node('article','card settings-note wording-clause');
  element.dataset.clauseCard=clause.id;
  element.setAttribute('aria-labelledby',id+'-number');
  const title=node('h4','card-title','Clause '+number);
  title.id=id+'-number';
  element.append(group('card-header',title));
  const inputs=[];
  function input(label,part,value,onInput){
   const single=part==='heading';
   const control=node(single?'input':'textarea',single?'form-input':'form-textarea');
   control.autocomplete='off';
   if(single)control.maxLength=240;
   else control.rows=2;
   control.value=single?value:value.join('\n\n');
   control.setAttribute('aria-describedby',id+'-error');
   control.addEventListener('focus',()=>{lastField=control;});
   control.addEventListener('input',()=>{onInput(single?control.value:paragraphs(control.value));edited();});
   inputs.push(control);
   element.append(field(label,id+'-'+part,control));
  }
  input('Heading','heading',clause.heading,value=>{clause.heading=value;});
  input('Body','body',clause.body,value=>{clause.body=value;});
  for(const [itemIndex,item] of clause.items.entries())input('Sub-item '+item.label,'item-'+itemIndex,item.body,value=>{item.body=value;});
  const initials=node('input','form-checkbox');
  initials.type='checkbox';
  initials.checked=clause.needsInitials;
  initials.setAttribute('role','switch');
  initials.addEventListener('change',()=>{clause.needsInitials=initials.checked;edited();});
  const initialLabel=node('label','form-checkbox-label');
  initialLabel.append(initials,'Needs renter initials');
  const error=node('p','alert alert-danger settings-note');
  error.id=id+'-error';
  error.setAttribute('aria-live','polite');
  errors.set(clause.id,{error,inputs});
  element.append(initialLabel,error);
  const canMove=neighbor=>neighbor&&!pinned(section,clause)&&!pinned(section,neighbor);
  const movePanel=group('alert alert-info settings-note',node('strong','','Move to section'));
  movePanel.hidden=true;
  movePanel.setAttribute('role','group');
  movePanel.setAttribute('aria-label','Move to section');
  movePanel.append(actions(...documentValue.sections.filter(target=>target!==section).map(target=>
   button(sectionNames[target.id],()=>operate(section,index,'relocate',target),{...small,disabled:target.clauses.length>=40}))));
  const move=button('Move to section',()=>toggleMenu(move,movePanel),small);
  move.setAttribute('aria-expanded','false');
  const clauseActions=group('wording-clause-actions',actions(
   button('Move up',()=>operate(section,index,'up'),{...small,disabled:!canMove(section.clauses[index-1])}),
   button('Move down',()=>operate(section,index,'down'),{...small,disabled:!canMove(section.clauses[index+1])}),
   move,button('Remove',()=>operate(section,index,'remove'),small),
   button('Add clause below',()=>operate(section,index,'add'),{...small,disabled:section.clauses.length>=40}),
   button('Add sub-item',()=>operate(section,index,'item'),{...small,disabled:clause.items.length>=24})),movePanel);
  const more=button('…',()=>{
   const opened=clauseActions.classList.toggle('is-open');
   more.setAttribute('aria-expanded',String(opened));
   if(!opened){movePanel.hidden=true;move.setAttribute('aria-expanded','false');}
  },small);
  more.setAttribute('aria-label','Clause actions');
  more.setAttribute('aria-expanded','false');
  element.append(group('wording-phone-actions',more),clauseActions);
  element.addEventListener('keydown',event=>{
   if(event.key!=='Escape')return;
   if(!movePanel.hidden){toggleMenu(move,movePanel);move.focus();}
   else if(clauseActions.classList.contains('is-open')){more.click();more.focus();}
  });
  return element;
 }

 function insert(name,tag){
  const input=lastField||entries.querySelector('textarea');
  if(!input)return;
  const {selectionStart:start,selectionEnd:end}=input;
  const value=tag?wrapSelection(input.value,start,end,name):'{'+name+'}';
  if(value!==null&&(input.maxLength<0||input.value.length-end+start+value.length<=input.maxLength)){
   input.setRangeText(value,start,end,'end');
   input.dispatchEvent(new Event('input'));
  }
  input.focus();
 }

 async function checkReferences(){
  const version=revision,request=++referenceRequest;
  if(referencesButton.getAttribute('aria-expanded')==='true'){
   referencesButton.setAttribute('aria-expanded','false');
   referenceResults.replaceChildren();
   return;
  }
  referencesButton.setAttribute('aria-expanded','true');
  referenceResults.textContent='Checking references…';
  try{
   const result=await call('/validate','POST',{clauses:documentValue});
   if(version!==revision||request!==referenceRequest||signal.aborted||referencesButton.getAttribute('aria-expanded')!=='true')return;
   estimate=result;
   const list=node('ul');
   list.append(...referenceLabels(documentValue,result.references).map(label=>node('li','',label)));
   referenceResults.replaceChildren(card('Clause references',list.children.length?list:node('p','','No clause number references found.')));
   update();
  }catch(error){
   if(version===revision&&request===referenceRequest&&!signal.aborted&&referencesButton.getAttribute('aria-expanded')==='true')referenceResults.textContent=wordingError(error);
  }
 }

 async function discard(){
  if(working||saving||conflict)return;
  working=true;
  clearTimeout(timer);
  const confirmedRevision=revision;
  update();
  try{
   if(current.etag)await call('/draft','DELETE',{etag:current.etag});
   const latest=await call();
   signal.throwIfAborted();
   if(confirmedRevision!==revision){
    if(latest.etag||latest.baseVersion!==current.baseVersion)markConflict();
    else{
     current=latest;
     status.textContent='New edits were kept.';
     queueSave();
    }
    return;
   }
   initialize(latest);
   toast('Draft discarded');
   tabControls[activeTab]?.focus();
  }catch(error){
   if(signal.aborted)return;
   if(error.status===409)markConflict();
   else{banner.textContent=wordingError(error);banner.hidden=false;queueSave();}
  }finally{
   working=false;
   if(!signal.aborted)update();
  }
 }

 function preview(){
  const panel=group('settings-note',node('p','muted','Preparing sample PDF…'));
  const revisionAtPreview=revision;
  const handle=modal('Preview PDF',[node('p','','Sample booking. The printed layout follows the template.'),panel],
   'Publish',dialog=>{dialog.close();publishDialog();},true);
  handle.footer.firstElementChild.textContent='Close';
  let pdfUrl;
  handle.onClose=()=>{if(pdfUrl)URL.revokeObjectURL(pdfUrl);};
  call('/preview','POST',editable?{clauses:documentValue}:{}).then(result=>{
   if(!handle.backdrop.isConnected||signal.aborted)return;
   const bytes=Uint8Array.from(atob(result.base64),character=>character.charCodeAt(0));
   if(String.fromCharCode(...bytes.slice(0,5))!=='%PDF-')throw Error('Invalid PDF');
   pdfUrl=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));
   const frame=node('iframe','wording-paper');
   frame.title='Sample contract PDF';
   frame.src=pdfUrl;
   const open=node('a','wording-pdf-link','Open sample PDF in a new tab');
   open.href=pdfUrl;
   open.target='_blank';
   open.rel='noopener noreferrer';
   panel.replaceChildren(frame,open);
   if(result.pageCountEstimated===true){
    const unit=result.pageCount===1?' page':' pages';
    panel.append(node('p','muted','Estimated length: '+result.pageCount+unit));
   }
   previewedRevision=revisionAtPreview;
   handle.submit.disabled=!canPublish();
  }).catch(()=>{
   if(handle.backdrop.isConnected)panel.replaceChildren(node('p','alert alert-warning',wordingError({code:'helper_unavailable'})));
  });
  return handle;
 }

 function publishDialog(){
  if(!canPublish())return;
  const note=node('input','form-input');
  note.maxLength=500;
  note.autocomplete='off';
  modal('Publish contract wording',[node('p','',publicationTiming),field('What changed?','wording-publish-note',note)],'Publish',async handle=>{
   if(handle.locked)return;
   handle.locked=true;
   handle.submit.disabled=true;
   if(saving)await saving;
   if(unsaved()&&!conflict)await save();
   handle.locked=false;
   if(!handle.backdrop.isConnected)return;
   handle.submit.disabled=false;
   if(unsaved()||!canPublish()){
    handle.error.textContent=conflict?wordingError({code:'wording_conflict'}):'Save the draft before publishing.';
    handle.error.hidden=false;
    return;
   }
   commit('/publish',{baseVersion:current.baseVersion,etag:current.etag,...(note.value.trim()?{note:note.value.trim()}:{})},handle);
  });
 }

 function commit(suffix,body,handle){
  return write(async()=>{
   try{return await call(suffix,'POST',body);}
   catch(error){if(error.status===409)markConflict();throw error;}
  },handle,async result=>{
   let latest;
   try{latest=await call();}
   catch(error){
    if(!signal.aborted){
     handle.close(true);
     markConflict();
     banner.textContent='Wording was published. Reload to see the new version.';
     banner.hidden=false;
    }
    return;
   }
   signal.throwIfAborted();
   handle.close(true);
   if(historyOpen){
    current.baseVersion=latest.baseVersion;
    current.published=latest.published;
    published=latest.published?.format==='clauses'?latest.published.clauses:null;
    if(!unsaved()&&!current.etag)initialize(latest);
    else update();
    await history();
   }else{
    initialize(latest);
    previewButton.focus({preventScroll:true});
   }
   if(!signal.aborted)toast('Contract wording published · '+versionName(result.version));
  },wordingError);
 }

 async function history(){
  if(working)return;
  if(saving)await saving;
  if(unsaved()&&!conflict)await save();
  if(signal.aborted||working)return;
  working=true;
  historyButton.disabled=true;
  try{
   const {versions}=await call('/versions');
   if(signal.aborted)return;
   historyOpen=true;
   const grid=node('table','ledger-table');
   grid.id='wording-history-table';
   const head=grid.createTHead().insertRow();
   for(const label of ['Version','Date','Who','Note','Actions'])head.append(node('th','',label));
   const body=grid.createTBody();
   for(const version of versions){
    const row=body.insertRow();
    row.className='ledger-row';
    const name=versionName(version.version);
    const selected=version.version===current.baseVersion;
    row.insertCell().append(node('strong','',name));
    if(selected)row.cells[0].append(' ',badge('Published'));
    row.insertCell().textContent=settingsDate(version.published_at||version.created_at);
    row.insertCell().textContent=version.created_by===actor?'You':displayMetadata(version.created_by||'');
    row.insertCell().textContent=displayMetadata(version.note||'');
    const action=row.insertCell();
    if(!selected)action.append(group('row-actions ledger-row-mobile-actions',button('Roll back to this version',()=>{
     modal('Roll back to '+name,[node('p','','Publish this wording again as a new version. '+publicationTiming)],'Roll back',
      handle=>commit('/rollback/'+Number(version.version),{baseVersion:current.baseVersion},handle));
    },{...small,disabled:unsaved()||conflict})));
   }
   const back=button('Back to wording',()=>{showEditor();historyButton.focus();});
   content.replaceChildren(heading('Version history',back),banner,conflictBanner,group('ledger-table-wrap',grid));
   if(!conflict)back.focus();
  }catch(error){
   if(!signal.aborted){banner.textContent=wordingError(error);banner.hidden=false;}
  }finally{
   working=false;
   historyButton.disabled=false;
   if(!signal.aborted&&unsaved()&&!conflict)queueSave();
  }
 }

 function displayMetadata(value){
  const masked=mask(value);
  return access.elevated?masked:masked.replace(/\bsuper admin\b/gi,'Ledger account');
 }

 function showEditor(){
  historyOpen=false;
  const author=current.published?.created_by===actor?'you':displayMetadata(current.published?.created_by||'Ledger account');
  const line=node('p','muted',current.published?
   'Published: '+versionName(current.baseVersion)+', '+settingsDate(current.published.published_at||current.published.created_at)+', by '+author:
   'Published: Built-in wording');
  historyButton=button('Version history',history);
  content.replaceChildren(heading('Contract wording',previewButton,publishButton,historyButton),line,
   node('p','muted settings-note',timing),banner,conflictBanner,draftBanner);
  if(editable){
   const tabBar=actions(...Object.entries(tabNames).map(([key,name])=>{
    tabControls[key]=button(name,()=>selectTab(key),small);
    return tabControls[key];
   }));
   tabBar.setAttribute('role','group');
   tabBar.setAttribute('aria-label','Wording section');
   const chips=group('filter-chips settings-note');
   for(const name of current.allowedPlaceholders){
    const chip=button('{'+name+'}',()=>insert(name,false));
    chip.className='filter-chip';
    chips.append(chip);
   }
   content.append(tabBar,pages,warning,errorBanner,node('p','muted settings-note',
    'Clause numbers update automatically. Check any clause numbers mentioned in the wording.'),actions(referencesButton),
    referenceResults,group('settings-note',card('Fields you can use',node('p','muted',
     'Choose a field to insert it at the cursor. Select a phrase to format it.'),chips,
     actions(button('Bold',()=>insert('b',true),small),button('Underline',()=>insert('u',true),small)))),
    entries,announcement);
   renderEntries();
  }else{
   content.append(node('p','muted settings-note',
    'This version uses an earlier wording format. You can preview it or restore another version from history.'));
   update();
  }
 }

 function initialize(result){
  removeUndo();
  clearTimeout(timer);
  current=result;
  conflict=false;
  revision=savedRevision=0;
  previewedRevision=-1;
  status.textContent=result.etag?'Saved':'';
  banner.hidden=true;
  retryButton.hidden=true;
  estimate=result.validation;
  published=result.published?.format==='clauses'?result.published.clauses:null;
  const selected=result.draft||result.published;
  editable=!selected||selected.format==='clauses';
  documentValue=structuredCopy(selected?.format==='clauses'?selected.clauses:emptyDocument());
  referenceResults.replaceChildren();
  referencesButton.setAttribute('aria-expanded','false');
  showEditor();
 }

 draftBanner.append(group('square-row',node('strong','','Draft: changes not published'),group('page-actions',status,retryButton,rebaseButton,discardButton)));
 const reloadButton=button('Reload',async()=>{
  if(working||unsaved()&&!window.confirm('Reload the saved draft and discard your unsaved edits?'))return;
  working=true;
  reloadButton.disabled=true;
  const confirmedRevision=revision;
  try{
   const latest=await call();
   signal.throwIfAborted();
   if(confirmedRevision!==revision){
    status.textContent='The editor changed during reload. Reload again to discard those edits.';
    return;
   }
   initialize(latest);
   (tabControls[activeTab]?.isConnected?tabControls[activeTab]:previewButton).focus();
  }catch(error){
   if(!signal.aborted){banner.textContent=wordingError(error);banner.hidden=false;}
  }finally{
   working=false;
   reloadButton.disabled=false;
   if(!signal.aborted)update();
  }
 },small);
 conflictBanner.append(group('square-row',node('strong','','Someone else changed this draft.'),reloadButton));
 return initialize;
}

function structuredCopy(document){return JSON.parse(JSON.stringify(document));}
