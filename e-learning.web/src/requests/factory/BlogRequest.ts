import BaseRequest from '../BaseRequest';
/**
 * key base on host:port
 */
export default class BlogRequest extends BaseRequest {
  static className = 'BlogRequest';
  getBlogs() {
    const url = '/blogs';
    return this.get(url);
  }
}
