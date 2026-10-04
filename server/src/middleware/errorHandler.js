export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.name === 'ZodError') return res.status(400).json({ message: error.issues[0]?.message ?? 'Invalid request.' });
  if (error instanceof Error && error.message.startsWith('Upload ')) return res.status(400).json({ message: error.message });
  if (error.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ message: 'Each upload must be smaller than 200 MB.' });
  if (error.code === 'LIMIT_FILE_COUNT' || error.code === 'LIMIT_UNEXPECTED_FILE') return res.status(400).json({ message: 'Upload up to 4 audio files and 8 board photos.' });
  if (error.code === 11000) return res.status(409).json({ message: 'That value is already in use.' });
  const status = error.statusCode ?? 500;
  res.status(status).json({ message: status < 500 ? error.message : 'Something went wrong.' });
}