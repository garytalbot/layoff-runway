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
const calculateButton = document.getElementById('calculate-button');
const resetButton = document.getElementById('reset-button');
const emailCaptureForm = document.getElementById('email-capture-form');
const captureEmailInput = document.getElementById('capture-email');
const includeSnapshotCheckbox = document.getElementById('include-snapshot');
const copyEmailButton = document.getElementById('copy-email-button');
const captureStatus = document.getElementById('capture-status');

const contactEmail = 'GaryTalbot1987@gmail.com';
let latestSnapshot = null;

const output = {
  runwayMonths: document.getElementById('runway-months'),
  summaryText: document.getElementById('summary-text'),
  totalFunds: document.getElementById('total-funds'),
  monthlyBurn: document.getElementById('monthly-burn'),
  cashOutDate: document.getElementById('cash-out-date'),
  monthlyIncome: document.getElementById('monthly-income'),
  target3: document.getElementById('target-3'),
  target6: document.getElementById('target-6'),
  target12: document.getElementById('target-12'),
  costCutList: document.getElementById('cost-cut-list'),
  recommendationList: document.getElementById('recommendation-list'),
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

function readNumber(name) {
  const value = Number(form.elements[name].value);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function targetSpend(totalFunds, monthlyIncome, months) {
  if (months <= 0) return 0;
  return Math.max(0, totalFunds / months + monthlyIncome);
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

function setCaptureStatus(message, tone = '') {
  if (!captureStatus) return;
  captureStatus.textContent = message;
  captureStatus.className = ['capture-status', tone].filter(Boolean).join(' ');
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
  const runwayMonths = monthlyBurn > 0 ? totalFunds / monthlyBurn : Infinity;
  const topCuts = getTopExpenseCategories();

  output.totalFunds.textContent = currency.format(totalFunds);
  output.monthlyBurn.textContent = monthlyBurn > 0 ? currency.format(monthlyBurn) : currency.format(0);
  output.monthlyIncome.textContent = currency.format(monthlyIncome);
  output.target3.textContent = currency.format(targetSpend(totalFunds, monthlyIncome, 3));
  output.target6.textContent = currency.format(targetSpend(totalFunds, monthlyIncome, 6));
  output.target12.textContent = currency.format(targetSpend(totalFunds, monthlyIncome, 12));

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

  const summary = buildSummary(Number.isFinite(runwayMonths) ? runwayMonths : 99, monthlyBurn, topCuts);
  output.summaryText.textContent = summary;
  output.summaryText.className = `summary-text ${monthlyBurn <= 0 ? 'status-good' : runwayMonths < 3 ? 'status-bad' : runwayMonths < 6 ? 'status-warn' : 'status-good'}`;

  output.costCutList.innerHTML = topCuts.length
    ? topCuts
        .map((entry) => `<li>${entry.label} — <strong>${currency.format(entry.value)}</strong> / month</li>`)
        .join('')
    : '<li>No recurring expenses entered yet.</li>';

  output.recommendationList.innerHTML = buildRecommendations(
    Number.isFinite(runwayMonths) ? runwayMonths : 99,
    monthlyBurn,
    monthlyIncome,
    topCuts
  )
    .map((item) => `<li>${item}</li>`)
    .join('');

  latestSnapshot = {
    runwayLabel: Number.isFinite(runwayMonths) ? `${runwayMonths.toFixed(1)} months` : 'Cash-flow positive',
    totalFunds: currency.format(totalFunds),
    monthlyBurn: monthlyBurn > 0 ? currency.format(monthlyBurn) : 'Cash-flow positive',
    monthlyIncome: currency.format(monthlyIncome),
    cashOutDate: cashOutLabel,
    topCostCut: topCuts[0]
      ? `${topCuts[0].label} (${currency.format(topCuts[0].value)} / month)`
      : 'No recurring expenses entered yet',
  };
}

calculateButton.addEventListener('click', render);
resetButton.addEventListener('click', () => {
  Object.entries(defaultValues).forEach(([name, value]) => {
    form.elements[name].value = value;
  });
  render();
});

form.addEventListener('input', render);

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

render();
