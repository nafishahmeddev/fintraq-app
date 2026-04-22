export type OnboardingStepId = 'welcome' | 'profile' | 'account';

export type OnboardingStepDefinition = {
  id: OnboardingStepId;
  eyebrow: string;
  title: string;
  subtitle: string;
};

export type OnboardingFormValues = {
  name: string;
  accountName: string;
  accountHolder: string;
  accountNumber: string;
  accountType: string;
  openingBalance: string;
};
