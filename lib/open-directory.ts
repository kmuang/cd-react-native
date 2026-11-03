import { router } from 'expo-router';

export function openDirectory(params?: { group?: string; focus?: string }) {
  const query = {
    group: params?.group ?? '',
    focus: params?.focus ?? '',
    v: String(Date.now()),
  };

  if (typeof router.canDismiss === 'function' && router.canDismiss()) {
    router.dismissAll();
  }

  router.replace({
    pathname: '/directory',
    params: query,
  });
}
