export const PLAN_LIMITS = {
  free: {
    maxBlogPosts: 5,
    customDomains: false,
    whiteLabeling: false,
  },
  pro: {
    maxBlogPosts: Infinity,
    customDomains: true,
    whiteLabeling: false,
  },
  enterprise: {
    maxBlogPosts: Infinity,
    customDomains: true,
    whiteLabeling: true,
  },
};
