import projects from '../data/projects.json';
import { t, l } from '../i18n.js';
import { makeView } from './view-utils.js';

const find = (slug) => projects.find((p) => p.slug === slug);

// FASE 1: vista de prueba. Layout, galería y panel info llegan en la fase 6.
export default makeView({
  name: 'project',
  title: ({ slug }) => find(slug).title,
  render: ({ slug }) => {
    const p = find(slug);
    return `
    <div class="view-stub">
      <p class="mono">[ ${t('stub.label')} ]</p>
      <h1>${p.title}</h1>
      <p class="mono">${l(p.category)} · ${p.year} · ${l(p.role)}</p>
      <p>${l(p.info)}</p>
      <p><a href="/">${t('header.projectsButton')}</a></p>
      <div class="stub-spacer" aria-hidden="true"></div>
    </div>`;
  }
});
