import { test, expect } from '@playwright/test';
test('skip link moves keyboard focus without changing the hash route',async({page})=>{
 await page.goto('/#/academy');await page.keyboard.press('Tab');await expect(page.getByRole('link',{name:'Skip to content'})).toBeFocused();await page.keyboard.press('Enter');await expect(page.locator('#main-content')).toBeFocused();await expect(page).toHaveURL(/#\/academy$/);await expect(page.getByRole('heading',{name:'Understanding, one part at a time.'})).toBeVisible();
});
test('mobile users can enable and persist Engineering explanations',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/#/academy/gears');await page.getByRole('button',{name:'Display settings'}).click();await page.getByLabel('Engineering explanations',{exact:true}).check();await page.getByRole('button',{name:'Close display settings'}).click();await expect(page.getByText('The engineering view',{exact:true})).toBeVisible();await page.reload();await expect(page.getByText('The engineering view',{exact:true})).toBeVisible();
});
