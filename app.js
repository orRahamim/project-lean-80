const state = {
  recipes: [],
  tag: 'all',
};

const els = {
  search: document.getElementById('search'),
  category: document.getElementById('category'),
  mealType: document.getElementById('mealType'),
  sort: document.getElementById('sort'),
  prep: document.getElementById('prep'),
  protein: document.getElementById('protein'),
  storage: document.getElementById('storage'),
  servings: document.getElementById('servings'),
  recipes: document.getElementById('recipes'),
  quickTags: document.getElementById('quickTags'),
  countRecipes: document.getElementById('countRecipes'),
  avgProtein: document.getElementById('avgProtein'),
  avgCalories: document.getElementById('avgCalories'),
  countMealPrep: document.getElementById('countMealPrep'),
  drawer: document.getElementById('drawer'),
  backdrop: document.getElementById('backdrop'),
  drawerTitle: document.getElementById('drawerTitle'),
  drawerMeta: document.getElementById('drawerMeta'),
  drawerMacros: document.getElementById('drawerMacros'),
  drawerIngredients: document.getElementById('drawerIngredients'),
  drawerSteps: document.getElementById('drawerSteps'),
  drawerTags: document.getElementById('drawerTags'),
  closeDrawer: document.getElementById('closeDrawer'),
};

const quickTags = [
  'high-protein',
  'meal-prep',
  'freezer',
  'dessert',
  'breakfast',
  'family',
  'sweet',
  'protein',
];

function makeQuickTags() {
  const tagButtons = quickTags
    .map((tag) => {
      const activeClass = state.tag === tag ? 'active' : '';
      return `<button class="pill ${activeClass}" data-tag="${tag}">${tag}</button>`;
    })
    .join('');

  const allActiveClass = state.tag === 'all' ? 'active' : '';
  els.quickTags.innerHTML = `${tagButtons}<button class="pill ${allActiveClass}" data-tag="all">All</button>`;

  els.quickTags.querySelectorAll('[data-tag]').forEach((button) => {
    button.addEventListener('click', () => {
      state.tag = button.dataset.tag;
      makeQuickTags();
      render();
    });
  });
}

function uniq(items) {
  return [...new Set(items)];
}

function fillSelect(select, values, label) {
  const options = values
    .map((value) => `<option value="${value}">${value}</option>`)
    .join('');

  select.innerHTML = `<option value="all">${label}</option>${options}`;
}

function avg(items, key) {
  if (!items.length) return 0;

  const total = items.reduce((sum, recipe) => sum + recipe.nutrition[key], 0);
  return Math.round(total / items.length);
}

function card(recipe) {
  const tags = recipe.tags
    .map((tag) => `<span class="tag">${tag}</span>`)
    .join('');

  return `
    <article class="card">
      <div class="top">
        <div>
          <h2>${recipe.name}</h2>
          <div class="meta">
            ${recipe.servings} servings &middot; ${recipe.times.prep_min} min prep &middot; ${recipe.times.cook_min} min cook
          </div>
        </div>
      </div>
      <div class="macros">
        <div class="macro"><strong>${recipe.nutrition.calories}</strong><span>Calories</span></div>
        <div class="macro"><strong>${recipe.nutrition.protein_g}g</strong><span>Protein</span></div>
        <div class="macro"><strong>${recipe.nutrition.carbs_g}g</strong><span>Carbs</span></div>
        <div class="macro"><strong>${recipe.nutrition.fat_g}g</strong><span>Fat</span></div>
      </div>
      <div class="actions">
        <button class="btn primary" data-open="${recipe.id}">View recipe</button>
        <button class="btn ghost" data-copy="${recipe.id}">Copy name</button>
      </div>
      <div class="badges">${tags}</div>
    </article>
  `;
}

function getFiltered() {
  let items = [...state.recipes];
  const query = els.search.value.trim().toLowerCase();

  if (query) {
    items = items.filter((recipe) => JSON.stringify(recipe).toLowerCase().includes(query));
  }

  if (els.category.value !== 'all') {
    items = items.filter((recipe) => recipe.category === els.category.value);
  }

  if (els.mealType.value !== 'all') {
    items = items.filter((recipe) => recipe.mealType === els.mealType.value);
  }

  if (els.prep.value !== 'all') {
    items = items.filter((recipe) => recipe.times.prep_min <= Number(els.prep.value));
  }

  if (els.protein.value !== 'all') {
    items = items.filter((recipe) => recipe.nutrition.protein_g >= Number(els.protein.value));
  }

  if (els.storage.value === 'mealprep') {
    items = items.filter((recipe) => recipe.storage.meal_prep);
  }

  if (els.storage.value === 'freezer') {
    items = items.filter((recipe) => recipe.storage.freezer_friendly);
  }

  if (els.servings.value === '1') {
    items = items.filter((recipe) => recipe.servings === 1);
  }

  if (els.servings.value === '2') {
    items = items.filter((recipe) => recipe.servings === 2);
  }

  if (els.servings.value === '4') {
    items = items.filter((recipe) => recipe.servings >= 4);
  }

  if (state.tag !== 'all') {
    items = items.filter((recipe) => recipe.tags.includes(state.tag));
  }

  if (els.sort.value === 'protein') {
    items.sort((a, b) => b.nutrition.protein_g - a.nutrition.protein_g);
  }

  if (els.sort.value === 'caloriesAsc') {
    items.sort((a, b) => a.nutrition.calories - b.nutrition.calories);
  }

  if (els.sort.value === 'caloriesDesc') {
    items.sort((a, b) => b.nutrition.calories - a.nutrition.calories);
  }

  return items;
}

function closeRecipe() {
  els.drawer.classList.remove('open');
  els.backdrop.classList.remove('open');
  els.drawer.setAttribute('aria-hidden', 'true');
}

function openRecipe(id) {
  const recipe = state.recipes.find((item) => item.id === id);
  if (!recipe) return;

  els.drawerTitle.textContent = recipe.name;
  els.drawerMeta.innerHTML = `
    <span class="chip">${recipe.category}</span>
    <span class="chip soft">${recipe.mealType}</span>
    <span class="chip soft">${recipe.servings} servings</span>
    <span class="chip soft">${recipe.times.prep_min} min prep</span>
    <span class="chip soft">${recipe.times.cook_min} min cook</span>
    ${recipe.storage.meal_prep ? '<span class="chip ok">Meal Prep</span>' : ''}
    ${recipe.storage.freezer_friendly ? '<span class="chip ok">Freezer</span>' : ''}
  `;

  els.drawerMacros.innerHTML = `
    <div class="macro"><strong>${recipe.nutrition.calories}</strong><span>Calories</span></div>
    <div class="macro"><strong>${recipe.nutrition.protein_g}g</strong><span>Protein</span></div>
    <div class="macro"><strong>${recipe.nutrition.carbs_g}g</strong><span>Carbs</span></div>
    <div class="macro"><strong>${recipe.nutrition.fat_g}g</strong><span>Fat</span></div>
  `;

  els.drawerIngredients.innerHTML = recipe.ingredients
    .map((ingredient) => `<li>${ingredient}</li>`)
    .join('');

  els.drawerSteps.innerHTML = recipe.steps
    .map((step) => `<li>${step}</li>`)
    .join('');

  els.drawerTags.innerHTML = recipe.tags
    .map((tag) => `<span class="tag">${tag}</span>`)
    .join('');

  els.drawer.classList.add('open');
  els.backdrop.classList.add('open');
  els.drawer.setAttribute('aria-hidden', 'false');
}

function render() {
  const items = getFiltered();

  els.recipes.innerHTML = items.map(card).join('') || `
    <article class="card">
      <h2>No recipes found</h2>
      <p>Try a different filter or clear the tag chips.</p>
    </article>
  `;

  els.countRecipes.textContent = items.length;
  els.avgProtein.textContent = `${avg(items, 'protein_g')}g`;
  els.avgCalories.textContent = avg(items, 'calories');
  els.countMealPrep.textContent = items.filter((recipe) => recipe.storage.meal_prep).length;

  els.recipes.querySelectorAll('[data-open]').forEach((button) => {
    button.addEventListener('click', () => openRecipe(button.dataset.open));
  });

  els.recipes.querySelectorAll('[data-copy]').forEach((button) => {
    button.addEventListener('click', () => {
      const recipe = state.recipes.find((item) => item.id === button.dataset.copy);
      navigator.clipboard?.writeText(recipe.name);
      button.textContent = 'Copied';

      setTimeout(() => {
        button.textContent = 'Copy name';
      }, 1200);
    });
  });
}

async function init() {
  const response = await fetch('./recipes-v2.json', { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`Failed to load recipes: ${response.status}`);
  }

  const data = await response.json();

  state.recipes = data;
  document.getElementById('miniRecipes').textContent = `${data.length} recipes`;

  fillSelect(els.category, uniq(data.map((recipe) => recipe.category)), 'All categories');
  fillSelect(els.mealType, uniq(data.map((recipe) => recipe.mealType)), 'All meal types');

  [
    els.search,
    els.category,
    els.mealType,
    els.sort,
    els.prep,
    els.protein,
    els.storage,
    els.servings,
  ].forEach((element) => element.addEventListener('input', render));

  [
    els.category,
    els.mealType,
    els.sort,
    els.prep,
    els.protein,
    els.storage,
    els.servings,
  ].forEach((element) => element.addEventListener('change', render));

  makeQuickTags();
  render();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  }
}

els.closeDrawer.addEventListener('click', closeRecipe);
els.backdrop.addEventListener('click', closeRecipe);

init().catch(() => {
  els.recipes.innerHTML = `
    <article class="card">
      <h2>Could not load recipes</h2>
      <p>Please refresh the page to retry.</p>
    </article>
  `;
});

