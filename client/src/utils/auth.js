import Cookies from 'js-cookie';
import axios from "axios";

const axiosInstance = axios.create();

axiosInstance.interceptors.request.use(
    (config) => {
        const token = getToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            clearToken();
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;

export const setAuthToken = (token, isAdmin) => {
    Cookies.set('token', token, { expires: 7 });
    Cookies.set('isAdmin', isAdmin, { expires: 7 });
};

export const getToken = () => {
    return Cookies.get('token');
};

export const clearToken = () => {
    Cookies.remove('token');
    Cookies.remove('isAdmin');
};

export const isAdmin = () => {
    return Cookies.get('isAdmin') === 'true';
};
