import { render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import RootError from '@/app/error';

describe('RootError (app/error.tsx)', () => {
  it('does not render its own <html> or <body>', () => {
    const markup = renderToStaticMarkup(<RootError error={new Error('boom')} reset={() => {}} />);
    expect(markup).not.toMatch(/<html/i);
    expect(markup).not.toMatch(/<body/i);
  });

  it('still shows the error message and a retry button', () => {
    render(<RootError error={new Error('boom')} reset={() => {}} />);
    expect(screen.getByText('SoroWill hit an unexpected error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
