import projects from '../data/projects.json';
import { t, l } from '../i18n.js';
import { makeView } from './view-utils.js';

// FASE 1: vista de prueba. El hero, la ventana y el anillo llegan en las fases 2-5.
export default makeView({
  name: 'home',
  title: () => '',
  render: () => `
    <div class="view-stub">
      <p class="mono">[ ${t('stub.label')} ]</p>
      <h1>${t('a11y.viewHome')}</h1>
      <ul class="stub-list">
        ${projects
          .map((p) => `<li><a href="/projects/${p.slug}">${p.title}</a> <span class="mono">${l(p.category)}</span></li>`)
          .join('')}
      </ul>
      <div class="stub-spacer" aria-hidden="true"></div>
    </div>`
});
