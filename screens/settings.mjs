import overview from './overview.mjs?v=2.9.1';
export {mountSettings as mount} from '../settings-ui.mjs?v=2.9.1';
export const styles='';
export default data => overview(data)
 .replace(/<main class="main-content">[\s\S]*?<\/main>/,'<main class="main-content" id="settings-screen"></main>')
 .replace('O’Ryan Ledger</span>','Settings</span>');
