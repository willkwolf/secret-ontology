const { test, expect } = require('@playwright/test');

test.describe('Simulador Epistémico - Pruebas Defensivas de Estabilidad y Cero Fricción UI/UX', () => {
  const viewports = [
    { name: 'Desktop Large', width: 1280, height: 800, isMobileLayout: false },
    { name: 'Desktop Medium', width: 1024, height: 768, isMobileLayout: false },
    { name: 'Mobile Standard', width: 375, height: 812, isMobileLayout: true },
    { name: 'Mobile Tight', width: 320, height: 568, isMobileLayout: true }
  ];

  const languages = [
    { code: 'es', name: 'Spanish' },
    { code: 'en', name: 'English' }
  ];

  for (const lang of languages) {
    for (const vp of viewports) {
      test(`Estabilidad UI/UX en [${vp.name}] con idioma [${lang.name}]`, async ({ page }) => {
        // Open local server
        await page.goto('http://localhost:8080/');
        await page.setViewportSize({ width: vp.width, height: vp.height });

        // Switch to the target language if English
        if (lang.code === 'en') {
          const langBtn = page.locator('#lang-btn');
          await expect(langBtn).toBeVisible();
          // The page starts in Spanish, so clicking once turns it into English
          await langBtn.click();
          // Let strings apply
          await page.waitForTimeout(200);
        }

        const playC = page.locator('#play-c');
        const playK = page.locator('#play-k');
        const playAccess = page.locator('#play-access');

        const controlsBox = page.locator('.playground-controls').first();
        const displayBox = page.locator('.playground-display').first();
        const formulaBox = page.locator('#play-formula-box');
        const statusBox = page.locator('.playground-status');
        const badge = page.locator('#play-status-badge');

        const switchGroups = page.locator('.playground-controls .control-switch-group');

        // Scroll the simulator section into view
        await page.locator('.formula-playground-section').scrollIntoViewIfNeeded();
        await expect(formulaBox).toBeVisible();
        await expect(statusBox).toBeVisible();

        // Arrays to store dimensions across all 4 logical states
        const dimensions = [];

        // Helper function to capture exact dimensions of key UI elements
        const captureDimensions = async (stateIndex) => {
          const controlsBounds = await controlsBox.boundingBox();
          const displayBounds = await displayBox.boundingBox();
          const formulaBounds = await formulaBox.boundingBox();
          const statusBounds = await statusBox.boundingBox();

          const switch1Bounds = await switchGroups.nth(0).boundingBox();
          const switch2Bounds = await switchGroups.nth(1).boundingBox();
          const switch3Bounds = await switchGroups.nth(2).boundingBox();

          // Check programmatic overflow using evaluate
          const overflowData = await page.evaluate(() => {
            const getOverflow = (selector) => {
              const el = document.querySelector(selector);
              if (!el) return { scrollHeight: 0, clientHeight: 0, scrollWidth: 0, clientWidth: 0 };
              return {
                scrollHeight: el.scrollHeight,
                clientHeight: el.clientHeight,
                scrollWidth: el.scrollWidth,
                clientWidth: el.clientWidth,
                overflowingY: el.scrollHeight > el.clientHeight,
                overflowingX: el.scrollWidth > el.clientWidth
              };
            };

            const getSwitchOverflows = () => {
              const switches = document.querySelectorAll('.playground-controls .control-switch-group');
              return Array.from(switches).map((sw, idx) => ({
                idx,
                overflowingY: sw.scrollHeight > sw.clientHeight,
                overflowingX: sw.scrollWidth > sw.clientWidth
              }));
            };

            return {
              status: getOverflow('.playground-status'),
              formula: getOverflow('#play-formula-box'),
              switches: getSwitchOverflows()
            };
          });

          return {
            stateIndex,
            controls: { width: controlsBounds.width, height: controlsBounds.height },
            display: { width: displayBounds.width, height: displayBounds.height },
            formula: { width: formulaBounds.width, height: formulaBounds.height },
            status: { width: statusBounds.width, height: statusBounds.height },
            switches: [
              { width: switch1Bounds.width, height: switch1Bounds.height },
              { width: switch2Bounds.width, height: switch2Bounds.height },
              { width: switch3Bounds.width, height: switch3Bounds.height }
            ],
            overflowData
          };
        };
        const setCheckboxState = async (locator, targetState) => {
          await locator.evaluate((el, target) => {
            if (el.checked !== target) {
              el.checked = target;
              el.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }, targetState);
        };

        // --- STATE 1: Decipherable Secret (C=true, K=false, Access=true) ---
        await setCheckboxState(playC, true);
        await setCheckboxState(playK, false);
        await setCheckboxState(playAccess, true);
        await page.waitForTimeout(150);
        dimensions.push(await captureDimensions(1));

        // --- STATE 2: Absolute Mystery (C=true, K=false, Access=false) ---
        await setCheckboxState(playAccess, false);
        await page.waitForTimeout(150);
        dimensions.push(await captureDimensions(2));

        // --- STATE 3: Full Knowledge (C=true, K=true) ---
        await setCheckboxState(playK, true);
        await page.waitForTimeout(150);
        dimensions.push(await captureDimensions(3));

        // --- STATE 4: Inconsistency (C=false) ---
        await setCheckboxState(playC, false);
        await page.waitForTimeout(150);
        dimensions.push(await captureDimensions(4));

        // Let's print out a clear debugging log in case of differences
        console.log(`\n=== DIMENSION MATRIX [${vp.name}] [Language: ${lang.name}] ===`);
        dimensions.forEach(d => {
          console.log(`State ${d.stateIndex}:`);
          console.log(`  Controls: ${d.controls.width.toFixed(1)}px x ${d.controls.height.toFixed(1)}px`);
          console.log(`  Display:  ${d.display.width.toFixed(1)}px x ${d.display.height.toFixed(1)}px`);
          console.log(`  Formula:  ${d.formula.width.toFixed(1)}px x ${d.formula.height.toFixed(1)}px`);
          console.log(`  Status:   ${d.status.width.toFixed(1)}px x ${d.status.height.toFixed(1)}px`);
          console.log(`  Switches: [${d.switches.map((s, idx) => `S${idx+1}: ${s.width.toFixed(1)}x${s.height.toFixed(1)}`).join(', ')}]`);
        });

        // --- RIGID STABILITY AND NO-SHIFTS ASSERTIONS ---
        const first = dimensions[0];
        const tolerance = 1.0; // Allow max 1.0px difference to account for browser sub-pixel anti-aliasing / rounding on varying engines

        for (let i = 1; i < dimensions.length; i++) {
          const current = dimensions[i];

          // 1. Controls Container Width must remain completely stable
          expect(Math.abs(first.controls.width - current.controls.width)).toBeLessThanOrEqual(tolerance);

          // 2. Display Container Width must remain completely stable
          expect(Math.abs(first.display.width - current.display.width)).toBeLessThanOrEqual(tolerance);

          // 3. Main boxes height and width must remain completely stable
          expect(Math.abs(first.status.width - current.status.width)).toBeLessThanOrEqual(tolerance);
          expect(Math.abs(first.status.height - current.status.height)).toBeLessThanOrEqual(tolerance);

          expect(Math.abs(first.formula.width - current.formula.width)).toBeLessThanOrEqual(tolerance);
          expect(Math.abs(first.formula.height - current.formula.height)).toBeLessThanOrEqual(tolerance);

          // 4. Individual Switches width and height must remain completely stable
          for (let sIdx = 0; sIdx < 3; sIdx++) {
            expect(Math.abs(first.switches[sIdx].width - current.switches[sIdx].width)).toBeLessThanOrEqual(tolerance);
            expect(Math.abs(first.switches[sIdx].height - current.switches[sIdx].height)).toBeLessThanOrEqual(tolerance);
          }

          // 5. Assert absolutely NO dynamic scrollbars or overflow in text blocks (preventing clipping and layout clipping)
          expect(current.overflowData.status.overflowingY).toBe(false);
          expect(current.overflowData.status.overflowingX).toBe(false);
          expect(current.overflowData.formula.overflowingY).toBe(false);
          expect(current.overflowData.formula.overflowingX).toBe(false);

          for (const swOverflow of current.overflowData.switches) {
            expect(swOverflow.overflowingY).toBe(false);
            expect(swOverflow.overflowingX).toBe(false);
          }
        }
      });
    }
  }
});
