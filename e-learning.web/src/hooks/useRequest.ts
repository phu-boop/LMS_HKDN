import { useMemo } from 'react';
import RequestFactory from '../requests/RequestFactory';

export default function useRequest(requestClass: any) {
  return useMemo(() => {
    const className = requestClass.className || requestClass.name;
    return RequestFactory.getRequest(className);
  }, [requestClass]);
}
