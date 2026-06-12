import { FormEventHandler, ReactNode } from 'react';
// form
import { FormProvider as Form, UseFormReturn } from 'react-hook-form';

// ----------------------------------------------------------------------

type Props = {
  children: ReactNode;
  methods: UseFormReturn<any>;
  onSubmit?: FormEventHandler<HTMLFormElement>;
};

export default function FormProvider({ children, onSubmit, methods }: Props) {
  return (
    <Form {...methods}>
      {/*
        Default HTML form method is GET — without POST, a failed/missed preventDefault
        navigates with ?email=&password= in the URL (no API call). Always use POST.
      */}
      <form method="post" noValidate onSubmit={onSubmit}>
        {children}
      </form>
    </Form>
  );
}
