import api from './api';

export interface User {
    id: number;
    username: string;
    role: string;
    createdAt: string;
}

export const createUser = async (username: string, password: string, role: string = 'user'): Promise<User> => {
    const response = await api.post('/users', { username, password, role });
    return response.data;
};

export const getAllUsers = async (): Promise<User[]> => {
    const response = await api.get('/users');
    return response.data;
};

export const deleteUser = async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
};
