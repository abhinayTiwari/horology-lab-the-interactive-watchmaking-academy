import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, expect, it } from 'vitest';
import { LessonPage } from '../features/academy/Academy';
import { useLab } from '../state/store';
afterEach(cleanup);
it('provides feedback for reasoning and persists only a correct answer',()=>{
 useLab.setState({completed:[]});render(<MemoryRouter initialEntries={['/academy/gears']}><Routes><Route path="/academy/:id" element={<LessonPage/>}/></Routes></MemoryRouter>);
 fireEvent.click(screen.getByLabelText(/⅔ rpm/));fireEvent.click(screen.getByRole('button',{name:/Check my reasoning/}));expect(screen.getByRole('status')).toHaveTextContent('Try another prediction');expect(useLab.getState().completed).toEqual([]);
 fireEvent.click(screen.getByLabelText(/6 rpm in the opposite/));fireEvent.click(screen.getByRole('button',{name:/Check my reasoning/}));expect(screen.getByRole('status')).toHaveTextContent('Lesson completed');expect(useLab.getState().completed).toContain('gears');
});
it('handles an unknown lesson with a useful recovery link',()=>{render(<MemoryRouter initialEntries={['/academy/missing']}><Routes><Route path="/academy/:id" element={<LessonPage/>}/></Routes></MemoryRouter>);expect(screen.getByRole('link',{name:'Return to the academy'})).toHaveAttribute('href','/academy');});
