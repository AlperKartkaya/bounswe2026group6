export const emergencyContacts = [
  {
    name: 'Emergency Call Center',
    number: '112',
    note: 'Primary emergency line in Turkey for urgent medical, fire, police, and rescue support.',
  },
  {
    name: 'AFAD',
    number: '122',
    note: 'Disaster and emergency management contact line.',
  },
] as const

export const preparednessUpdates = [
  {
    title: 'Offline checklist refresh',
    category: 'Preparedness',
    body: 'Keep a printed contact sheet, medication list, and one agreed meeting point ready before connectivity becomes unreliable.',
  },
  {
    title: 'Household readiness reminder',
    category: 'Community',
    body: 'Review who in your building may need assistance, who can provide medical help, and where backup power or water may be available.',
  },
  {
    title: 'Battery and device habits',
    category: 'Operations',
    body: 'Charge key devices early, reduce background activity, and keep one communication device reserved for emergency coordination.',
  },
] as const

export const workflowSteps = [
  {
    title: 'Prepare your profile',
    detail: 'Create an account, verify your email, and add the details you may need during an emergency.',
  },
  {
    title: 'Stay ready for disruption',
    detail: 'The platform is designed for intermittent connectivity and keeps essential actions understandable during stressful situations.',
  },
  {
    title: 'Coordinate community help',
    detail: 'Request help, offer support, and stay informed as your neighborhood responds together.',
  },
] as const
