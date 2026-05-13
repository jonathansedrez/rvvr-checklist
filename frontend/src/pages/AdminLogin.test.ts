import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import AdminLogin from './AdminLogin.svelte';

// Prevent the router's push() from throwing in jsdom
vi.mock('svelte-spa-router', () => ({ push: vi.fn() }));

vi.mock('../lib/api', () => ({
  api: {
    auth: {
      login: vi.fn(),
    },
  },
}));

vi.mock('../lib/stores.svelte', () => ({
  authStore: {
    isAuthenticated: false,
    login: vi.fn(),
    logout: vi.fn(),
    token: null,
    user: null,
  },
}));

import { api } from '../lib/api';
import { push } from 'svelte-spa-router';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AdminLogin form', () => {
  it('renders email and password fields and a submit button', () => {
    const { getByLabelText, getByRole } = render(AdminLogin);
    expect(getByLabelText('Email')).toBeInTheDocument();
    expect(getByLabelText('Password')).toBeInTheDocument();
    expect(getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('calls api.auth.login with entered credentials on submit', async () => {
    vi.mocked(api.auth.login).mockResolvedValue({ token: 'tok', user: { id: 'u1', email: 'a@a.com' } });

    const { getByLabelText, getByRole } = render(AdminLogin);

    await fireEvent.input(getByLabelText('Email'), { target: { value: 'admin@test.com' } });
    await fireEvent.input(getByLabelText('Password'), { target: { value: 'secret' } });
    await fireEvent.submit(getByRole('button', { name: /sign in/i }).closest('form')!);

    await waitFor(() => {
      expect(api.auth.login).toHaveBeenCalledWith('admin@test.com', 'secret');
    });
  });

  it('shows an error message on login failure', async () => {
    vi.mocked(api.auth.login).mockRejectedValue(new Error('Invalid credentials'));

    const { getByLabelText, getByRole, findByText } = render(AdminLogin);

    await fireEvent.input(getByLabelText('Email'), { target: { value: 'bad@test.com' } });
    await fireEvent.input(getByLabelText('Password'), { target: { value: 'wrong' } });
    await fireEvent.submit(getByRole('button', { name: /sign in/i }).closest('form')!);

    expect(await findByText('Invalid credentials')).toBeInTheDocument();
  });

  it('redirects to /admin on successful login', async () => {
    vi.mocked(api.auth.login).mockResolvedValue({ token: 'tok', user: { id: 'u1', email: 'a@a.com' } });

    const { getByLabelText, getByRole } = render(AdminLogin);

    await fireEvent.input(getByLabelText('Email'), { target: { value: 'a@a.com' } });
    await fireEvent.input(getByLabelText('Password'), { target: { value: 'pass' } });
    await fireEvent.submit(getByRole('button', { name: /sign in/i }).closest('form')!);

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/admin');
    });
  });
});
