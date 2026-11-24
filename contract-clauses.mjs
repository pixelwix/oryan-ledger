export const SECTION_IDS = Object.freeze(['cover', 'terms-a', 'terms-b', 'terms-c', 'addendum']);
export const PLACEHOLDERS = Object.freeze(['today', 'client', 'date', 'hours', 'type', 'contractNumber', 'eventDate', 'agreementDate', 'total', 'remaining', 'securityHours', 'contact']);
export const MAX_DOCUMENT_BYTES = 48 * 1024;
const colors = new Set(['#000000', '#171717', '#866620', '#ff0000']);
function utf8Size(text) {
  let bytes = 0;
  for (const char of text) {
    const point = char.codePointAt(0);
    bytes += point < 128 ? 1 : point < 2048 ? 2 : point < 65536 ? 3 : 4;
  }
  return bytes;
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

export function renderMarkup(text, fields = {}) {
  if (typeof text !== 'string' || text.length > 4000 || !text.trim() ||
      /[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u.test(text)) {
    throw new Error('Invalid wording field');
  }
  if (text.includes('@@')) throw new Error('Reserved contract slot delimiter');
  const stack = [];
  let output = '';
  let offset = 0;
  for (const match of text.matchAll(/\[br\]|\[(\/?(?:b|u|color)(?==|\s|\])[^\[\]]*)\]|[{}]/g)) {
    // Consume a whole placeholder before handling a stray brace.
    if (match.index < offset) continue;
    output += escapeHtml(text.slice(offset, match.index));
    offset = match.index + match[0].length;
    if (match[0] === '[br]') {
      output += '<br>';
      continue;
    }
    if (match[0] === '{') {
      const field = /^\{([a-zA-Z]+)\}/.exec(text.slice(match.index))?.[1];
      if (!PLACEHOLDERS.includes(field)) throw new Error('unknown_placeholder');
      offset = match.index + field.length + 2;
      const value = Object.hasOwn(fields, field) ? fields[field] : '{' + field + '}';
      if (typeof value !== 'string' || value.length > 4000) throw new Error('Invalid booking field');
      if (value.includes('@@')) throw new Error('Reserved contract slot delimiter');
      output += escapeHtml(value);
      continue;
    }
    const tag = /^(\/?)(b|u|color)(?:=(#[a-f0-9]{6}))?$/.exec(match[1] ?? '');
    if (!tag) throw new Error('invalid_markup');
    const [, closing, name, color] = tag;
    const element = name === 'color' ? 'span' : name;
    if (closing) {
      if (color || stack.pop() !== name) throw new Error('invalid_markup');
      output += '</' + element + '>';
    } else {
      if (stack.length >= 3 || (name === 'color' ? !colors.has(color) : color !== undefined)) {
        throw new Error('invalid_markup');
      }
      stack.push(name);
      output += color ? '<span style="color:' + color + '">' : '<' + element + '>';
    }
  }
  if (stack.length) throw new Error('invalid_markup');
  return output + escapeHtml(text.slice(offset));
}

function record(value, keys) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
}

function list(value, max) {
  if (!Array.isArray(value) || value.length > max) throw new Error('Invalid list');
  return value;
}

export function validateClauses(document, strict = false) {
  if (!record(document, ['version', 'sections']) || document.version !== 1 ||
      list(document.sections, SECTION_IDS.length).length !== SECTION_IDS.length) {
    throw new Error('Invalid clause document');
  }
  const ids = new Set();
  const checked = (callback, location) => {
    try { return callback(); } catch (error) {
      error.location = {...location, ...error.location};
      throw error;
    }
  };
  for (const [index, section] of document.sections.entries()) {
    if (!record(section, ['id', 'heading', 'clauses']) || section.id !== SECTION_IDS[index]) {
      throw new Error('Invalid section');
    }
    if (strict && section.id === 'addendum' && section.heading !== '') throw new Error('Locked heading');
    checked(() => heading(section.heading), {sectionId: section.id, field: 'sectionHeading'});
    for (const clause of list(section.clauses, 40)) {
      const keys = ['id', 'heading', 'body', 'items'];
      if (strict || Object.hasOwn(clause ?? {}, 'needsInitials')) keys.push('needsInitials');
      if (!record(clause, keys) || ('needsInitials' in clause && typeof clause.needsInitials !== 'boolean') ||
          (strict && clause.id === 'addendum-title') ||
          typeof clause.id !== 'string' || !/^[a-z][a-z0-9-]{0,39}$/.test(clause.id) || ids.has(clause.id)) {
        throw new Error('Invalid or duplicate clause ID');
      }
      ids.add(clause.id);
      const location = {sectionId: section.id, clauseId: clause.id};
      checked(() => heading(clause.heading), {...location, field: 'heading'});
      checked(() => paragraphs(clause.body), {...location, field: 'body'});
      for (const [itemIndex, item] of list(clause.items, 24).entries()) {
        if (!record(item, ['label', 'body']) || typeof item.label !== 'string' ||
            !/^(?:[a-z][.)]|\d{1,2}[.)]|[•-])$/i.test(item.label) || !checked(() => paragraphs(item.body), {...location, field: 'item', itemIndex}).length) {
          throw new Error('Invalid sub-item');
        }
      }
      if (!clause.heading && !clause.body.length && !clause.items.length) throw new Error('Empty clause');
    }
  }
  if (utf8Size(JSON.stringify(document)) > MAX_DOCUMENT_BYTES) throw new Error('Clause document too large');
  return document;
}

function heading(value) {
  if (value === '') return;
  if (typeof value !== 'string' || value.length > 240) throw new Error('Invalid heading');
  renderMarkup(value);
}

function paragraphs(value) {
  const entries = list(value, 24);
  for (const [paragraph, text] of entries.entries()) {
    try { renderMarkup(text); } catch (error) {
      error.location = {paragraph};
      throw error;
    }
  }
  return entries;
}
