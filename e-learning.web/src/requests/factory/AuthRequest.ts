import BaseRequest from '../BaseRequest';
/**
 * key base on host:port
 */
export default class AuthRequest extends BaseRequest {
  static className = 'AuthRequest';
  register(payload: object) {
    const url = `/users`;
    return this.post(url, payload);
  }

  login(payload: object) {
    const url = `users/sign_in`;
    return this.post(url, payload);
  }

  refreshToken(payload: object) {
    const url = `/users/refresh`;
    return this.post(url, payload);
  }

  logout() {
    const url = `/users/sign_out`;
    return this.post(url);
  }

  getInfo(payload: object) {
    const url = `/user`;
    return this.post(url, payload);
  }

  updateInfo(payload: object) {
    const url = `/user`;
    return this.put(url, payload);
  }
}
