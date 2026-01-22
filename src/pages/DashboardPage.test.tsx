import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DashboardPage } from './DashboardPage';
import * as AuthContext from '../context/AuthContext';
import { productApi } from '../api/productApi';
import { MemoryRouter } from 'react-router-dom';

// Mock imports
vi.mock('../context/AuthContext');
vi.mock('../api/productApi');

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('DashboardPage', () => {
    const mockLogout = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        // Default auth mock
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

        // Default product mock
        vi.mocked(productApi.getProducts).mockResolvedValue([
            { id: 1, name: 'Apple', price: 100, description: 'Fresh Apple' },
            { id: 2, name: 'Banana', price: 50, description: 'Yellow Banana' },
        ]);
    });

    // [] 【前端元素】檢查頁面基本元素 (Admin)
    it('should display elements for admin user', async () => {
        render(
            <MemoryRouter>
                <DashboardPage />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('儀表板')).toBeInTheDocument();
            expect(screen.getByText('Welcome, AdminUser 👋')).toBeInTheDocument();
            expect(screen.getByText('管理員')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: '登出' })).toBeInTheDocument();
            expect(screen.getByText('🛠️ 管理後台')).toBeInTheDocument();
        });
    });

    // [] 【前端元素】檢查頁面基本元素 (General User)
    it('should display elements for general user', async () => {
        vi.mocked(AuthContext.useAuth).mockReturnValue({
            user: { username: 'NormalUser', role: 'user' },
            token: 'valid-token',
            isLoading: false,
            isAuthenticated: true,
            authExpiredMessage: null,
            login: vi.fn(),
            logout: mockLogout,
            checkAuth: vi.fn(),
            clearAuthExpiredMessage: vi.fn(),
        });

        render(
            <MemoryRouter>
                <DashboardPage />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Welcome, NormalUser 👋')).toBeInTheDocument();
            expect(screen.getByText('一般用戶')).toBeInTheDocument();
            expect(screen.queryByText('🛠️ 管理後台')).not.toBeInTheDocument();
        });
    });

    // [] 【Mock API】載入商品列表 - 成功
    it('should load and display products successfully', async () => {
        render(
            <MemoryRouter>
                <DashboardPage />
            </MemoryRouter>
        );

        // Intially loading
        expect(screen.getByText('載入商品中...')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.queryByText('載入商品中...')).not.toBeInTheDocument();
            expect(screen.getByText('Apple')).toBeInTheDocument();
            expect(screen.getByText('Banana')).toBeInTheDocument();
            expect(screen.getByText('NT$ 100')).toBeInTheDocument();
        });
    });

    // [] 【Mock API】載入商品列表 - 失敗
    it('should show error message when product load fails', async () => {
        const errorMessage = '無法載入商品資料';
        vi.mocked(productApi.getProducts).mockRejectedValue({
            response: {
                data: { message: errorMessage }
            }
        });

        render(
            <MemoryRouter>
                <DashboardPage />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(errorMessage)).toBeInTheDocument();
            expect(screen.queryByText('載入商品中...')).not.toBeInTheDocument();
            expect(screen.queryByText('Apple')).not.toBeInTheDocument();
        });
    });

    // [] 【function 邏輯】登出功能
    it('should call logout and navigate to login', async () => {
        render(
            <MemoryRouter>
                <DashboardPage />
            </MemoryRouter>
        );

        // Wait for loading to finish first to ensure everything is settled if needed, 
        // though button is likely available immediately.
        await waitFor(() => expect(screen.queryByText('載入商品中...')).not.toBeInTheDocument());

        fireEvent.click(screen.getByRole('button', { name: '登出' }));

        expect(mockLogout).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true, state: null });
    });
});
