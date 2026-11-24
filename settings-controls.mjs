export function node(tag,className='',text){
 const element=document.createElement(tag);
 if(className)element.className=className;
 if(text!==undefined)element.textContent=text;
 return element;
}

export function button(text,action,{primary=false,small=false,disabled=false}={}){
 const control=node('button','btn btn-'+(primary?'primary':'quiet')+(small?' btn-sm':''),text);
 control.type='button';
 control.disabled=disabled;
 control.addEventListener('click',action);
 return control;
}

export function group(className,...children){
 const element=node('div',className);
 element.append(...children);
 return element;
}

export function heading(label,...actions){
 const header=group('page-header',group('page-title-group',node('h2','',label)));
 if(actions.length)header.append(group('page-actions',...actions));
 return header;
}

export function field(label,id,input){
 input.id=id;
 const caption=node('label','form-label',label);
 caption.htmlFor=id;
 return group('form-group',caption,input);
}

export function card(title,...children){
 return group('card',group('card-header',node('h3','card-title',title)),...children);
}

export function actions(...controls){
 return group('page-actions settings-note',...controls);
}

export function statusRow(label,detail){
 return group('square-row',group('square-secret',label),detail);
}

export function badge(label,tone='paid'){
 return node('span','badge badge-'+tone,label);
}

export function checkbox(label,checked,onChange,{switchControl=false}={}){
 const input=node('input','form-checkbox');
 input.type='checkbox';
 input.checked=Boolean(checked);
 const caption=node('label','form-checkbox-label');
 caption.append(input,switchControl?node('span','',checked?'On':'Off'):label);
 if(switchControl){
  caption.classList.add('settings-switch');
  input.setAttribute('role','switch');
  input.setAttribute('aria-label',label);
 }
 input.addEventListener('change',()=>{
  const desired=input.checked;
  input.checked=Boolean(checked);
  onChange(desired);
 });
 return caption;
}
