export enum AppRoutes {
  INDEX = '/',
  DASHBOARD = '/dashboard',
  PROFILE = '/profile',
  TASK = '/task',
  AUTH = '/auth',
  AUTH_SIGN_IN = '/auth/sigin',
  AUTH_SIGN_UP = '/auth/signup',
  CONTACTS = '/contacts',
  ADMIN = '/admin',
  PREMIUM = '/premium',
  CATEGORY = '/category',
}

export enum Roles {
  USER = 'User',
  WORKER = 'Worker',
  MODERATOR = 'Moderator',
  ADMIN = 'Admin',
}

export interface errors {
  [index: string]: string
}

export const errors: errors = {
  SignIn: 'Спробуйте ввійти за допомогою іншого облікового запису.',
  OAuthSignIn: 'Спробуйте ввійти за допомогою іншого облікового запису.',
  OAuthCallback: 'Спробуйте ввійти за допомогою іншого облікового запису.',
  OAuthCreateAccount: 'Спробуйте ввійти за допомогою іншого облікового запису.',
  EmailCreateAccount: 'Спробуйте ввійти за допомогою іншого облікового запису.',
  Callback: 'Спробуйте ввійти за допомогою іншого облікового запису.',
  OAuthAccountNotLinked:
    'Щоб підтвердити свою особу, увійдіть за допомогою того самого облікового запису, який використовували спочатку.',
  EmailSignIn: 'Не вдалося надіслати електронний лист.',
  CredentialsSignIn:
    'Помилка входу. Перевірте правильність наданих вами даних.',
  SessionRequired: 'Увійдіть, щоб отримати доступ до цієї сторінки.',
  default: 'Не вдається ввійти.',
}

export const centerTownGeoCode = {
  lat: 50.264915,
  lng: 28.661954,
}

export enum TaskStatuses {
  PENDING = 'pending',
  PENDING_SELECTION = 'pending selection',
  REJECTED = 'rejected',
  IN_WORK = 'in work',
  EXPIRED = 'expired',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export enum TaskView {
  CARD = 'card',
  LIST = 'list',
}
export const saltRounds = 10
