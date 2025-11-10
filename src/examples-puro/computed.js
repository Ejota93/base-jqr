import $ from '../jquery.reactive.es6.js';

// Módulo de demostración: Valores derivados con $.computed
export function initComputed() {
  const comp = $.namespace('computedDemo');
  // Defaults en el namespace
  comp.ensure({
    nivel: 25,
    label: '',
    firstName: '',
    lastName: '',
    fullName: 'Invitado',
    heightCm: 170,
    weightKg: 70,
    bmiLabel: '',
  });

  // Wiring de inputs básicos
  comp.nivel($('#comp-nivel')).val();
  // comp.label($('#comp-label'))
  // .map((n) => `Nivel: ${Number(n || 0)}`)
  // .text();

  $('#comp-label').reactive(comp.label)
  .map((n) => `Nivel: ${Number(n || 0)}`)
  .text();

  comp.firstName($('#comp-first')).val();
  comp.lastName($('#comp-last')).val();
  comp.fullName($('#comp-full-name')).text();

  comp.heightCm($('#comp-height')).val();
  comp.weightKg($('#comp-weight')).val();
  comp.bmiLabel($('#comp-bmi')).text();

  // Computed: etiqueta a partir de nivel
  $.computed(comp.label, [comp.nivel], (n) => Number(n || 0));

  // Computed: nombre completo
  $.computed(comp.fullName, [comp.firstName, comp.lastName], (f, l) => {
    const full = `${(f || '').trim()} ${(l || '').trim()}`.trim();
    return full || 'Invitado';
  });


  const calcular = (hCm, wKg) => {
    const hM = Number(hCm || 0) / 100;
    const w = Number(wKg || 0);
    if (hM <= 0 || w <= 0) return 'BMI: N/A';
    const bmi = w / (hM * hM);
    const rounded = Math.round(bmi * 10) / 10;
    let cat = 'Normal';
    if (rounded < 18.5) cat = 'Bajo peso';
    else if (rounded < 25) cat = 'Normal';
    else if (rounded < 30) cat = 'Sobrepeso';
    else cat = 'Obesidad';
    return `BMI: ${rounded} (${cat})`;
  }

  // Computed: BMI a partir de altura (cm) y peso (kg)
  $.computed(comp.bmiLabel, [comp.heightCm, comp.weightKg], (hCm, wKg) => {
    return calcular(hCm, wKg);
  });
}