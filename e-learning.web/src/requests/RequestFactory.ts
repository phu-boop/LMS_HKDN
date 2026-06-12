import requestMap from './factory';

const instances: any = {};

export default class RequestFactory {
  static getRequest(className: string) {
    const RequestClass = requestMap[className];
    if (!RequestClass) {
      throw new Error(`Invalid request class name: ${className}`);
    }

    let requestInstance = instances[className];
    if (!requestInstance) {
      requestInstance = new RequestClass();
      instances[className] = requestInstance;
    }
    return requestInstance;
  }
}
