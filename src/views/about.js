import { t } from '../i18n.js';
import { makeView } from './view-utils.js';

// FASE 1: vista de prueba. El timeline llega en la fase 8.
export default makeView({
  name: 'about',
  title: () => t('a11y.viewAbout'),
  render: () => `
    <div class="view-stub">
      <p class="mono">[ ${t('stub.label')} ]</p>
      <h1>${t('a11y.viewAbout')}</h1>
      <p>${t('about.text')}</p>
      <div class="stub-spacer" aria-hidden="true"></div>
    </div>`
});
