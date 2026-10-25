import { test, expect } from '@playwright/test';

test('canvas picking updates the inspector and isolation can be reversed',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 await page.getByRole('button',{name:'Crown & stem',exact:true}).click();await expect(page.locator('.part-title')).toHaveText('Crown & stem');
 const canvas=page.locator('canvas');await expect(page.getByTestId('movement-scene')).toHaveAttribute('data-world-position',/.+/);const bounds=await canvas.boundingBox();expect(bounds).not.toBeNull();
 await canvas.click({position:{x:bounds!.width*.5,y:bounds!.height*.58}});await expect(page.locator('.part-title')).not.toHaveText('Crown & stem');
 await page.getByRole('button',{name:'Isolate',exact:true}).click();await expect(page.getByRole('button',{name:'Show all',exact:true})).toBeVisible();await page.getByRole('button',{name:'Show all',exact:true}).click();
 await page.getByRole('button',{name:'Show component labels'}).click();await expect.poll(()=>page.locator('.scene-label-layer .part-label').count()).toBeGreaterThan(10);
 await page.getByRole('button',{name:'Show component labels'}).click();await expect(page.locator('.scene-label-layer .part-label')).toHaveCount(1);expect(errors).toEqual([]);
});

test('quartz steps and automatic rotor controls rotate actual scene objects',async({page})=>{
 await page.goto('/');await page.getByLabel('Movement',{exact:true}).selectOption('quartz');await page.getByRole('button',{name:'Pause simulation'}).click();await page.getByRole('button',{name:'Stepper rotor',exact:true}).click();const scene=page.getByTestId('movement-scene');await expect(scene).toHaveAttribute('data-world-position','-0.13,-1.13,0.15');const before=Number(await scene.getAttribute('data-rotation'));await page.getByRole('button',{name:'Advance one beat or pulse'}).click();await expect.poll(async()=>Number(await scene.getAttribute('data-rotation'))-before).toBeCloseTo(Math.PI);
 await page.getByLabel('Movement',{exact:true}).selectOption('automatic');await page.getByRole('button',{name:'Oscillating rotor',exact:true}).click();await page.getByRole('slider',{name:'Rotate the rotor'}).fill('360');await expect.poll(async()=>Number(await scene.getAttribute('data-rotation'))).toBeCloseTo(Math.PI*2);await expect(page.locator('.workshop-status')).toContainText('72.2%');await page.screenshot({path:'artifacts/automatic-desktop.png',fullPage:true});
});

test('renderer failure keeps component descriptions and lessons available',async({page})=>{
 await page.addInitScript(()=>{const native=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type:string,...args:unknown[]){if(type.includes('webgl'))return null;return Reflect.apply(native,this,[type,...args]);} as typeof native;});
 await page.goto('/');await expect(page.getByText('3D rendering is unavailable',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Center wheel',exact:true}).click();await expect(page.locator('.part-title')).toHaveText('Center wheel');await page.getByRole('link',{name:'Academy',exact:true}).click();await expect(page.getByRole('heading',{name:'Understanding, one part at a time.'})).toBeVisible();
});

test('experiment inputs change calculated results',async({page})=>{
 await page.goto('/#/experiments?lab=gears');await page.getByRole('slider',{name:'Driver teeth'}).fill('60');await page.getByRole('slider',{name:'Driven teeth'}).fill('20');await page.getByRole('slider',{name:'Input speed'}).fill('2');await expect(page.locator('.lab-result strong')).toContainText('-6.00');await page.getByRole('tab',{name:/Quartz timing/}).click();await page.getByRole('slider',{name:'Divider stages'}).fill('16');await expect(page.locator('.frequency-big')).toContainText('0.5');await page.getByRole('tab',{name:/Accuracy & drift/}).click();await page.getByRole('slider',{name:'Daily rate'}).fill('-4');await page.getByRole('slider',{name:'Elapsed days'}).fill('15');await expect(page.locator('.drift-number')).toContainText('-60');
});
