import { test, expect } from '@playwright/test';

interface MeshMeasurement { driver: string; driven: string; distance: number; pitchDistance: number; heightDifference: number; phaseError: number }

for (const movement of ['manual', 'automatic', 'quartz']) {
  test(`${movement}: actual gear meshes align and return after explosion`, async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('/');
    const scene = page.getByTestId('movement-scene');
    const measurements = async (): Promise<MeshMeasurement[]> => JSON.parse(await scene.getAttribute('data-gear-meshes') ?? '[]');
    await page.getByLabel('Movement', { exact: true }).selectOption(movement);
    await expect.poll(async () => (await measurements()).length).toBe(movement === 'manual' ? 4 : movement === 'automatic' ? 7 : 3);
    await expect.poll(async () => (await measurements()).every(mesh => Math.abs(mesh.distance - mesh.pitchDistance) < 1e-8 && Math.abs(mesh.heightDifference) < 1e-8 && mesh.phaseError < 1e-7)).toBe(true);
    await page.getByRole('button', { name: 'Pause simulation', exact: true }).click();
    const slider = page.getByRole('slider', { name: 'Exploded view', exact: true });
    await slider.fill('50');
    await expect.poll(async () => (await measurements()).some(mesh => Math.abs(mesh.heightDifference) > .01)).toBe(true);
    await slider.fill('0');
    await expect.poll(async () => (await measurements()).every(mesh => Math.abs(mesh.distance - mesh.pitchDistance) < 1e-8 && Math.abs(mesh.heightDifference) < 1e-8)).toBe(true);
    await page.getByRole('button', { name: 'Hide Train bridge', exact: true }).click();
    if (movement === 'automatic') {
      await page.getByRole('button', { name: 'Hide Oscillating rotor', exact: true }).click();
      await page.getByRole('button', { name: 'Hide Automatic bridge', exact: true }).click();
    }
    if (movement !== 'quartz') await page.getByRole('button', { name: 'Fourth wheel', exact: true }).click();
    await page.getByRole('button', { name: 'Top', exact: true }).click();
    await page.screenshot({ path: `artifacts/alignment-${movement}-top.png`, fullPage: true });
    await page.getByRole('button', { name: 'Side', exact: true }).click();
    await page.screenshot({ path: `artifacts/alignment-${movement}-side.png`, fullPage: true });
  });
}
