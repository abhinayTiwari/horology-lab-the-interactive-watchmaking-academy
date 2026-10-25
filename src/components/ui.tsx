import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useLab } from '../state/store';
export function IconButton({label,children,onClick,active=false,disabled=false}:{label:string;children:ReactNode;onClick:()=>void;active?:boolean;disabled?:boolean}){return <button className={`icon-button ${active?'active':''}`} aria-label={label} title={label} aria-pressed={active} onClick={onClick} disabled={disabled}>{children}</button>;}
export function useReadout(){const [sim,setSim]=useState(useLab.getState().sim);useEffect(()=>{const timer=setInterval(()=>setSim(useLab.getState().sim),150);return()=>clearInterval(timer);},[]);return sim;}
export function Range({label,value,onChange,min=0,max=100,step=1,suffix=''}:{label:string;value:number;onChange:(v:number)=>void;min?:number;max?:number;step?:number;suffix?:string}){return <label className="range-field"><span>{label}<output>{value}{suffix}</output></span><input type="range" aria-label={label} min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))}/></label>;}
