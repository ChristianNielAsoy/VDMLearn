import { describe, it, expect } from 'vitest';
import { drugDoseCalc } from '@/services/calculators/drugDose';
import { fluidTherapyCalc } from '@/services/calculators/fluidTherapy';
import { pearsonSquareCalc } from '@/services/calculators/pearsonSquare';
import { epi2x2Calc, epiOddsCalc } from '@/services/calculators/epidemiology';

// ── Drug dose ──────────────────────────────────────────────────────────
describe('drugDoseCalc', () => {
  it('computes total dose and volume correctly', () => {
    // 2 mg/kg × 10 kg = 20 mg; 20 mg ÷ 10 mg/mL = 2 mL
    const results = drugDoseCalc.compute({ doseRate: 2, weight: 10, concentration: 10 });
    const totalDose = results.find((r) => r.key === 'totalDose')!;
    const volume    = results.find((r) => r.key === 'volume')!;
    expect(totalDose.value).toBe(20);
    expect(volume.value).toBe(2);
  });

  it('handles fractional dose (amoxicillin-like example)', () => {
    // 10 mg/kg × 5 kg = 50 mg; 50 mg ÷ 50 mg/mL = 1 mL
    const results = drugDoseCalc.compute({ doseRate: 10, weight: 5, concentration: 50 });
    const volume = results.find((r) => r.key === 'volume')!;
    expect(volume.value).toBe(1);
  });

  it('rounds to 3 decimal places', () => {
    // 1 mg/kg × 3 kg = 3 mg; 3 mg ÷ 7 mg/mL ≈ 0.429 mL
    const results = drugDoseCalc.compute({ doseRate: 1, weight: 3, concentration: 7 });
    const volume = results.find((r) => r.key === 'volume')!;
    expect(volume.value).toBe(0.429);
  });
});

// ── Fluid therapy ──────────────────────────────────────────────────────
describe('fluidTherapyCalc', () => {
  it('computes deficit correctly', () => {
    // 20 kg × 5% × 10 = 1000 mL deficit
    const results = fluidTherapyCalc.compute({ weight: 20, dehydration: 5, maintenance: 60, hours: 24 });
    const deficit = results.find((r) => r.key === 'deficit')!;
    expect(deficit.value).toBe(1000);
  });

  it('computes 24h maintenance correctly', () => {
    // 20 kg × 60 mL/kg/day = 1200 mL/day
    const results = fluidTherapyCalc.compute({ weight: 20, dehydration: 0, maintenance: 60, hours: 24 });
    const maint = results.find((r) => r.key === 'maint')!;
    expect(maint.value).toBe(1200);
  });

  it('total = deficit + maintenance for period', () => {
    // 10 kg, 8% dehydration, 60 mL/kg/day, 12 h
    // deficit = 10 × 8 × 10 = 800 mL
    // maintenance 24h = 10 × 60 = 600 mL; for 12h = 300 mL
    // total = 800 + 300 = 1100 mL
    const results = fluidTherapyCalc.compute({ weight: 10, dehydration: 8, maintenance: 60, hours: 12 });
    const total = results.find((r) => r.key === 'total')!;
    expect(total.value).toBe(1100);
  });

  it('computes hourly rate', () => {
    // total 1100 mL ÷ 12 h ≈ 91.7 mL/h
    const results = fluidTherapyCalc.compute({ weight: 10, dehydration: 8, maintenance: 60, hours: 12 });
    const rate = results.find((r) => r.key === 'ratePerHour')!;
    expect(rate.value).toBeCloseTo(91.7, 1);
  });
});

// ── Pearson square ─────────────────────────────────────────────────────
describe('pearsonSquareCalc', () => {
  it('classic soybean meal + corn example', () => {
    // SBM = 44% CP, Corn = 8% CP, target = 16% CP, batch = 100 kg
    // parts SBM = |16 - 8| = 8; parts corn = |44 - 16| = 28
    // total parts = 36
    // kg SBM = 8/36 × 100 = 22.22 kg; kg corn = 28/36 × 100 = 77.78 kg
    const results = pearsonSquareCalc.compute({ aPercent: 44, bPercent: 8, target: 16, totalKg: 100 });
    const kgA = results.find((r) => r.key === 'kgA')!;
    const kgB = results.find((r) => r.key === 'kgB')!;
    expect(kgA.value).toBeCloseTo(22.22, 1);
    expect(kgB.value).toBeCloseTo(77.78, 1);
  });

  it('parts add up to total batch', () => {
    const results = pearsonSquareCalc.compute({ aPercent: 30, bPercent: 10, target: 18, totalKg: 50 });
    const kgA = results.find((r) => r.key === 'kgA')!;
    const kgB = results.find((r) => r.key === 'kgB')!;
    expect(kgA.value + kgB.value).toBeCloseTo(50, 2);
  });
});

// ── Epidemiology 2×2 ──────────────────────────────────────────────────
describe('epi2x2Calc', () => {
  it('computes sensitivity correctly', () => {
    // TP=90, FP=10, FN=10, TN=90 → Se = 90/(90+10) = 90%
    const results = epi2x2Calc.compute({ tp: 90, fp: 10, fn: 10, tn: 90 });
    const sens = results.find((r) => r.key === 'sens')!;
    expect(sens.value).toBe(90);
  });

  it('computes specificity correctly', () => {
    // TN=90, FP=10 → Sp = 90/(90+10) = 90%
    const results = epi2x2Calc.compute({ tp: 90, fp: 10, fn: 10, tn: 90 });
    const spec = results.find((r) => r.key === 'spec')!;
    expect(spec.value).toBe(90);
  });

  it('computes PPV and NPV', () => {
    // TP=90, FP=10, FN=20, TN=80
    // PPV = 90/(90+10) = 90%; NPV = 80/(80+20) = 80%
    const results = epi2x2Calc.compute({ tp: 90, fp: 10, fn: 20, tn: 80 });
    const ppv = results.find((r) => r.key === 'ppv')!;
    const npv = results.find((r) => r.key === 'npv')!;
    expect(ppv.value).toBe(90);
    expect(npv.value).toBe(80);
  });

  it('computes LR+', () => {
    // Se=0.9, Sp=0.9 → LR+ = 0.9 / (1-0.9) = 9
    const results = epi2x2Calc.compute({ tp: 90, fp: 10, fn: 10, tn: 90 });
    const lrPos = results.find((r) => r.key === 'lrPos')!;
    expect(lrPos.value).toBe(9);
  });
});

// ── Epidemiology odds / RR ─────────────────────────────────────────────
describe('epiOddsCalc', () => {
  it('computes odds ratio', () => {
    // a=50, b=50, c=20, d=80
    // OR = (50×80)/(50×20) = 4000/1000 = 4
    const results = epiOddsCalc.compute({ a: 50, b: 50, c: 20, d: 80 });
    const or = results.find((r) => r.key === 'or')!;
    expect(or.value).toBe(4);
  });

  it('computes relative risk', () => {
    // riskExp = 50/100 = 0.5; riskUnexp = 20/100 = 0.2
    // RR = 0.5 / 0.2 = 2.5
    const results = epiOddsCalc.compute({ a: 50, b: 50, c: 20, d: 80 });
    const rr = results.find((r) => r.key === 'rr')!;
    expect(rr.value).toBe(2.5);
  });

  it('handles zero unexposed risk gracefully', () => {
    const results = epiOddsCalc.compute({ a: 10, b: 90, c: 0, d: 100 });
    const rr = results.find((r) => r.key === 'rr')!;
    expect(rr.value).toBe(Infinity);
  });
});
