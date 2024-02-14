export const useClientRegisterSaved = () =>
  useState<boolean | undefined>("ClientRegisterSaved", () => false);
