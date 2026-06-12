import { AxiosInstance } from 'axios';
import axiosRequest from '@/utils/axios';

class BaseRequest {
  baseRequest: AxiosInstance;

  constructor() {
    this.baseRequest = axiosRequest;
  }

  async get(url = '', params = {}, showNotification = true) {
    try {
      const response = await this.baseRequest.get(`${url}`, {
        params,
      });
      return this._responseHandler(response, showNotification);
    } catch (error) {
      return this._errorHandler(error);
    }
  }

  async getWithTimeout(url = '', params = {}, timeout = 0, showNotification = true) {
    try {
      const response = await this.baseRequest.get(`${url}`, {
        params,
        timeout,
      });
      return this._responseHandler(response, showNotification);
    } catch (error) {
      return this._errorHandler(error);
    }
  }

  async put(url = '', data = {}, showNotification = true) {
    try {
      const response = await this.baseRequest.put(`${url}`, data);
      return this._responseHandler(response, showNotification);
    } catch (error) {
      return this._errorHandler(error);
    }
  }

  async post(url = '', data = {}, showNotification = true) {
    try {
      const response = await this.baseRequest.post(`${url}`, data);
      return this._responseHandler(response, showNotification);
    } catch (error) {
      return this._errorHandler(error);
    }
  }

  async delete(url = '', params = {}, showNotification = true) {
    try {
      const response = await this.baseRequest.delete(`${url}`, params);
      return this._responseHandler(response, showNotification);
    } catch (error) {
      return this._errorHandler(error);
    }
  }

  _responseHandler(response: any, showNotification: boolean) {
    const { status } = response;

    if (status >= 400) {
      if (!showNotification) {
        throw new Error('Request failed');
      }

      throw new Error('Request failed');
    }

    return response;
  }

  _errorHandler(err: any) {
    const errorRes = err.response;
    // if (err.response && err.response.status === 401) { // Unauthorized (session timeout)
    //   window.location.href = '/';
    // }

    if (errorRes && errorRes.status === 401) {
      // Unauthorized (session timeout)
      // Solved the problem in interceptor
    }
    // toast.error(errorRes.data.message || 'Something went wrong');
    throw errorRes.data;
  }
}

export default BaseRequest;
