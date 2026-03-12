const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const form = document.getElementById('runway-form');
const presetList = document.getElementById('preset-list');
const calculateButton = document.getElementById('calculate-button');
const resetButton = document.getElementById('reset-button');
const emailCaptureForm = document.getElementById('email-capture-form');
const captureEmailInput = document.getElementById('capture-email');
const includeSnapshotCheckbox = document.getElementById('include-snapshot');
const copyEmailButton = document.getElementById('copy-email-button');
const copySummaryButton = document.getElementById('copy-summary-button');
const copyLinkButton = document.getElementById('copy-link-button');
const shareLinkButton = document.getElementById('share-link-button');
const captureStatus = document.getElementById('capture-status');
const shareStatus = document.getElementById('share-status');

const contactEmail = 'GaryTalbot1987@gmail.com';
let latestSnapshot = null;
let activePreset = 'custom';

const output = {
  runwayMonths: document.getElementById('runway-months'),
  summaryText: document.getElementById('summary-text'),
  totalFunds: document.getElementById('total-funds'),
  monthlyBurn: document.getElementById('monthly-burn'),
  cashOutDate: document.getElementById('cash-out-date'),
  monthlyIncome: document.getElementById('monthly-income'),
  comparisonList: document.getElementById('comparison-list'),
  bridgePlanList: document.getElementById('bridge-plan-list'),
  costCutList: document.getElementById('cost-cut-list'),
  recommendationList: document.getElementById('recommendation-list'),
  runwayZoneTag: document.getElementById('runway-zone-tag'),
  runwayZoneCopy: document.getElementById('runway-zone-copy'),
  scenarioActionList: document.getElementById('scenario-action-list'),
};

const defaultValues = Object.fromEntries(
  Array.from(form.elements)
    .filter((field) => field.name)
    .map((field) => [field.name, field.defaultValue])
);

const expenseLabels = {
  rent: 'Rent / mortgage',
  utilities: 'Utilities',
  groceries: 'Groceries',
  insurance: 'Insurance',
  transportation: 'Transportation',
  debt: 'Debt payments',
  phoneInternet: 'Phone / internet',
  misc: 'Subscriptions / misc',
};

const starterPresets = [
  {
    id: 'default',
    label: 'Typical salaried reset',
    note: 'Moderate savings, severance, unemployment, and one practical round of cuts.',
    values: {
      savings: 18000,
      checking: 4500,
      severance: 9000,
      oneTimeExpense: 0,
      unemployment: 1800,
      otherIncome: 0,
      sideIncome: 400,
      plannedCuts: 250,
      rent: 2200,
      utilities: 220,
      groceries: 450,
      insurance: 380,
      transportation: 240,
      debt: 320,
      phoneInternet: 140,
      misc: 160,
    },
  },
  {
    id: 'tight-renter',
    label: 'Tight renter runway',
    note: 'Little severance, little cushion, rent doing crime scene numbers.',
    values: {
      savings: 5200,
      checking: 1400,
      severance: 0,
      oneTimeExpense: 300,
      unemployment: 1450,
      otherIncome: 0,
      sideIncome: 150,
      plannedCuts: 125,
      rent: 1850,
      utilities: 170,
      groceries: 320,
      insurance: 260,
      transportation: 180,
      debt: 210,
      phoneInternet: 110,
      misc: 120,
    },
  },
  {
    id: 'family-bridge',
    label: 'Family + mortgage bridge',
    note: 'Higher fixed costs, severance cushion, and a spouse or other small income helping keep the floor up.',
    values: {
      savings: 26000,
      checking: 7000,
      severance: 15000,
      oneTimeExpense: 1200,
      unemployment: 2200,
      otherIncome: 1400,
      sideIncome: 0,
      plannedCuts: 450,
      rent: 3100,
      utilities: 380,
      groceries: 900,
      insurance: 760,
      transportation: 520,
      debt: 540,
      phoneInternet: 210,
      misc: 260,
    },
  },
  {
    id: 'lean-contracting',
    label: 'Lean contractor rebound',
    note: 'Low overhead, no severance, but freelance income already trying to keep the lights on.',
    values: {
      savings: 9000,
      checking: 2500,
      severance: 0,
      oneTimeExpense: 0,
      unemployment: 0,
      otherIncome: 0,
      sideIncome: 1800,
      plannedCuts: 200,
      rent: 1350,
      utilities: 150,
      groceries: 300,
      insurance: 240,
      transportation: 120,
      debt: 90,
      phoneInternet: 95,
      misc: 100,
    },
  },
];

function readNumber(name) {
  const value = Number(form.elements[name].value);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function updatePresetSelection() {
  if (!presetList) return;

  presetList.querySelectorAll('.preset-card').forEach((button) => {
    const isActive = button.dataset.presetId === activePreset;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
}

function renderPresetButtons() {
  if (!presetList) return;

  presetList.innerHTML = starterPresets
    .map(
      (preset) => `
        <button class="preset-card" type="button" data-preset-id="${preset.id}" aria-pressed="false">
          <span class="preset-title">${preset.label}</span>
          <span class="preset-note">${preset.note}</span>
        </button>
      `
    )
    .join('');

  presetList.addEventListener('click', (event) => {
    const button = event.target.closest('.preset-card');
    if (!button) return;

    const preset = starterPresets.find((entry) => entry.id === button.dataset.presetId);
    if (!preset) return;

    Object.entries(preset.values).forEach(([name, value]) => {
      if (form.elements[name]) {
        form.elements[name].value = value;
      }
    });

    activePreset = preset.id;
    updatePresetSelection();
    render();
    form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  updatePresetSelection();
}

function targetSpend(totalFunds, monthlyIncome, months) {
  if (months <= 0) return 0;
  return Math.max(0, totalFunds / months + monthlyIncome);
}

function calculateRunwayMonths(totalFunds, monthlyBurn) {
  return monthlyBurn > 0 ? totalFunds / monthlyBurn : Infinity;
}

function getBridgePlans(totalFunds, monthlyIncome, adjustedExpenses, monthlyBurn, runwayMonths) {
  return [3, 6, 12].map((months) => {
    const spendCap = targetSpend(totalFunds, monthlyIncome, months);

    if (!Number.isFinite(runwayMonths) || monthlyBurn <= 0 || runwayMonths >= months) {
      return {
        months,
        spendCap,
        state: 'covered',
        headline: 'Already covered',
        detail:
          monthlyBurn <= 0
            ? 'Your current income already covers adjusted spending, so this checkpoint is covered without extra heroics.'
            : `Current plan already clears ${months} months at today's ${currency.format(monthlyBurn)} monthly burn.`,
        secondary: `Keep adjusted spending near ${currency.format(adjustedExpenses)} / month and protect the margin.`,
      };
    }

    const targetBurn = totalFunds / months;
    const monthlyGap = Math.max(0, monthlyBurn - targetBurn);
    const upfrontGap = Math.max(0, monthlyBurn * months - totalFunds);

    return {
      months,
      spendCap,
      monthlyGap,
      upfrontGap,
      state: 'gap',
      headline: `Free up about ${currency.format(monthlyGap)} / month in burn`,
      detail: `At your current income, keeping adjusted spending near ${currency.format(spendCap)} / month gets you to ${months} months.`,
      secondary: `Or bridge it with about ${currency.format(upfrontGap)} more cash upfront.`,
    };
  });
}

function getTopExpenseCategories() {
  return Object.entries(expenseLabels)
    .map(([key, label]) => ({ key, label, value: readNumber(key) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)
    .filter((entry) => entry.value > 0);
}

function buildSummary(runwayMonths, monthlyBurn, topCuts) {
  if (monthlyBurn <= 0) {
    return 'You are currently cash-flow neutral or positive. Protect the margin, build reserves, and do not let lifestyle creep wander back in wearing dress shoes.';
  }

  const topLabel = topCuts[0]?.label || 'your biggest recurring expense';
  if (runwayMonths < 3) {
    return `At your current spending, you have about ${runwayMonths.toFixed(1)} months. This is triage mode: ${topLabel} needs attention first.`;
  }
  if (runwayMonths < 6) {
    return `You have about ${runwayMonths.toFixed(1)} months of runway. Not immediate doom, but definitely not time to finance a jet ski.`;
  }
  return `You have about ${runwayMonths.toFixed(1)} months of runway. That's useful breathing room if you keep spending disciplined and protect your cash.`;
}

function buildRecommendations(runwayMonths, monthlyBurn, monthlyIncome, topCuts) {
  const items = [];

  if (monthlyBurn <= 0) {
    items.push('Your income currently covers your adjusted spending. Preserve that surplus and keep at least one month of bills liquid.');
  } else {
    items.push(`Your net monthly burn is ${currency.format(monthlyBurn)} after ${currency.format(monthlyIncome)} of monthly income.`);
  }

  if (topCuts.length > 0) {
    items.push(`Your biggest lever is ${topCuts[0].label.toLowerCase()} at ${currency.format(topCuts[0].value)} per month.`);
  }

  if (runwayMonths < 3) {
    items.push('Treat this week like emergency planning: cut recurring costs, preserve cash, and line up replacement income fast.');
  } else if (runwayMonths < 6) {
    items.push('You have some room, but this is the zone where denial buys absolutely nothing. Tighten expenses now while the choices are still yours.');
  } else {
    items.push('Use the extra runway to be deliberate: keep optionality high, but still trim obvious waste before it turns into a bad little roommate.');
  }

  items.push('Apply for unemployment and hardship relief early if you qualify. Late paperwork is one of the dumbest recurring villains in this genre.');
  return items;
}

function getScenarioGuidance(runwayMonths, monthlyBurn, topCuts) {
  const biggestLever = topCuts[0]?.label.toLowerCase() || 'your biggest recurring expense';

  if (monthlyBurn <= 0) {
    return {
      tone: 'status-good',
      tag: 'Cash-flow positive',
      copy:
        'Right now your income covers your adjusted spending. That buys breathing room, but the smart move is still to protect the margin and keep cash easy to reach.',
      actions: [
        'Keep at least one month of core bills liquid.',
        `Do a quick audit of ${biggestLever} and other obvious waste before it sneaks back up.`,
        'Use the copied summary to stay aligned with anyone sharing the budget.',
      ],
    };
  }

  if (runwayMonths < 3) {
    return {
      tone: 'status-bad',
      tag: '0–3 months: protect the floor',
      copy:
        'This is triage mode. The goal is not elegant optimization. The goal is to buy time this week with the biggest moves available.',
      actions: [
        `Start with ${biggestLever}, not the tiny nonsense.`,
        'Apply for unemployment, hardship plans, and payment relief immediately.',
        'Tell one trusted person the number so you are not making every decision alone.',
      ],
    };
  }

  if (runwayMonths < 6) {
    return {
      tone: 'status-warn',
      tag: '3–6 months: stabilize early',
      copy:
        'You still have room to choose, which is exactly why now is the time to tighten the plan before the calendar gets rude.',
      actions: [
        `Attack ${biggestLever} before the smaller categories.`,
        'Set a weekly spending cap and a simple job-search rhythm.',
        'Copy the summary and get aligned with a partner, roommate, or friend now instead of after the panic spike.',
      ],
    };
  }

  return {
    tone: 'status-good',
    tag: '6+ months: use the room well',
    copy:
      'This is real breathing room. The win here is using it deliberately so you keep options, not drifting until the number gets dramatically less charming.',
    actions: [
      `Trim the obvious waste, starting with ${biggestLever}.`,
      'Pick a spending level that protects a 6–12 month runway.',
      'Use the copied snapshot to pressure-test the plan with somebody you trust.',
    ],
  };
}

function roundToStep(value, step = 50) {
  if (value <= 0) return 0;
  return Math.round(value / step) * step;
}

function getModeledCut(sourceValue, ratio, options = {}) {
  if (sourceValue <= 0) return 0;

  const { min = 50, max = 600, step = 50 } = options;
  const modeledValue = Math.max(min, roundToStep(sourceValue * ratio, step));
  return Math.min(sourceValue, Math.min(max, modeledValue));
}

function formatRunwayLabel(runwayMonths) {
  return Number.isFinite(runwayMonths) ? `${runwayMonths.toFixed(1)} months` : 'Cash-flow positive';
}

function getRunwayDeltaLabel(baseRunwayMonths, scenarioRunwayMonths) {
  if (!Number.isFinite(scenarioRunwayMonths)) {
    return 'Crosses into cash-flow positive';
  }

  if (!Number.isFinite(baseRunwayMonths)) {
    return 'Still cash-flow positive';
  }

  const delta = scenarioRunwayMonths - baseRunwayMonths;
  if (Math.abs(delta) < 0.05) {
    return 'No material change';
  }

  return `${delta > 0 ? '+' : ''}${delta.toFixed(1)} months`;
}

function getScenarioTone(scenarioRunwayMonths) {
  if (!Number.isFinite(scenarioRunwayMonths) || scenarioRunwayMonths >= 6) {
    return 'status-good';
  }

  if (scenarioRunwayMonths >= 3) {
    return 'status-warn';
  }

  return 'status-bad';
}

function getComparisonScenarios({ totalFunds, monthlyBurn, runwayMonths, topCuts, rent }) {
  if (monthlyBurn <= 0) {
    return [
      {
        title: 'Already cash-flow positive',
        deltaLabel: 'Protected',
        runwayLabel: 'Cash-flow positive',
        burnLabel: 'Income already covers adjusted spending',
        detail:
          'Your current plan already clears monthly costs. The move now is protecting the margin and keeping cash handy, not inventing fake austerity for the love of drama.',
        changeLabel: 'Use the breathing room to build reserves and keep recurring costs honest.',
        tone: 'status-good',
      },
    ];
  }

  const primaryExpense = topCuts[0];
  const primaryLabel = primaryExpense?.label.toLowerCase() || 'your biggest recurring expense';
  const housingCut = rent > 0 ? getModeledCut(rent, 0.15, { min: 100, max: 600, step: 50 }) : 0;
  const biggestLeverCut = primaryExpense ? getModeledCut(primaryExpense.value, 0.15, { min: 50, max: 500, step: 50 }) : 250;
  const leverCut = housingCut || biggestLeverCut;
  const leverTitle = housingCut > 0 ? 'Housing reset' : `Trim ${primaryLabel}`;
  const leverDetail = housingCut > 0
    ? `Model a roommate, sublet, refinance, or cheaper place by freeing up about ${currency.format(housingCut)} / month in housing.`
    : `Model a roughly ${currency.format(leverCut)} / month trim in ${primaryLabel} and see what it does to the calendar.`;
  const incomeBoost = 500;

  return [
    {
      title: leverTitle,
      burnDelta: leverCut,
      changeLabel: `${currency.format(leverCut)} / month less spend`,
      detail: leverDetail,
    },
    {
      title: 'Bridge income',
      burnDelta: incomeBoost,
      changeLabel: `${currency.format(incomeBoost)} / month more income`,
      detail:
        'Model temp work, freelancing, consulting, or any boring little income bridge that keeps the floor from collapsing.',
    },
    {
      title: 'Stack both moves',
      burnDelta: leverCut + incomeBoost,
      changeLabel: `${currency.format(leverCut)} less spend + ${currency.format(incomeBoost)} more income`,
      detail:
        'Combine the biggest modeled cut with a modest income bridge to see the non-heroic version of buying more time.',
    },
  ].map((scenario) => {
    const scenarioMonthlyBurn = monthlyBurn - scenario.burnDelta;
    const scenarioRunwayMonths = calculateRunwayMonths(totalFunds, scenarioMonthlyBurn);

    return {
      ...scenario,
      deltaLabel: getRunwayDeltaLabel(runwayMonths, scenarioRunwayMonths),
      runwayLabel: formatRunwayLabel(scenarioRunwayMonths),
      burnLabel:
        scenarioMonthlyBurn > 0
          ? `${currency.format(scenarioMonthlyBurn)} burn / month`
          : 'Income covers adjusted spending',
      tone: getScenarioTone(scenarioRunwayMonths),
    };
  });
}

function buildShareSummary(snapshot) {
  if (!snapshot) return '';

  return [
    `Layoff Runway snapshot: about ${snapshot.runwayLabel}, ${snapshot.monthlyBurn} monthly burn, likely cash-out ${snapshot.cashOutDate}.`,
    `Biggest cost lever: ${snapshot.topCostCut}.`,
    `Bridge plan: ${snapshot.bridgeLine}`,
    snapshot.bestComparison ? `Quick what-if: ${snapshot.bestComparison}` : '',
    `Context: ${snapshot.guidanceTag}. ${snapshot.guidanceCopy}`,
    `Private/no-signup calculator: ${snapshot.shareUrl || 'https://garytalbot.github.io/layoff-runway/'}`,
  ]
    .filter(Boolean)
    .join(' ');
}

function buildShareUrl() {
  const params = new URLSearchParams();

  Array.from(form.elements)
    .filter((field) => field.name)
    .forEach((field) => {
      const value = field.value;
      if (value !== '' && value !== field.defaultValue) {
        params.set(field.name, value);
      }
    });

  const url = new URL(window.location.href);
  const query = params.toString();
  url.search = query;
  url.hash = 'results';
  return url.toString();
}

function loadStateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  let didLoad = false;

  Array.from(form.elements)
    .filter((field) => field.name)
    .forEach((field) => {
      if (!params.has(field.name)) return;
      field.value = params.get(field.name) || '';
      didLoad = true;
    });

  return didLoad;
}

function setCaptureStatus(message, tone = '') {
  if (!captureStatus) return;
  captureStatus.textContent = message;
  captureStatus.className = ['capture-status', tone].filter(Boolean).join(' ');
}

function setShareStatus(message, tone = '') {
  if (!shareStatus) return;
  shareStatus.textContent = message;
  shareStatus.className = ['capture-status', tone].filter(Boolean).join(' ');
}

function buildChecklistRequestBody() {
  const lines = ['Hi Gary,', '', 'Please send me the Layoff Runway survival checklist.'];
  const replyEmail = captureEmailInput?.value.trim();

  if (replyEmail) {
    lines.push('', `Best reply email: ${replyEmail}`);
  }

  if (includeSnapshotCheckbox?.checked && latestSnapshot) {
    lines.push(
      '',
      'Current runway snapshot:',
      `- Estimated runway: ${latestSnapshot.runwayLabel}`,
      `- Total available funds: ${latestSnapshot.totalFunds}`,
      `- Monthly burn: ${latestSnapshot.monthlyBurn}`,
      `- Monthly income: ${latestSnapshot.monthlyIncome}`,
      `- Cash-out date: ${latestSnapshot.cashOutDate}`,
      `- Biggest cost-cut target: ${latestSnapshot.topCostCut}`
    );
  }

  lines.push('', 'Thanks.');
  return lines.join('\n');
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const tempInput = document.createElement('input');
  tempInput.value = text;
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand('copy');
  document.body.removeChild(tempInput);
}

function openChecklistEmailDraft() {
  const subject = 'Layoff Runway checklist request';
  const body = buildChecklistRequestBody();
  const params = new URLSearchParams({ subject, body });

  setCaptureStatus('Opening your email draft. If nothing happens, use the copy button and send the request manually.', 'status-good');
  window.location.href = `mailto:${contactEmail}?${params.toString()}`;
}

function render() {
  const savings = readNumber('savings');
  const checking = readNumber('checking');
  const severance = readNumber('severance');
  const oneTimeExpense = readNumber('oneTimeExpense');
  const unemployment = readNumber('unemployment');
  const otherIncome = readNumber('otherIncome');
  const sideIncome = readNumber('sideIncome');
  const plannedCuts = readNumber('plannedCuts');

  const totalFunds = Math.max(0, savings + checking + severance - oneTimeExpense);
  const monthlyIncome = unemployment + otherIncome + sideIncome;
  const monthlyExpenses = [
    'rent',
    'utilities',
    'groceries',
    'insurance',
    'transportation',
    'debt',
    'phoneInternet',
    'misc',
  ].reduce((sum, key) => sum + readNumber(key), 0);

  const adjustedExpenses = Math.max(0, monthlyExpenses - plannedCuts);
  const monthlyBurn = adjustedExpenses - monthlyIncome;
  const runwayMonths = calculateRunwayMonths(totalFunds, monthlyBurn);
  const topCuts = getTopExpenseCategories();
  const bridgePlans = getBridgePlans(totalFunds, monthlyIncome, adjustedExpenses, monthlyBurn, runwayMonths);
  const comparisonScenarios = getComparisonScenarios({
    totalFunds,
    monthlyBurn,
    runwayMonths,
    topCuts,
    rent: readNumber('rent'),
  });

  output.totalFunds.textContent = currency.format(totalFunds);
  output.monthlyBurn.textContent = monthlyBurn > 0 ? currency.format(monthlyBurn) : currency.format(0);
  output.monthlyIncome.textContent = currency.format(monthlyIncome);

  let cashOutLabel = 'Cash-flow positive';

  if (Number.isFinite(runwayMonths)) {
    output.runwayMonths.textContent = runwayMonths.toFixed(1);
    const cashOut = new Date();
    cashOut.setDate(cashOut.getDate() + Math.round(runwayMonths * 30.4));
    cashOutLabel = dateFormatter.format(cashOut);
    output.cashOutDate.textContent = cashOutLabel;
  } else {
    output.runwayMonths.textContent = '∞';
    output.cashOutDate.textContent = cashOutLabel;
  }

  const normalizedRunwayMonths = Number.isFinite(runwayMonths) ? runwayMonths : 99;
  const summary = buildSummary(normalizedRunwayMonths, monthlyBurn, topCuts);
  const guidance = getScenarioGuidance(normalizedRunwayMonths, monthlyBurn, topCuts);

  output.summaryText.textContent = summary;
  output.summaryText.className = `summary-text ${guidance.tone}`;

  output.comparisonList.innerHTML = comparisonScenarios
    .map(
      (scenario) => `
        <article class="comparison-card">
          <div class="comparison-header">
            <p class="comparison-title">${scenario.title}</p>
            <p class="comparison-delta ${scenario.tone}">${scenario.deltaLabel}</p>
          </div>
          <p class="comparison-runway">${scenario.runwayLabel}</p>
          <p class="comparison-meta">${scenario.changeLabel}</p>
          <p class="comparison-meta">${scenario.burnLabel}</p>
          <p class="comparison-copy">${scenario.detail}</p>
        </article>
      `
    )
    .join('');

  output.costCutList.innerHTML = topCuts.length
    ? topCuts
        .map((entry) => `<li>${entry.label} — <strong>${currency.format(entry.value)}</strong> / month</li>`)
        .join('')
    : '<li>No recurring expenses entered yet.</li>';

  output.bridgePlanList.innerHTML = bridgePlans
    .map(
      (plan) => `
        <article class="bridge-plan-item ${plan.state === 'covered' ? 'bridge-plan-covered' : 'bridge-plan-gap'}">
          <p class="bridge-plan-label">${plan.months} months</p>
          <p class="bridge-plan-headline">${plan.headline}</p>
          <p class="bridge-plan-copy">${plan.detail}</p>
          <p class="bridge-plan-copy bridge-plan-secondary">${plan.secondary}</p>
        </article>
      `
    )
    .join('');

  output.recommendationList.innerHTML = buildRecommendations(normalizedRunwayMonths, monthlyBurn, monthlyIncome, topCuts)
    .map((item) => `<li>${item}</li>`)
    .join('');

  output.runwayZoneTag.textContent = guidance.tag;
  output.runwayZoneTag.className = `scenario-tag ${guidance.tone}`;
  output.runwayZoneCopy.textContent = guidance.copy;
  output.scenarioActionList.innerHTML = guidance.actions.map((item) => `<li>${item}</li>`).join('');
  setShareStatus('');

  const nextBridgePlan = bridgePlans.find((plan) => plan.state === 'gap');
  const bestComparison = comparisonScenarios.reduce((best, scenario) => {
    const getComparableRunway = (value) => (value === 'Cash-flow positive' ? Number.POSITIVE_INFINITY : Number.parseFloat(value));
    return getComparableRunway(scenario.runwayLabel) > getComparableRunway(best.runwayLabel) ? scenario : best;
  }, comparisonScenarios[0]);

  latestSnapshot = {
    runwayLabel: Number.isFinite(runwayMonths) ? `${runwayMonths.toFixed(1)} months` : 'cash-flow positive',
    totalFunds: currency.format(totalFunds),
    monthlyBurn: monthlyBurn > 0 ? currency.format(monthlyBurn) : 'cash-flow positive',
    monthlyIncome: currency.format(monthlyIncome),
    cashOutDate: cashOutLabel,
    topCostCut: topCuts[0]
      ? `${topCuts[0].label} (${currency.format(topCuts[0].value)} / month)`
      : 'No recurring expenses entered yet',
    bridgeLine: nextBridgePlan
      ? `to reach ${nextBridgePlan.months} months, free up about ${currency.format(nextBridgePlan.monthlyGap)} / month in burn or add about ${currency.format(nextBridgePlan.upfrontGap)} upfront.`
      : 'your current plan already clears the common 3, 6, and 12 month checkpoints.',
    bestComparison:
      bestComparison && bestComparison.title !== 'Already cash-flow positive'
        ? `${bestComparison.title} would move the result to ${bestComparison.runwayLabel} (${bestComparison.deltaLabel}).`
        : '',
    guidanceTag: guidance.tag,
    guidanceCopy: guidance.copy,
  };

  latestSnapshot.shareUrl = buildShareUrl();
  latestSnapshot.shareText = buildShareSummary(latestSnapshot);
}

calculateButton.addEventListener('click', render);
resetButton.addEventListener('click', () => {
  Object.entries(defaultValues).forEach(([name, value]) => {
    form.elements[name].value = value;
  });
  activePreset = 'default';
  updatePresetSelection();
  render();
});

form.addEventListener('input', () => {
  activePreset = 'custom';
  updatePresetSelection();
  render();
});

emailCaptureForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  openChecklistEmailDraft();
});

copyEmailButton?.addEventListener('click', async () => {
  try {
    await copyText(contactEmail);
    setCaptureStatus(`Copied ${contactEmail}. If your email app refuses to behave, send the checklist request there manually.`, 'status-good');
  } catch (error) {
    setCaptureStatus(`Copy failed. Send the request manually to ${contactEmail}.`, 'status-warn');
  }
});

copySummaryButton?.addEventListener('click', async () => {
  if (!latestSnapshot?.shareText) {
    setShareStatus('Run the calculator first, then copy the summary.', 'status-warn');
    return;
  }

  try {
    await copyText(latestSnapshot.shareText);
    setShareStatus('Copied a plain-English snapshot you can paste into a text, email, or chat.', 'status-good');
  } catch (error) {
    setShareStatus('Copy failed. You can still select the results manually.', 'status-warn');
  }
});

copyLinkButton?.addEventListener('click', async () => {
  if (!latestSnapshot?.shareUrl) {
    setShareStatus('Run the calculator first, then copy the link.', 'status-warn');
    return;
  }

  try {
    await copyText(latestSnapshot.shareUrl);
    setShareStatus('Copied a shareable link with this exact scenario baked in.', 'status-good');
  } catch (error) {
    setShareStatus('Copy failed. You can still copy the URL from the address bar after calculating.', 'status-warn');
  }
});

shareLinkButton?.addEventListener('click', async () => {
  if (!latestSnapshot?.shareUrl) {
    setShareStatus('Run the calculator first, then share the result.', 'status-warn');
    return;
  }

  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Layoff Runway',
        text: latestSnapshot.shareText,
        url: latestSnapshot.shareUrl,
      });
      setShareStatus('Shared result.', 'status-good');
      return;
    } catch (error) {
      if (error?.name === 'AbortError') {
        setShareStatus('Share canceled.', 'status-warn');
        return;
      }
    }
  }

  try {
    await copyText(latestSnapshot.shareUrl);
    setShareStatus('Native share is not available here, so I copied the exact-result link instead.', 'status-good');
  } catch (error) {
    setShareStatus('Share failed. Copy the URL from the address bar after calculating.', 'status-warn');
  }
});

activePreset = loadStateFromUrl() ? 'custom' : 'default';
renderPresetButtons();
render();
