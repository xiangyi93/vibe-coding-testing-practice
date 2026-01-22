import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginPage } from './LoginPage';
import * as AuthContext from '../context/AuthContext';
import * as RouterModule from 'react-router-dom';

// Mock imports
vi.mock('../context/AuthContext');
vi.mock('react-router-dom');

describe('LoginPage', () => {
    const mockLogin = vi.fn();
    const mockNavigate = vi.fn();
    const mockClearAuthExpiredMessage = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        // Default mock implementation
        vi.mocked(AuthContext.useAuth).mockReturnValue({
            login: mockLogin,
            isAuthenticated: false,
            authExpiredMessage: null,
            clearAuthExpiredMessage: mockClearAuthExpiredMessage,
            user: null,
            token: null,
            isLoading: false,
            logout: vi.fn(),
            checkAuth: vi.fn(),
        });

        vi.mocked(RouterModule.useNavigate).mockReturnValue(mockNavigate);
    });

    // [] 【前端元素】檢查頁面基本元素
    it('should display basic elements', () => {
        render(<LoginPage />);

        expect(screen.getByText('歡迎回來')).toBeInTheDocument();
        expect(screen.getByLabelText('電子郵件')).toBeInTheDocument();
        expect(screen.getByLabelText('密碼')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '登入' })).toBeInTheDocument();
    });

    // [] 【function 邏輯】Email 格式驗證 - 無效格式
    it('should show error for invalid email format', () => {
        render(<LoginPage />);

        const emailInput = screen.getByLabelText('電子郵件');
        const loginButton = screen.getByRole('button', { name: '登入' });

        fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
        fireEvent.click(loginButton);

        expect(screen.getByText('請輸入有效的 Email 格式')).toBeInTheDocument();
        expect(mockLogin).not.toHaveBeenCalled();
    });

    // [] 【function 邏輯】密碼格式驗證 - 長度不足
    it('should show error for short password', () => {
        render(<LoginPage />);

        const passwordInput = screen.getByLabelText('密碼');
        const loginButton = screen.getByRole('button', { name: '登入' });

        fireEvent.change(passwordInput, { target: { value: '123' } });
        fireEvent.click(loginButton);

        expect(screen.getByText('密碼必須至少 8 個字元')).toBeInTheDocument();
        expect(mockLogin).not.toHaveBeenCalled();
    });

    // [] 【function 邏輯】密碼格式驗證 - 缺少英文字母或數字
    it('should show error for password missing letters or numbers', () => {
        render(<LoginPage />);

        const passwordInput = screen.getByLabelText('密碼');
        const loginButton = screen.getByRole('button', { name: '登入' });

        fireEvent.change(passwordInput, { target: { value: '12345678' } });
        fireEvent.click(loginButton);

        expect(screen.getByText('密碼必須包含英文字母和數字')).toBeInTheDocument();
        expect(mockLogin).not.toHaveBeenCalled();
    });

    // [] 【Mock API】登入成功
    it('should call login API and navigate to dashboard on success', async () => {
        mockLogin.mockResolvedValueOnce(undefined);
        render(<LoginPage />);

        fireEvent.change(screen.getByLabelText('電子郵件'), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText('密碼'), { target: { value: 'password123' } });
        fireEvent.click(screen.getByRole('button', { name: '登入' }));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
            expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
        });
    });

    // [] 【Mock API】登入失敗
    it('should show error message on login failure', async () => {
        const errorMessage = '帳號或密碼錯誤';
        mockLogin.mockRejectedValueOnce({
            response: {
                data: { message: errorMessage }
            }
        });
        render(<LoginPage />);

        fireEvent.change(screen.getByLabelText('電子郵件'), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText('密碼'), { target: { value: 'password123' } });
        fireEvent.click(screen.getByRole('button', { name: '登入' }));

        await waitFor(() => {
            expect(screen.getByText(errorMessage)).toBeInTheDocument();
            expect(mockNavigate).not.toHaveBeenCalled();
        });
    });

    // [] 【前端元素】Loading 狀態
    it('should show loading state during login', async () => {
        // Mock a promise that doesn't resolve immediately
        mockLogin.mockReturnValue(new Promise(() => { }));
        render(<LoginPage />);

        fireEvent.change(screen.getByLabelText('電子郵件'), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText('密碼'), { target: { value: 'password123' } });
        fireEvent.click(screen.getByRole('button', { name: '登入' }));

        expect(screen.getByRole('button')).toBeDisabled();
        expect(screen.getByText('登入中...')).toBeInTheDocument();
    });

    // [] 【驗證權限】已登入自動導向
    it('should redirect to dashboard if already authenticated', () => {
        vi.mocked(AuthContext.useAuth).mockReturnValue({
            login: mockLogin,
            isAuthenticated: true,
            authExpiredMessage: null,
            clearAuthExpiredMessage: mockClearAuthExpiredMessage,
            user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'user' },
            token: 'valid-token',
            isLoading: false,
            logout: vi.fn(),
            checkAuth: vi.fn(),
        });

        render(<LoginPage />);

        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
});
