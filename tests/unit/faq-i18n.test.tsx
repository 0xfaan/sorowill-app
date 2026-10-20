import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FAQPage from '@/app/faq/page';
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key === 'items.0.question' ? '¿Cómo funciona SoroWill?' : key === 'items.0.answer' ? 'SoroWill es un contrato inteligente en Stellar Soroban que automatiza la herencia.' : key }));
describe('FAQ translations', () => { it('renders Spanish FAQ content from the faq namespace', () => { render(<FAQPage />); expect(screen.getByText('¿Cómo funciona SoroWill?')).toBeInTheDocument(); }); });
