const { test, expect } = require('@playwright/test');

test.describe('Simulador Epistémico - Pruebas Defensivas de Estabilidad', () => {
  test.beforeEach(async ({ page }) => {
    // Open the local web server
    await page.goto('http://localhost:8080/');
    
    // Set viewport to mobile standard to test the mobile layout behavior explicitly
    await page.setViewportSize({ width: 375, height: 812 });
  });

  test('Debería transicionar de estado correctamente y mantener dimensiones estables en las cajas', async ({ page }) => {
    const playC = page.locator('#play-c');
    const playK = page.locator('#play-k');
    const playAccess = page.locator('#play-access');

    const formulaBox = page.locator('#play-formula-box');
    const statusBox = page.locator('.playground-status');
    const badge = page.locator('#play-status-badge');

    // Make sure elements are visible and scroll into view
    await expect(formulaBox).toBeVisible();
    await expect(statusBox).toBeVisible();
    await page.locator('.formula-playground-section').scrollIntoViewIfNeeded();

    // --- 1. Estado Inicial: Secreto Revelable / Descifrable (C=true, K=false, Access=true) ---
    await playC.setChecked(true, { force: true });
    await playK.setChecked(false, { force: true });
    await playAccess.setChecked(true, { force: true });
    await expect(badge).toHaveText(/(Secreto Descifrable|Decipherable Secret|Secreto Revelable)/);
    
    // Capturar alturas de referencia
    const refFormulaHeight = (await formulaBox.boundingBox()).height;
    const refStatusHeight = (await statusBox.boundingBox()).height;

    // --- 2. Estado: Misterio Inalcanzable (C=true, K=false, Access=false) ---
    await playAccess.setChecked(false, { force: true });
    await expect(badge).toHaveText(/(Misterio Inalcanzable|Absolute Mystery)/);
    
    const height2Formula = (await formulaBox.boundingBox()).height;
    const height2Status = (await statusBox.boundingBox()).height;

    // --- 3. Estado: Verdad Revelada (C=true, K=true) ---
    await playK.setChecked(true, { force: true });
    await expect(badge).toHaveText(/(Verdad Revelada|Full Knowledge)/);
    
    const height3Formula = (await formulaBox.boundingBox()).height;
    const height3Status = (await statusBox.boundingBox()).height;

    // --- 4. Estado: Inconsistencia (C=false) ---
    await playC.setChecked(false, { force: true });
    await expect(badge).toHaveText(/(Inconsistencia|Absurd Concealment)/);
    
    const height4Formula = (await formulaBox.boundingBox()).height;
    const height4Status = (await statusBox.boundingBox()).height;

    console.log('--- DEBUG PLAYGROUND STABILITY ---');
    console.log(`refFormulaHeight (State 1): ${refFormulaHeight}px`);
    console.log(`height2Formula   (State 2): ${height2Formula}px`);
    console.log(`height3Formula   (State 3): ${height3Formula}px`);
    console.log(`height4Formula   (State 4): ${height4Formula}px`);
    console.log(`refStatusHeight  (State 1): ${refStatusHeight}px`);
    console.log(`height2Status    (State 2): ${height2Status}px`);
    console.log(`height3Status    (State 3): ${height3Status}px`);
    console.log(`height4Status    (State 4): ${height4Status}px`);

    // --- COMPROBACIONES DE ESTABILIDAD ALTURA (Test Defensivo) ---
    expect(Math.abs(refFormulaHeight - height2Formula)).toBeLessThanOrEqual(2);
    expect(Math.abs(refFormulaHeight - height3Formula)).toBeLessThanOrEqual(2);
    expect(Math.abs(refFormulaHeight - height4Formula)).toBeLessThanOrEqual(2);

    expect(Math.abs(refStatusHeight - height2Status)).toBeLessThanOrEqual(2);
    expect(Math.abs(refStatusHeight - height3Status)).toBeLessThanOrEqual(2);
    expect(Math.abs(refStatusHeight - height4Status)).toBeLessThanOrEqual(2);
  });
});
