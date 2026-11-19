// Accept one address in dot-atom form. Reject lists, display names and headers.
export function validDocumentEmail(value) {
 if (typeof value !== 'string' || value.length > 254) return false;
 const [local, domain, extra] = value.split('@');
 return extra === undefined && local.length <= 64 &&
  /^[a-z0-9_!#$%&'*+\/=?^`{|}~-]+(?:\.[a-z0-9_!#$%&'*+\/=?^`{|}~-]+)*$/i.test(local) &&
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(domain || '');
}
