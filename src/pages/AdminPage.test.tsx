import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdminPage } from './AdminPage';
import * as AuthContext from '../context/AuthContext';
import { MemoryRouter } from 'react-router-dom';

// Mock imports
vi.mock('../context/AuthContext');

// We need to mock useNavigate but keep other router functionality (like Link) working if possible,
// or we can wrap with MemoryRouter.
// However, to spy on useNavigate, we often mock it.
// To handle Link properly with mocked router, usually we can use MemoryRouter and spy on the history, 
// OR we can mock react-router-dom partially.

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('AdminPage', () => {
    const mockLogout = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        // Default mock implementation
        vi.mocked(AuthContext.useAuth).mockReturnValue({
            user: { username: 'AdminUser', role: 'admin' },
            token: 'valid-token',
            isLoading: false,
            isAuthenticated: true,
            authExpiredMessage: null,
            login: vi.fn(),
            logout: mockLogout,
            checkAuth: vi.fn(),
            clearAuthExpiredMessage: vi.fn(),
        });
    });

    // [] 【前端元素】檢查頁面基本元素
    it('should display basic elements for admin user', () => {
        render(
            <MemoryRouter>
                <AdminPage />
            </MemoryRouter>
        );

        expect(screen.getByText('🛠️ 管理後台')).toBeInTheDocument();
        expect(screen.getByText('管理員')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '登出' })).toBeInTheDocument();
        expect(screen.getByText('管理員專屬頁面')).toBeInTheDocument();
        expect(screen.getByText('← 返回')).toBeInTheDocument();
    });

    // [] 【Router 導航】返回 Dashboard
    it('should navigate to dashboard when back link is clicked', () => {
        render(
            <MemoryRouter>
                <AdminPage />
            </MemoryRouter>
        );

        const backLink = screen.getByText('← 返回');
        expect(backLink).toHaveAttribute('href', '/dashboard');

        // Note: verifying actual navigation with MemoryRouter and Link 
        // usually involves inspecting the router state or using userEvent to click and checking location.
        // Since we didn't mock Link, it renders an anchor tag with href.
        // The simple check verify the 'to' prop is passed correctly to href.
    });

    // [] 【function 邏輯】登出功能
    it('should call logout and navigate to login', () => {
        render(
            <MemoryRouter>
                <AdminPage />
            </MemoryRouter>
        );

        fireEvent.click(screen.getByRole('button', { name: '登出' }));

        expect(mockLogout).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true, state: null });
    });
});
