const requiredVariables = ['MONGODB_URI', 'JWT_SECRET', 'GEMINI_API_KEY'];
const placeholderPattern = /<[^>]+>|placeholder|replace[-_ ]?me|change[-_ ]?me|your[-_ ]|example|development[-_ ]secret|^changeme$|^todo$/i;

function isPlaceholder(name, value) {
  if (!value?.trim() || placeholderPattern.test(value.trim())) return true;
  return name === 'MONGODB_URI' && /localhost|127\.0\.0\.1/i.test(value);
}

export function validateProductionEnvironment(environment) {
  if (environment.NODE_ENV !== 'production') return;
  const invalid = requiredVariables.filter((name) => isPlaceholder(name, environment[name]));
  if (invalid.length) throw new Error(`Production environment is missing real values for: ${invalid.join(', ')}`);
}