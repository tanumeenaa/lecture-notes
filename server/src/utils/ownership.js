export function ownedFilter(userId, resourceId) {
  return { _id: resourceId, user: userId };
}