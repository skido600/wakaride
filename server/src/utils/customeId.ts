function generateuserId() {
  const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `user${randomPart}`;
}
function generateDriverId() {
  const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `Driver${randomPart}`;
}

export { generateuserId, generateDriverId };
