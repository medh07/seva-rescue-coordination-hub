import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ResQConnection } from '../components/resq/Connection';
import { canUseCommandCentre } from '../lib/resq/requests';
const mocks = vi.hoisted(() => ({ callback: null as null | ((event: string, session: unknown) => void), roles: [] as {role: string; active: boolean}[], requestRead: vi.fn(), logout: vi.fn(), login: vi.fn() }));
vi.mock('../lib/resq/client', () => ({ resqClient: () => ({
  auth: {
    onAuthStateChange: (callback: typeof mocks.callback) => { mocks.callback = callback; return { data: { subscription: { unsubscribe: vi.fn() } } }; },
    signInWithPassword: mocks.login,
    signOut: mocks.logout,
  },
  from: (table: string) => {
    if (table === 'user_roles') return { select: () => ({ eq: () => ({ eq: async () => ({ data: mocks.roles, error: null }) }) }) };
    mocks.requestRead();
    const query = { order: () => query, range: async () => ({ data: [{ id:'1',tracking_code:'RESQ-TEST',details:'Test rescue report',status:'received',verification:'pending',reported_severity:'high',operational_priority:null,people_affected:2,latitude:null,longitude:null,landmark:null,created_at:'2026-01-01T00:00:00Z',life_threatening:false }], error:null }) };
    return { select: () => query };
  },
}) }));
const session = { user: { id: 'user-1', email:'test@example.com' } };
beforeEach(() => { mocks.roles=[]; mocks.requestRead.mockClear(); mocks.logout.mockResolvedValue({error:null}); });
describe('ResQ access boundary', () => {
  it('only allows active officer/admin roles', () => {
    expect(canUseCommandCentre([{role:'officer',active:true}])).toBe(true);
    expect(canUseCommandCentre([{role:'admin',active:false}])).toBe(false);
    expect(canUseCommandCentre([{role:'volunteer',active:true}])).toBe(false);
  });
  it('does not read requests before login or for an unapproved account', async () => {
    render(<ResQConnection><div>Original demo</div></ResQConnection>);
    expect(await screen.findByText('Officer sign in')).toBeInTheDocument();
    expect(mocks.requestRead).not.toHaveBeenCalled();
    act(() => mocks.callback?.('SIGNED_IN', session));
    expect(await screen.findByText('Login successful — officer access pending')).toBeInTheDocument();
    expect(mocks.requestRead).not.toHaveBeenCalled();
    expect(screen.queryByText('Original demo')).not.toBeInTheDocument();
  });
  it('loads permitted records for an officer and removes them on sign-out', async () => {
    mocks.roles=[{role:'officer',active:true}];
    render(<ResQConnection><div>Original demo</div></ResQConnection>);
    act(() => mocks.callback?.('SIGNED_IN', session));
    expect(await screen.findByText('Test rescue report')).toBeInTheDocument();
    expect(screen.getByText('Officer priority: Not reviewed')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Sign out'));
    await waitFor(() => expect(screen.queryByText('Test rescue report')).not.toBeInTheDocument());
    expect(await screen.findByText('Officer sign in')).toBeInTheDocument();
  });
});
